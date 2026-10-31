import { startBluetoothBridgeRuntime } from "./modules/controller-runtime/bluetooth-bridge.runtime";
import { readFileSync } from "node:fs";
import { createServer as createHttpsServer } from "node:https";
import app from "./app";
import { startCompanyConnection } from "./modules/company-cloud/runtime";
import { config } from "./config/config";
import { startNotificationDeliveryRuntime } from "./modules/notification/notification-delivery.runtime";

const PORT = config.port;

const useTls = Boolean(config.tls.pfxPath && config.tls.passphrase);
const server = useTls
  ? createHttpsServer(
      { pfx: readFileSync(config.tls.pfxPath), passphrase: config.tls.passphrase },
      app
    )
  : app;

server.listen(PORT, () => {
  console.log("==================================");
  console.log(" BIO EMS Backend Started");
  console.log(` Environment : ${config.nodeEnv}`);
  console.log(` Protocol    : ${useTls ? "https" : "http"}`);
  console.log(` Port        : ${PORT}`);
  console.log("==================================");
});

startNotificationDeliveryRuntime();
startCompanyConnection(app);

const stopBluetoothBridge = useTls
  ? startBluetoothBridgeRuntime(`https://localhost:${PORT}`)
  : () => undefined;
process.once("exit", stopBluetoothBridge);
