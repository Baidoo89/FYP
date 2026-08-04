const fs = require('fs');
const path = require('path');
const PDFKit = require('pdfkit');
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  SectionType,
  ShadingType,
  TextRun,
} = require('docx');

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'docs', 'defence-team-master-brief.md');
const OUT = path.join(ROOT, 'defence-pack');
const DOWNLOADS = path.join(process.env.USERPROFILE || '', 'Downloads');
const BASE = 'GCTU_FYP_Defence_Team_Master_Brief_Benjamin_Baidoo';
const DOCX_PATH = path.join(OUT, `${BASE}.docx`);
const PDF_PATH = path.join(OUT, `${BASE}.pdf`);
const LOGO = path.join(ROOT, 'public', 'gctu-logo.jpg');
const COLORS = {
  navy: '0B2239', teal: '0A6F68', gold: 'D5A11E', ink: '1C2730',
  muted: '5B6670', light: 'F2F5F6', line: 'D5DDE1', white: 'FFFFFF',
  blue: '2D5B7C', paleGold: 'FAF5E8', paleTeal: 'EAF4F3',
};
const CONTENTS = [
  'Executive Summary',
  'Chapter One: Introduction',
  'Chapter Two: Literature Review',
  'Chapter Three: System Methodology',
  'Chapter Four: System Design and Implementation',
  'Current Software Snapshot',
  'Chapter Five: Findings, Conclusion, and Recommendations',
  'What the Project Contributes',
  'Defence Questions and Team-Aligned Answers',
  'Claims the Team Must Avoid',
  'Suggested Team Speaking Responsibilities',
  'Demonstration Story',
  'Glossary',
  'Rapid Revision Sheet',
  'Final Readiness Checklist',
];

function cleanInline(value) {
  return value.replaceAll('**', '').replaceAll('`', '').replaceAll('*', '');
}

function inlineRuns(value, base = {}) {
  const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return new TextRun({ ...base, text: part.slice(2, -2), bold: true, color: COLORS.navy });
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return new TextRun({ ...base, text: part.slice(1, -1), font: 'Consolas', size: 18, color: COLORS.blue });
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return new TextRun({ ...base, text: part.slice(1, -1), italics: true });
    }
    return new TextRun({ ...base, text: part });
  });
}

function parseMarkdown(markdown) {
  const records = [];
  let inCode = false;
  let code = [];
  for (const raw of markdown.replaceAll('\r\n', '\n').split('\n')) {
    const line = raw.trimEnd();
    if (line.startsWith('```')) {
      if (inCode) {
        records.push({ type: 'code', text: code.join('\n') });
        code = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      code.push(raw);
      continue;
    }
    if (!line.trim()) continue;
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      records.push({ type: `h${heading[1].length}`, text: cleanInline(heading[2]) });
      continue;
    }
    if (line.startsWith('> ')) {
      records.push({ type: 'quote', text: line.slice(2) });
      continue;
    }
    if (line.startsWith('- ')) {
      records.push({ type: 'bullet', text: line.slice(2) });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      records.push({ type: 'number', text: line });
      continue;
    }
    records.push({ type: 'body', text: line.trim() });
  }
  return records;
}

function docxBody(records) {
  const children = [];
  children.push(new Paragraph({
    text: 'Quick Contents',
    style: 'TeamHeading1NoBreak',
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: 'Read the Executive Summary and Rapid Revision Sheet first. Use the full chapter sections to divide revision among the team.', bold: true, color: COLORS.teal })],
    shading: { type: ShadingType.CLEAR, fill: COLORS.paleTeal },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: COLORS.teal } },
    spacing: { before: 120, after: 220 },
    indent: { left: 260, right: 160 },
  }));
  for (let index = 0; index < CONTENTS.length; index += 1) {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: `${index + 1}. `, bold: true, color: COLORS.gold }),
        new TextRun({ text: CONTENTS[index], bold: true, color: COLORS.navy }),
      ],
      spacing: { after: 90 },
      indent: { left: 180 },
    }));
  }

  let firstH1 = true;
  for (const record of records) {
    if (record.type === 'h1') {
      children.push(new Paragraph({
        text: record.text,
        style: firstH1 ? 'TeamHeading1' : 'TeamHeading1',
        pageBreakBefore: true,
      }));
      firstH1 = false;
    } else if (record.type === 'h2') {
      children.push(new Paragraph({ text: record.text, style: 'TeamHeading2' }));
    } else if (record.type === 'h3') {
      children.push(new Paragraph({ text: record.text, style: 'TeamHeading3' }));
    } else if (record.type === 'bullet') {
      children.push(new Paragraph({
        children: inlineRuns(record.text),
        bullet: { level: 0 },
        spacing: { after: 70, line: 280 },
      }));
    } else if (record.type === 'number') {
      children.push(new Paragraph({
        children: inlineRuns(record.text),
        indent: { left: 360, hanging: 300 },
        spacing: { after: 80, line: 280 },
      }));
    } else if (record.type === 'quote') {
      children.push(new Paragraph({
        children: inlineRuns(record.text, { bold: true, color: COLORS.navy }),
        shading: { type: ShadingType.CLEAR, fill: COLORS.paleGold },
        border: { left: { style: BorderStyle.SINGLE, size: 22, color: COLORS.gold } },
        indent: { left: 280, right: 180 },
        spacing: { before: 130, after: 180, line: 300 },
      }));
    } else if (record.type === 'code') {
      children.push(new Paragraph({
        children: [new TextRun({ text: record.text, font: 'Consolas', size: 18, color: COLORS.navy })],
        shading: { type: ShadingType.CLEAR, fill: COLORS.light },
        border: {
          top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line },
          left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line },
          right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line },
        },
        indent: { left: 240, right: 240 },
        spacing: { before: 100, after: 180, line: 270 },
      }));
    } else {
      children.push(new Paragraph({
        children: inlineRuns(record.text),
        spacing: { after: 130, line: 290 },
        widowControl: true,
      }));
    }
  }
  return children;
}

