import PDFDocument from "pdfkit";
import type { CalibrationReportService } from "./calibration-report.service";

type Result = ReturnType<CalibrationReportService["preview"]>;

const PAGE_MARGIN = 48;
const TABLE_HEADER_HEIGHT = 20;
const ROW_PADDING = 5;
const COLUMN_GAP = 4;

function text(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function safeFilenamePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function warningLabel(code: string): string {
  switch (code) {
    case "MISSING_HARDWARE_MODEL":
      return "Hardware model missing";
    case "MISSING_CERTIFICATE_REFERENCE":
      return "Certificate reference missing";
    default:
      return code;
  }
}

function ensureVerticalSpace(
  doc: PDFKit.PDFDocument,
  requiredHeight: number,
  onNewPage?: () => void
) {
  const bottom = doc.page.height - PAGE_MARGIN;

  if (doc.y + requiredHeight > bottom) {
    doc.addPage();
    onNewPage?.();
  }
}

function addSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  ensureVerticalSpace(doc, 32);

  doc.moveDown(0.5).font("Helvetica-Bold").fontSize(13).text(title).moveDown(0.5);
}

function addKeyValue(doc: PDFKit.PDFDocument, label: string, value: unknown) {
  ensureVerticalSpace(doc, 18);

  const x = doc.x;
  const y = doc.y;
  const labelWidth = 135;

  doc.font("Helvetica-Bold").fontSize(9).text(label, x, y, {
    width: labelWidth,
    continued: false,
  });

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(text(value), x + labelWidth, y, {
      width: doc.page.width - PAGE_MARGIN - (x + labelWidth),
    });

  doc.moveDown(0.25);
}

