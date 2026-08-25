import PDFDocument from "pdfkit";
import type { TemperaturePerformanceReportService } from "./temperature-performance-report.service";

type Result = Awaited<
  ReturnType<TemperaturePerformanceReportService["preview"]>
>;

const PAGE_MARGIN = 48;
const TABLE_HEADER_HEIGHT = 20;
const ROW_PADDING = 5;
const COLUMN_GAP = 4;
const FOOTER_HEIGHT = 20;

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

function ensureVerticalSpace(
  doc: PDFKit.PDFDocument,
  requiredHeight: number,
  onNewPage?: () => void,
) {
  const bottom =
    doc.page.height -
    PAGE_MARGIN -
    FOOTER_HEIGHT;

  if (doc.y + requiredHeight > bottom) {
    doc.addPage();
    onNewPage?.();
  }
}

function addSectionTitle(
  doc: PDFKit.PDFDocument,
  title: string,
) {
  ensureVerticalSpace(doc, 32);

  doc
    .moveDown(0.5)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(title)
    .moveDown(0.5);
}

function addKeyValue(
  doc: PDFKit.PDFDocument,
  label: string,
  value: unknown,
) {
  ensureVerticalSpace(doc, 18);

  const x = PAGE_MARGIN;
  const y = doc.y;
  const labelWidth = 135;
  const valueWidth =
    doc.page.width -
    PAGE_MARGIN -
    (x + labelWidth);

  const valueText = text(value);

  const height = Math.max(
    doc.heightOfString(label, {
      width: labelWidth,
    }),
    doc.heightOfString(valueText, {
      width: valueWidth,
    }),
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(label, x, y, {
      width: labelWidth,
    });

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(valueText, x + labelWidth, y, {
      width: valueWidth,
    });

  doc.x = PAGE_MARGIN;
  doc.y = y + height + 4;
}

function addSummaryBox(
  doc: PDFKit.PDFDocument,
  label: string,
  value: unknown,
  x: number,
  y: number,
  width: number,
) {
  const height = 42;

  doc
    .rect(x, y, width, height)
    .stroke();

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
    .text(text(value), x + 7, y + 21, {
      width: width - 14,
      align: "center",
    });
}

function addPageNumber(
  doc: PDFKit.PDFDocument,
  pageNumber: number,
) {
  doc
    .font("Helvetica")
    .fontSize(8)
    .text(
      `BIO-EMS Temperature Performance · Page ${pageNumber}`,
      PAGE_MARGIN,
      doc.page.height -
        PAGE_MARGIN -
        12,
      {
        width:
          doc.page.width -
          PAGE_MARGIN * 2,
        align: "center",
        lineBreak: false,
      },
    );
}

function addTableHeader(
  doc: PDFKit.PDFDocument,
  columns: Array<{
    title: string;
    width: number;
  }>,
) {
  let x = PAGE_MARGIN;
  const y = doc.y;

  doc
    .font("Helvetica-Bold")
    .fontSize(7);

  for (const column of columns) {
    doc
      .rect(
        x,
        y,
        column.width,
        TABLE_HEADER_HEIGHT,
      )
      .stroke();

    doc.text(
      column.title,
      x + ROW_PADDING,
      y + 5,
      {
        width:
          column.width -
          ROW_PADDING * 2,
        height:
          TABLE_HEADER_HEIGHT - 6,
        ellipsis: true,
      },
    );

    x += column.width + COLUMN_GAP;
  }

  doc.x = PAGE_MARGIN;
  doc.y =
    y +
    TABLE_HEADER_HEIGHT +
    COLUMN_GAP;
}

function rowHeight(
  doc: PDFKit.PDFDocument,
  values: string[],
  columns: Array<{ width: number }>,
) {
  return (
    Math.max(
      ...values.map((value, index) =>
        doc.heightOfString(value, {
          width:
            columns[index].width -
            ROW_PADDING * 2,
        }),
      ),
    ) +
    ROW_PADDING * 2
  );
}

function addTableRow(
  doc: PDFKit.PDFDocument,
  values: string[],
  columns: Array<{ width: number }>,
) {
  const height = rowHeight(
    doc,
    values,
    columns,
  );

  const y = doc.y;
  let x = PAGE_MARGIN;

  doc
    .font("Helvetica")
    .fontSize(7);

  values.forEach((value, index) => {
    const column = columns[index];

    doc
      .rect(
        x,
        y,
        column.width,
        height,
      )
      .stroke();

    doc.text(
      value,
      x + ROW_PADDING,
      y + ROW_PADDING,
      {
        width:
          column.width -
          ROW_PADDING * 2,
        height:
          height -
          ROW_PADDING * 2,
      },
    );

    x += column.width + COLUMN_GAP;
  });

  doc.x = PAGE_MARGIN;
  doc.y = y + height + COLUMN_GAP;
}

export function renderTemperaturePerformancePdf(
  result: Result,
  generatedBy: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: PAGE_MARGIN,
      bufferPages: true,
      info: {
        Title:
          "BIO-EMS Temperature Performance",
        Subject:
          "Temperature Performance Report",
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

    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("BIO-EMS");

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(
        "Temperature Performance Report",
      )
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(
        "Controlled environmental monitoring output generated from BIO-EMS telemetry evidence.",
      )
      .moveDown(1);

    addSectionTitle(
      doc,
      "Report identity",
    );

    addKeyValue(
      doc,
      "Report ID",
      result.identity.reportId,
    );

    addKeyValue(
      doc,
      "Contract version",
      result.identity.contractVersion,
    );

    addKeyValue(
      doc,
      "Generated at",
      result.provenance.generatedAt,
    );

    addKeyValue(
      doc,
      "Generated by",
      generatedBy,
    );

    addKeyValue(
      doc,
      "Source",
      result.provenance.source,
    );

    addKeyValue(
      doc,
      "Range semantics",
      result.provenance.rangeSemantics,
    );

    addKeyValue(
      doc,
      "From",
      result.scope.from,
    );

    addKeyValue(
      doc,
      "To",
      result.scope.to,
    );

    addKeyValue(
      doc,
      "Time zone",
      result.scope.timeZone,
    );

    addKeyValue(
      doc,
      "Language",
      result.scope.language,
    );

    addSectionTitle(
      doc,
      "Performance summary",
    );

    const usableWidth =
      doc.page.width -
      PAGE_MARGIN * 2;

    const boxGap = 8;

    const boxWidth =
      (usableWidth - boxGap * 2) / 3;

    const summaryItems = [
      [
        "Sensors",
        result.summary.sensors,
      ],
      [
        "Records",
        result.summary.records,
      ],
      [
        "Minimum",
        result.summary.minimum,
      ],
      [
        "Maximum",
        result.summary.maximum,
      ],
      [
        "Average",
        result.summary.average,
      ],
    ] as const;

    const startY = doc.y;

    summaryItems.forEach(
      ([label, value], index) => {
        addSummaryBox(
          doc,
          label,
          value,
          PAGE_MARGIN +
            (index % 3) *
              (boxWidth + boxGap),
          startY +
            Math.floor(index / 3) * 50,
          boxWidth,
        );
      },
    );

    doc.y = startY + 100;

    addSectionTitle(
      doc,
      "Data quality",
    );

    addKeyValue(
      doc,
      "Complete",
      result.quality.complete,
    );

    addKeyValue(
      doc,
      "Warnings",
      result.quality.warnings.join(", "),
    );

    addKeyValue(
      doc,
      "Unavailable sections",
      result.quality.unavailableSections.join(
        ", ",
      ),
    );

    addSectionTitle(
      doc,
      "Sensor performance",
    );

    const columns = [
      {
        title: "Sensor",
        width: 80,
      },
      {
        title: "Unit",
        width: 35,
      },
      {
        title: "Records",
        width: 45,
      },
      {
        title: "Min",
        width: 45,
      },
      {
        title: "Max",
        width: 45,
      },
      {
        title: "Average",
        width: 50,
      },
      {
        title: "First Reading",
        width: 80,
      },
      {
        title: "Last Reading",
        width: 80,
      },
    ];

    addTableHeader(doc, columns);

    for (const sensor of result.sensors) {
      const values = [
        text(sensor.sensor),
        text(sensor.unit),
        text(sensor.records),
        text(sensor.minimum),
        text(sensor.maximum),
        text(sensor.average),
        text(sensor.firstReadingAt),
        text(sensor.lastReadingAt),
      ];

      ensureVerticalSpace(
        doc,
        rowHeight(
          doc,
          values,
          columns,
        ),
        () =>
          addTableHeader(
            doc,
            columns,
          ),
      );

      addTableRow(
        doc,
        values,
        columns,
      );
    }

    const range =
      doc.bufferedPageRange();

    for (
      let index = 0;
      index < range.count;
      index += 1
    ) {
      doc.switchToPage(
        range.start + index,
      );

      addPageNumber(
        doc,
        index + 1,
      );
    }

    doc.end();
  });
}

export function temperaturePerformancePdfFilename(
  result: Result,
) {
  const from = safeFilenamePart(
    result.scope.from.slice(0, 10),
  );

  const to = safeFilenamePart(
    result.scope.to.slice(0, 10),
  );

  const reportId = safeFilenamePart(
    result.identity.reportId,
  );

  return `bio-ems_temperature-performance_${from}_${to}_${reportId}.pdf`;
}