async function createDocx(records) {
  const cover = [
    new Paragraph({
      children: [new ImageRun({ data: fs.readFileSync(LOGO), transformation: { width: 140, height: 92 }, type: 'jpg' })],
      spacing: { after: 900 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'FINAL YEAR PROJECT DEFENCE', bold: true, color: COLORS.teal, size: 23 })],
      spacing: { after: 180 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Digital Staff Promotion Support System for GCTU', bold: true, color: COLORS.navy, size: 54 })],
      spacing: { after: 260, line: 560 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Complete Document and Software Summary, Examiner Question Bank, Demonstration Guide, and Team Alignment Handbook', color: COLORS.muted, size: 28 })],
      spacing: { after: 850, line: 370 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'MAIN PRESENTER', bold: true, color: COLORS.gold, size: 19 })],
      spacing: { after: 90 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Benjamin Baidoo | 4231230141', bold: true, color: COLORS.navy, size: 28 })],
      spacing: { after: 280 },
    }),
    new Paragraph({ children: [new TextRun({ text: 'Success Joy Likem Hayibor | 4231230154', color: COLORS.ink, size: 22 })], spacing: { after: 100 } }),
    new Paragraph({ children: [new TextRun({ text: 'Esther Appiah | 4231231237', color: COLORS.ink, size: 22 })], spacing: { after: 600 } }),
    new Paragraph({
      children: [new TextRun({ text: 'Ghana Communication Technology University | August 2026', bold: true, color: COLORS.teal, size: 20 })],
    }),
  ];

  const header = new Header({ children: [new Paragraph({
    children: [new TextRun({ text: 'GCTU FYP DEFENCE TEAM MASTER BRIEF', bold: true, color: COLORS.teal, size: 16 })],
    alignment: AlignmentType.RIGHT,
    border: { bottom: { style: BorderStyle.SINGLE, size: 5, color: COLORS.line } },
    spacing: { after: 80 },
  })] });
  const footer = new Footer({ children: [new Paragraph({
    children: [
      new TextRun({ text: 'PROJECT TEAM | ', color: COLORS.muted, size: 16 }),
      new TextRun({ children: [PageNumber.CURRENT], bold: true, color: COLORS.teal, size: 16 }),
    ],
    alignment: AlignmentType.RIGHT,
  })] });

  const document = new Document({
    creator: 'Benjamin Baidoo and Project Team',
    title: 'GCTU FYP Defence Team Master Brief',
    description: 'Complete document and software summary for the Digital Staff Promotion Support System for GCTU.',
    styles: {
      default: {
        document: {
          run: { font: 'Aptos', size: 21, color: COLORS.ink },
          paragraph: { spacing: { after: 130, line: 290 } },
        },
      },
      paragraphStyles: [
        {
          id: 'TeamHeading1', name: 'Team Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Aptos Display', size: 38, bold: true, color: COLORS.navy },
          paragraph: { spacing: { before: 100, after: 230 }, keepNext: true, border: { bottom: { style: BorderStyle.SINGLE, size: 14, color: COLORS.teal } } },
        },
        {
          id: 'TeamHeading1NoBreak', name: 'Team Heading 1 No Break', basedOn: 'TeamHeading1', next: 'Normal', quickFormat: true,
          run: { font: 'Aptos Display', size: 38, bold: true, color: COLORS.navy },
          paragraph: { spacing: { before: 100, after: 230 }, keepNext: true, border: { bottom: { style: BorderStyle.SINGLE, size: 14, color: COLORS.teal } } },
        },
        {
          id: 'TeamHeading2', name: 'Team Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Aptos Display', size: 28, bold: true, color: COLORS.teal },
          paragraph: { spacing: { before: 260, after: 100 }, keepNext: true },
        },
        {
          id: 'TeamHeading3', name: 'Team Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Aptos', size: 23, bold: true, color: COLORS.blue },
          paragraph: { spacing: { before: 190, after: 70 }, keepNext: true },
        },
      ],
    },
    sections: [
      {
        properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1180 } } },
        children: cover,
      },
      {
        properties: { type: SectionType.NEXT_PAGE, page: { margin: { top: 900, right: 950, bottom: 900, left: 1080 } } },
        headers: { default: header },
        footers: { default: footer },
        children: docxBody(records),
      },
    ],
  });
  fs.writeFileSync(DOCX_PATH, await Packer.toBuffer(document));
}
function ensurePdfSpace(pdf, height) {
  const bottom = pdf.page.height - 58;
  if (pdf.y + height > bottom) pdf.addPage();
}

