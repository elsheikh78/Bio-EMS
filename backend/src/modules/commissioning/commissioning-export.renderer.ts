import PDFDocument from "pdfkit";
import type { CommissioningService } from "./commissioning.service";

type RecordShape = ReturnType<CommissioningService["getSessionRecord"]>;

export function renderCommissioningCsv(record: RecordShape): string {
  const rows = [
    [
      "check_key",
      "title",
      "mandatory",
      "physical_or_live",
      "state",
      "evidence_kind",
      "evidence_reference",
    ],
  ];
  for (const item of record.checks as Array<Record<string, unknown>>) {
    rows.push(
      [
        "checkKey",
        "title",
        "mandatory",
        "physicalOrLiveGate",
        "state",
        "evidenceKind",
        "evidenceReference",
      ].map((key) => csv(item[key]))
    );
  }
  return `${rows.map((row) => row.join(",")).join("\r\n")}\r\n`;
}

export async function renderCommissioningPdf(record: RecordShape): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: "A4",
      margin: 45,
      info: { Title: "BIO-EMS Commissioning Record" },
    });
    const chunks: Buffer[] = [];
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("error", reject);
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.fontSize(18).text("BIO-EMS Commissioning Record");
    document
      .moveDown()
      .fontSize(10)
      .text(`Session: ${(record.session as { uuid: string }).uuid}`);
    document.text(`Generated: ${new Date().toISOString()}`);
    document.text(`Decision readiness: ${record.evaluation.acceptable ? "READY" : "BLOCKED"}`);
    document.moveDown();
    for (const item of record.checks as Array<Record<string, unknown>>) {
      document.fontSize(11).text(`${item.checkKey}: ${item.state}`);
      document.fontSize(9).fillColor("#555555").text(String(item.title));
      document.fillColor("#000000").moveDown(0.5);
    }
    document
      .moveDown()
      .fontSize(9)
      .text(
        "Physical, live-provider, field UAT and customer acceptance remain external unless attributable evidence is present in this record."
      );
    document.end();
  });
}

function csv(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
