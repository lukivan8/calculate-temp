const form = document.getElementById("calc-form");
const resultsSection = document.getElementById("results");
const resultList = document.getElementById("resultList");
const downloadButton = document.getElementById("downloadDoc");
const downloadPdfButton = document.getElementById("downloadPdf");
const { calculateTemperatureSeams } = window.calcCore;

let lastReport = null;

function formatNumber(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function renderResults(input, result) {
  const items = [
    `Город: ${input.city}`,
    `Расчетный перепад ΔT_расч: ${formatNumber(result.deltaT)} °C`,
    `Суммарный температурный эффект ΔT_сум: ${formatNumber(result.deltaTsum)} °C`,
    `Максимальная длина блока L_max (теоретическая): ${formatNumber(result.lMax)} м`,
    `Принятая длина блока L_факт: ${result.lFact} м`,
    `Количество швов N: ${result.nShifts} шт.`,
    `Шаг между швами S: ${formatNumber(result.sStep)} м`,
    `Рекомендуемая ширина зазора δ: ${formatNumber(result.seamGapMm)} мм`,
  ];

  resultList.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
  resultsSection.classList.remove("hidden");
}

function getBuildingTypeLabel(type) {
  if (type === "rc") return "Железобетон";
  if (type === "steel") return "Металл";
  return "Кирпич";
}

function getHeatingLabel(mode) {
  return mode === "heated" ? "Отапливаемое" : "Неотапливаемое";
}

function reportTableRows(report) {
  const i = report.input;
  const r = report.result;
  return [
    ["Город", i.city],
    ["Тип здания", getBuildingTypeLabel(i.buildingType)],
    ["Режим эксплуатации", getHeatingLabel(i.heating)],
    ["Lзд, м", String(i.length)],
    ["T0, °C", String(i.t0)],
    ["Tmax, °C", String(i.tmax)],
    ["Tmin, °C", String(i.tmin)],
    ["alpha, 1/°C", String(r.alpha)],
    ["epsilon_доп", String(r.epsilon)],
    ["ΔT_расч, °C", formatNumber(r.deltaT)],
    ["ΔTm, °C", formatNumber(r.deltaTm)],
    ["ΔTr, °C", formatNumber(r.deltaTr)],
    ["ΔT_сум, °C", formatNumber(r.deltaTsum)],
    ["Lmax, м", formatNumber(r.lMax)],
    ["Lфакт, м", String(r.lFact)],
    ["N = ceil(Lзд/Lфакт)-1, шт.", String(r.nShifts)],
    ["S = Lзд/(N+1), м", formatNumber(r.sStep)],
    ["Первый шов от торца, м", r.nShifts > 0 ? formatNumber(r.firstShiftDistance) : "не требуется"],
    ["Ширина зазора δ = 1.5*ΔL, мм", formatNumber(r.seamGapMm)],
  ];
}

async function downloadDocx(report) {
  if (!window.docx) {
    throw new Error("DOCX library is not loaded");
  }

  const { BorderStyle, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } =
    window.docx;
  const thickBorder = {
    style: BorderStyle.SINGLE,
    size: 12,
    color: "000000",
  };

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: window.docx.TableLayoutType.FIXED,
    borders: {
      top: thickBorder,
      bottom: thickBorder,
      left: thickBorder,
      right: thickBorder,
      insideHorizontal: thickBorder,
      insideVertical: thickBorder,
    },
    rows: reportTableRows(report).map(
      ([name, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 42, type: WidthType.PERCENTAGE },
              margins: { top: 120, bottom: 120, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: name, bold: true, size: 22 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 58, type: WidthType.PERCENTAGE },
              margins: { top: 120, bottom: 120, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: String(value), size: 22 })] })],
            }),
          ],
        }),
    ),
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 540,
              bottom: 720,
              left: 540,
            },
          },
        },
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Краткий отчет по температурным швам", bold: true, size: 32 })],
          }),
          new Paragraph(`Дата формирования: ${report.generatedAt}`),
          new Paragraph("Нормативная основа: СП РК EN 1991-1-5."),
          new Paragraph(""),
          table,
          new Paragraph(""),
          new Paragraph({
            children: [new TextRun({ text: "Вывод", bold: true })],
          }),
          new Paragraph(
            `Принятая длина блока Lфакт = ${report.result.lFact} м, количество швов N = ${report.result.nShifts} шт., шаг S = ${formatNumber(report.result.sStep)} м.`,
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `temperature-seams-report-${Date.now()}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadPdf(report) {
  if (!window.pdfMake) {
    throw new Error("pdfMake library is not loaded");
  }

  const rows = reportTableRows(report);
  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    content: [
      { text: "Краткий отчет по температурным швам", style: "title" },
      { text: `Дата формирования: ${report.generatedAt}` },
      { text: "Нормативная основа: СП РК EN 1991-1-5.", margin: [0, 0, 0, 12] },
      {
        table: {
          headerRows: 1,
          widths: [220, "*"],
          body: [["Параметр", "Значение"], ...rows],
        },
        layout: "lightHorizontalLines",
      },
      { text: "Вывод", style: "heading", margin: [0, 12, 0, 4] },
      {
        text: `Lфакт = ${report.result.lFact} м, N = ${report.result.nShifts} шт., S = ${formatNumber(report.result.sStep)} м.`,
      },
    ],
    styles: {
      title: { fontSize: 15, bold: true, margin: [0, 0, 0, 8] },
      heading: { fontSize: 11, bold: true },
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
    },
  };

  window.pdfMake.createPdf(docDefinition).download(`temperature-seams-report-${Date.now()}.pdf`);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const input = {
    city: document.getElementById("city").value.trim(),
    buildingType: document.getElementById("buildingType").value,
    heating: document.getElementById("heating").value,
    length: Number(document.getElementById("length").value),
    t0: Number(document.getElementById("t0").value),
    tmax: Number(document.getElementById("tmax").value),
    tmin: Number(document.getElementById("tmin").value),
  };

  const result = calculateTemperatureSeams(input);
  renderResults(input, result);

  lastReport = {
    input,
    result,
    generatedAt: new Date().toLocaleString("ru-RU"),
  };
  downloadButton.disabled = false;
  downloadPdfButton.disabled = false;
});

downloadButton.addEventListener("click", async () => {
  if (!lastReport) return;
  try {
    await downloadDocx(lastReport);
  } catch (error) {
    alert("Не удалось сформировать .docx. Проверьте подключение к интернету и повторите попытку.");
  }
});

downloadPdfButton.addEventListener("click", () => {
  if (!lastReport) return;
  try {
    downloadPdf(lastReport);
  } catch (error) {
    alert("Не удалось сформировать PDF. Проверьте подключение к интернету и повторите попытку.");
  }
});