function pdfHeading(pdf, text, level) {
  if (level === 1) {
    pdf.addPage();
    pdf.font('Helvetica-Bold').fontSize(20).fillColor(`#${COLORS.navy}`).text(text, { lineGap: 2 });
    const y = pdf.y + 5;
    pdf.moveTo(54, y).lineTo(pdf.page.width - 54, y).lineWidth(2).strokeColor(`#${COLORS.teal}`).stroke();
    pdf.y = y + 15;
    return;
  }
  const size = level === 2 ? 14 : 11.5;
  const color = level === 2 ? COLORS.teal : COLORS.blue;
  ensurePdfSpace(pdf, level === 2 ? 54 : 42);
  pdf.moveDown(level === 2 ? 0.75 : 0.5);
  pdf.font('Helvetica-Bold').fontSize(size).fillColor(`#${color}`).text(text, { lineGap: 1 });
  pdf.moveDown(0.25);
}

function renderPdfRecord(pdf, record) {
  if (record.type === 'h1') return pdfHeading(pdf, record.text, 1);
  if (record.type === 'h2') return pdfHeading(pdf, record.text, 2);
  if (record.type === 'h3') return pdfHeading(pdf, record.text, 3);

  const text = cleanInline(record.text);
  const width = pdf.page.width - 108;
  if (record.type === 'quote') {
    pdf.font('Helvetica-Bold').fontSize(10).fillColor(`#${COLORS.navy}`);
    const h = pdf.heightOfString(text, { width: width - 30, lineGap: 2 }) + 22;
    ensurePdfSpace(pdf, h + 10);
    const x = 54;
    const y = pdf.y;
    pdf.rect(x, y, width, h).fill(`#${COLORS.paleGold}`);
    pdf.rect(x, y, 4, h).fill(`#${COLORS.gold}`);
    pdf.fillColor(`#${COLORS.navy}`).text(text, x + 16, y + 10, { width: width - 28, lineGap: 2 });
    pdf.y = y + h + 9;
    return;
  }
  if (record.type === 'code') {
    pdf.font('Courier').fontSize(8.8).fillColor(`#${COLORS.navy}`);
    const h = pdf.heightOfString(record.text, { width: width - 26, lineGap: 2 }) + 20;
    ensurePdfSpace(pdf, h + 10);
    const y = pdf.y;
    pdf.rect(54, y, width, h).fill(`#${COLORS.light}`);
    pdf.fillColor(`#${COLORS.navy}`).text(record.text, 67, y + 10, { width: width - 26, lineGap: 2 });
    pdf.y = y + h + 9;
    return;
  }
  if (record.type === 'bullet') {
    pdf.font('Helvetica').fontSize(9.8).fillColor(`#${COLORS.ink}`);
    const h = pdf.heightOfString(text, { width: width - 24, lineGap: 2 });
    ensurePdfSpace(pdf, h + 8);
    const y = pdf.y;
    pdf.circle(62, y + 5, 2).fill(`#${COLORS.teal}`);
    pdf.fillColor(`#${COLORS.ink}`).text(text, 74, y, { width: width - 24, lineGap: 2 });
    pdf.moveDown(0.4);
    return;
  }
  if (record.type === 'number') {
    pdf.font('Helvetica').fontSize(9.8).fillColor(`#${COLORS.ink}`);
    const h = pdf.heightOfString(text, { width: width - 18, lineGap: 2 });
    ensurePdfSpace(pdf, h + 8);
    pdf.text(text, 66, pdf.y, { width: width - 18, lineGap: 2 });
    pdf.moveDown(0.4);
    return;
  }
  pdf.font('Helvetica').fontSize(9.8).fillColor(`#${COLORS.ink}`);
  const h = pdf.heightOfString(text, { width, lineGap: 2 });
  ensurePdfSpace(pdf, h + 8);
  pdf.text(text, { width, align: 'left', lineGap: 2 });
  pdf.moveDown(0.45);
}