function addSummaryBox(
  doc: PDFKit.PDFDocument,
  label: string,
  value: number,
  x: number,
  y: number,
  width: number
) {
  const height = 42;

  doc.rect(x, y, width, height).stroke();

  doc
    .font("Helvetica")
    .fontSize(8)
    .text(label, x + 7, y + 7, {
      width: width - 14,
      align: "center",
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(String(value), x + 7, y + 21, {
      width: width - 14,
      align: "center",
    });
}

function addPageNumber(doc: PDFKit.PDFDocument, pageNumber: number) {
  const previousY = doc.y;

  doc
    .font("Helvetica")
    .fontSize(8)
    .text(`BIO-EMS Calibration History · Page ${pageNumber}`, PAGE_MARGIN, doc.page.height - 32, {
      width: doc.page.width - PAGE_MARGIN * 2,
      align: "center",
    });

  doc.y = previousY;
}

function addTableHeader(doc: PDFKit.PDFDocument, columns: Array<{ title: string; width: number }>) {
  const startX = PAGE_MARGIN;
  const startY = doc.y;

  let x = startX;

  doc.font("Helvetica-Bold").fontSize(7);

  for (const column of columns) {
    doc.rect(x, startY, column.width, TABLE_HEADER_HEIGHT).stroke();

    doc.text(column.title, x + ROW_PADDING, startY + 5, {
      width: column.width - ROW_PADDING * 2,
      height: TABLE_HEADER_HEIGHT - 6,
      ellipsis: true,
    });

    x += column.width + COLUMN_GAP;
  }

  doc.y = startY + TABLE_HEADER_HEIGHT + COLUMN_GAP;
}

function rowHeight(doc: PDFKit.PDFDocument, values: string[], columns: Array<{ width: number }>) {
  return (
    Math.max(
      ...values.map((value, index) =>
        doc.heightOfString(value, {
          width: columns[index].width - ROW_PADDING * 2,
        })
      )
    ) +
    ROW_PADDING * 2
  );
}

function addTableRow(doc: PDFKit.PDFDocument, values: string[], columns: Array<{ width: number }>) {
  const height = rowHeight(doc, values, columns);
  const startY = doc.y;

  let x = PAGE_MARGIN;

  doc.font("Helvetica").fontSize(7);

  values.forEach((value, index) => {
    const column = columns[index];

    doc.rect(x, startY, column.width, height).stroke();

    doc.text(value, x + ROW_PADDING, startY + ROW_PADDING, {
      width: column.width - ROW_PADDING * 2,
      height: height - ROW_PADDING * 2,
    });

    x += column.width + COLUMN_GAP;
  });

  doc.y = startY + height + COLUMN_GAP;
}

export function renderCalibrationPdf(result: Result, generatedBy: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: PAGE_MARGIN,
      bufferPages: true,
      info: {
        Title: "BIO-EMS Calibration History",
        Subject: "Calibration History Report",
        Author: generatedBy,
        Creator: "BIO-EMS",
      },
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    doc.on("error", reject);

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    const sensorByUuid = new Map(result.sensors.map((sensor) => [sensor.uuid, sensor]));

    doc.font("Helvetica-Bold").fontSize(20).text("BIO-EMS", { align: "left" });

    doc.font("Helvetica-Bold").fontSize(16).text("Calibration History Report").moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(9)
      .text("Controlled reporting output generated from canonical BIO-EMS evidence.")
      .moveDown(1);

    addSectionTitle(doc, "Report identity");

    addKeyValue(doc, "Report ID", result.identity.reportId);
    addKeyValue(doc, "Contract version", result.identity.contractVersion);
    addKeyValue(doc, "Generated at", result.provenance.generatedAt);
    addKeyValue(doc, "Generated by", generatedBy);
    addKeyValue(doc, "Source", result.provenance.source);
    addKeyValue(doc, "Range semantics", result.provenance.rangeSemantics);
    addKeyValue(doc, "From", result.scope.from);
    addKeyValue(doc, "To", result.scope.to);
    addKeyValue(doc, "Time zone", result.scope.timeZone);
    addKeyValue(doc, "Language", result.scope.language);

    addSectionTitle(doc, "Summary");

    ensureVerticalSpace(doc, 100);

    const summaryItems = [
      ["Sensors", result.summary.sensors],
      ["Records", result.summary.records],
      ["PASS", result.summary.pass],
      ["FAIL", result.summary.fail],
      ["Overdue", result.summary.overdue],
      ["Not calibrated", result.summary.notCalibrated],
    ] as const;

    const usableWidth = doc.page.width - PAGE_MARGIN * 2;
    const boxGap = 8;
    const boxWidth = (usableWidth - boxGap * 2) / 3;
    const summaryStartY = doc.y;

    summaryItems.forEach(([label, value], index) => {
      const row = Math.floor(index / 3);
      const column = index % 3;

      addSummaryBox(
        doc,
        label,
        value,
        PAGE_MARGIN + column * (boxWidth + boxGap),
        summaryStartY + row * 50,
        boxWidth
      );
    });

    doc.y = summaryStartY + 100;

    addSectionTitle(doc, "Evidence quality");

    if (result.quality.warnings.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .text("No evidence-quality warnings were recorded for this report.");
    } else {
      for (const warning of result.quality.warnings) {
        const sensor = sensorByUuid.get(warning.sensorUuid);

        ensureVerticalSpace(doc, 20);

        doc
          .font("Helvetica")
          .fontSize(9)
          .text(`• ${sensor?.name ?? warning.sensorUuid}: ${warningLabel(warning.code)}`);
      }
    }

    addSectionTitle(doc, "Sensor scope");

    for (const sensor of result.sensors) {
      ensureVerticalSpace(doc, 54);

      doc.font("Helvetica-Bold").fontSize(9).text(`${sensor.name} · ${sensor.code}`);

      doc
        .font("Helvetica")
        .fontSize(8)
        .text(
          `${text(sensor.site_name)} · ${text(sensor.room_name)} · ${text(
            sensor.sensor_type
          )} · ${text(sensor.unit)}`
        );

      doc
        .font("Helvetica")
        .fontSize(8)
        .text(
          `Calibration: ${text(sensor.calibration_status)} · Due classification: ${text(
            sensor.dueClassification
          )} · Certificate: ${text(sensor.certificate_reference)}`
        );

      doc.moveDown(0.5);
    }

    addSectionTitle(doc, "Calibration history");

    const columns = [
      { title: "Performed", width: 74 },
      { title: "Sensor", width: 78 },
      { title: "Result", width: 42 },
      { title: "Due", width: 68 },
      { title: "Offset", width: 42 },
      { title: "Certificate", width: 70 },
      { title: "Performed by", width: 62 },
      { title: "Notes", width: 72 },
    ];

    const writeHeader = () => addTableHeader(doc, columns);

    writeHeader();

    if (result.records.length === 0) {
      ensureVerticalSpace(doc, 30, writeHeader);

      doc
        .font("Helvetica")
        .fontSize(9)
        .text("No calibration attempts were recorded in the selected range.");
    } else {
      for (const record of result.records) {
        const sensor = sensorByUuid.get(record.sensor_uuid);

        const values = [
          text(record.performed_at),
          sensor ? `${sensor.name}\n${sensor.code}` : record.sensor_uuid,
          text(record.result),
          text(record.due_at),
          text(record.offset),
          text(record.certificate_reference),
          text(record.performed_by_username),
          text(record.notes),
        ];

        const requiredHeight = rowHeight(doc, values, columns) + COLUMN_GAP;

        ensureVerticalSpace(doc, requiredHeight, writeHeader);

        addTableRow(doc, values, columns);
      }
    }

    addSectionTitle(doc, "Approval fields");

    const approvalStartY = doc.y;

    ensureVerticalSpace(doc, 95);

    const approvalWidth = (usableWidth - 12) / 2;
    const approvalHeight = 74;

    const approvalBlocks = [
      { x: PAGE_MARGIN, label: "Prepared by" },
      { x: PAGE_MARGIN + approvalWidth + 12, label: "Reviewed / Approved by" },
    ];

    approvalBlocks.forEach(({ x, label }) => {
      doc.rect(x, approvalStartY, approvalWidth, approvalHeight).stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(label, x + 8, approvalStartY + 8, {
          width: approvalWidth - 16,
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .text("Name:", x + 8, approvalStartY + 28)
        .text("Signature:", x + 8, approvalStartY + 42)
        .text("Date:", x + 8, approvalStartY + 56);
    });

    doc.y = approvalStartY + approvalHeight + 10;

    const range = doc.bufferedPageRange();

    for (let index = 0; index < range.count; index += 1) {
      doc.switchToPage(range.start + index);
      addPageNumber(doc, index + 1);
    }

    doc.end();
  });
}

export function calibrationPdfFilename(result: Result) {
  const from = safeFilenamePart(result.scope.from.slice(0, 10));
  const to = safeFilenamePart(result.scope.to.slice(0, 10));
  const reportId = safeFilenamePart(result.identity.reportId);

  return `bio-ems_calibration-history_${from}_${to}_${reportId}.pdf`;
}
