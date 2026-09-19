import { spawn } from "node:child_process";
import type { DeliveryEnvelope } from "../notification/notification-delivery.repository";
import type { DeliveryProvider } from "../notification/notification-delivery.worker";

export interface ModemSmsTransport {
  send(comPort: string, recipient: string, message: string, signal: AbortSignal): Promise<string>;
}

export class LocalModemSmsProvider implements DeliveryProvider {
  readonly channel = "SMS" as const;
  readonly name = "WINDOWS_LOCAL_MODEM";
  constructor(
    private readonly comPort: string,
    private readonly transport: ModemSmsTransport = new WindowsPowerShellModemTransport()
  ) {}
  async send(envelope: DeliveryEnvelope, signal: AbortSignal): Promise<{ messageId: string }> {
    const text =
      `BIO-EMS ${envelope.delivery.severity}: ${String(envelope.payload.alarmType ?? envelope.payload.eventType ?? "ALARM")} ${String(envelope.payload.triggerValue ?? "")}`.trim();
    return { messageId: await this.transport.send(this.comPort, envelope.recipient, text, signal) };
  }
}

export class WindowsPowerShellModemTransport implements ModemSmsTransport {
  send(comPort: string, recipient: string, message: string, signal: AbortSignal): Promise<string> {
    if (process.platform !== "win32")
      return Promise.reject(new Error("Local modem transport requires Windows"));
    if (!/^COM(?:[1-9]|[1-9]\d{1,2})$/i.test(comPort))
      return Promise.reject(new Error("Invalid modem COM port"));
    if (!/^\+[1-9]\d{7,14}$/.test(recipient))
      return Promise.reject(new Error("SMS recipient must be E.164"));
    return new Promise((resolve, reject) => {
      const child = spawn(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", MODEM_SCRIPT],
        {
          windowsHide: true,
          env: {
            ...process.env,
            BIOEMS_MODEM_COM_PORT: comPort,
            BIOEMS_MODEM_RECIPIENT: recipient,
            BIOEMS_MODEM_MESSAGE: message,
          },
        }
      );
      let output = "";
      let error = "";
      child.stdout.on("data", (value) => (output += String(value)));
      child.stderr.on("data", (value) => (error += String(value)));
      const abort = () => child.kill();
      signal.addEventListener("abort", abort, { once: true });
      child.once("error", reject);
      child.once("close", (code) => {
        signal.removeEventListener("abort", abort);
        if (signal.aborted) return reject(new Error("Modem operation aborted"));
        const receipt = /BIOEMS_SMS_ID=(\d+)/.exec(output)?.[1];
        if (code !== 0 || !receipt)
          return reject(new Error(`Modem rejected SMS${error ? ": transport error" : ""}`));
        resolve(receipt);
      });
    });
  }
}

const MODEM_SCRIPT = String.raw`
$ErrorActionPreference='Stop'; $p=$null
try {
  $p=New-Object System.IO.Ports.SerialPort($env:BIOEMS_MODEM_COM_PORT,115200,'None',8,'One')
  $p.ReadTimeout=1000; $p.WriteTimeout=5000; $p.NewLine=[string][char]13; $p.Open()
  $p.WriteLine('AT'); Start-Sleep -Milliseconds 500; if(($p.ReadExisting()) -notmatch 'OK'){throw 'No modem response'}
  $p.WriteLine('AT+CMGF=1'); Start-Sleep -Milliseconds 500; if(($p.ReadExisting()) -notmatch 'OK'){throw 'SMS text mode rejected'}
  $p.Write('AT+CMGS="' + $env:BIOEMS_MODEM_RECIPIENT + '"' + [char]13); Start-Sleep -Milliseconds 500
  $p.Write($env:BIOEMS_MODEM_MESSAGE + [char]26)
  $deadline=(Get-Date).AddSeconds(30); $reply=''
  do { Start-Sleep -Milliseconds 250; $reply += $p.ReadExisting(); if($reply -match 'ERROR'){throw 'SMS send rejected'} } while((Get-Date) -lt $deadline -and $reply -notmatch '\+CMGS:\s*(\d+)')
  if($reply -notmatch '\+CMGS:\s*(\d+)'){throw 'SMS receipt timeout'}
  Write-Output ('BIOEMS_SMS_ID=' + $Matches[1])
} finally { if($p -and $p.IsOpen){$p.Close()}; if($p){$p.Dispose()} }
`;