async function createPdf(records) {
  await new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(PDF_PATH);
    const pdf = new PDFKit({
      size: 'A4',
      margins: { top: 54, right: 54, bottom: 54, left: 54 },
      bufferPages: true,
      info: {
        Title: 'GCTU FYP Defence Team Master Brief',
        Author: 'Benjamin Baidoo and Project Team',
        Subject: 'Digital Staff Promotion Support System for GCTU',
      },
    });
    pdf.pipe(stream);

    pdf.rect(0, 0, pdf.page.width, pdf.page.height).fill(`#${COLORS.navy}`);
    pdf.image(LOGO, 54, 54, { fit: [110, 75] });
    pdf.font('Helvetica-Bold').fontSize(10).fillColor('#9CCAC6').text('FINAL YEAR PROJECT DEFENCE', 54, 178);
    pdf.font('Helvetica-Bold').fontSize(30).fillColor('#FFFFFF').text('Digital Staff Promotion Support System for GCTU', 54, 220, { width: 480, lineGap: 5 });
    pdf.rect(54, 335, 115, 5).fill(`#${COLORS.gold}`);
    pdf.font('Helvetica').fontSize(14).fillColor('#D5E2E8').text('Complete Document and Software Summary, Examiner Question Bank, Demonstration Guide, and Team Alignment Handbook', 54, 370, { width: 470, lineGap: 5 });
    pdf.font('Helvetica-Bold').fontSize(9).fillColor(`#${COLORS.gold}`).text('MAIN PRESENTER', 54, 555);
    pdf.font('Helvetica-Bold').fontSize(15).fillColor('#FFFFFF').text('Benjamin Baidoo | 4231230141', 54, 578);
    pdf.font('Helvetica').fontSize(11).fillColor('#D5E2E8').text('Success Joy Likem Hayibor | 4231230154', 54, 618);
    pdf.text('Esther Appiah | 4231231237', 54, 641);
    pdf.font('Helvetica-Bold').fontSize(10).fillColor('#9CCAC6').text('Ghana Communication Technology University | August 2026', 54, 745);

    pdf.addPage();
    pdf.font('Helvetica-Bold').fontSize(20).fillColor(`#${COLORS.navy}`).text('Quick Contents');
    pdf.moveTo(54, pdf.y + 5).lineTo(pdf.page.width - 54, pdf.y + 5).lineWidth(2).strokeColor(`#${COLORS.teal}`).stroke();
    pdf.moveDown(1.1);
    pdf.font('Helvetica-Bold').fontSize(10).fillColor(`#${COLORS.teal}`).text('Read the Executive Summary and Rapid Revision Sheet first. Use the full chapter sections to divide revision among the team.', { width: pdf.page.width - 108, lineGap: 2 });
    pdf.moveDown(1);
    CONTENTS.forEach((item, index) => {
      pdf.font('Helvetica-Bold').fontSize(10.5).fillColor(`#${COLORS.navy}`).text(`${index + 1}. ${item}`, { indent: 8 });
      pdf.moveDown(0.35);
    });

    for (const record of records) renderPdfRecord(pdf, record);

    const range = pdf.bufferedPageRange();
    for (let index = 0; index < range.count; index += 1) {
      pdf.switchToPage(range.start + index);
      if (index > 0) {
        const originalBottomMargin = pdf.page.margins.bottom;
        pdf.page.margins.bottom = 0;
        pdf.font('Helvetica').fontSize(8).fillColor(`#${COLORS.muted}`)
          .text(`PROJECT TEAM | ${index + 1}`, 54, pdf.page.height - 34, { width: pdf.page.width - 108, align: 'right', lineBreak: false });
        pdf.page.margins.bottom = originalBottomMargin;
      }
    }
    pdf.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const records = parseMarkdown(fs.readFileSync(SOURCE, 'utf8'));
  await createDocx(records);
  await createPdf(records);
  if (fs.existsSync(DOWNLOADS)) {
    fs.copyFileSync(DOCX_PATH, path.join(DOWNLOADS, path.basename(DOCX_PATH)));
    fs.copyFileSync(PDF_PATH, path.join(DOWNLOADS, path.basename(PDF_PATH)));
  }
  console.log(`Source records: ${records.length}`);
  console.log(`Word: ${DOCX_PATH}`);
  console.log(`PDF: ${PDF_PATH}`);
  console.log(`Downloads copies: ${DOWNLOADS}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
