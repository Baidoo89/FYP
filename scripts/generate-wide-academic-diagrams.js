const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const outputDir = path.join(__dirname, "..", "docs", "print-clean-academic-diagrams");
fs.mkdirSync(outputDir, { recursive: true });

const ink = "#111827";
const mid = "#4B5563";
const light = "#E5E7EB";
const paper = "#FFFFFF";
const panel = "#F3F4F6";

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svgDocument(width, height, body, extraDefs = "") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <defs>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
      <path d="M 0 0 L 12 6 L 0 12 z" fill="${ink}"/>
    </marker>
    <marker id="card-one" viewBox="0 0 22 18" refX="21" refY="9" markerWidth="22" markerHeight="18" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
      <path d="M 12 2 L 12 16 M 19 2 L 19 16" fill="none" stroke="${ink}" stroke-width="2.5"/>
    </marker>
    <marker id="card-zero-many" viewBox="0 0 25 18" refX="24" refY="9" markerWidth="25" markerHeight="18" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
      <circle cx="5" cy="9" r="3.5" fill="${paper}" stroke="${ink}" stroke-width="2"/>
      <path d="M 22 9 L 12 2 M 22 9 L 12 9 M 22 9 L 12 16" fill="none" stroke="${ink}" stroke-width="2.5"/>
    </marker>
    <marker id="card-zero-one" viewBox="0 0 25 18" refX="24" refY="9" markerWidth="25" markerHeight="18" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
      <circle cx="5" cy="9" r="3.5" fill="${paper}" stroke="${ink}" stroke-width="2"/>
      <path d="M 19 2 L 19 16" fill="none" stroke="${ink}" stroke-width="2.5"/>
    </marker>
    <style>
      text { font-family: Arial, Helvetica, sans-serif; fill: ${ink}; letter-spacing: 0; }
      .title { font-size: 40px; font-weight: 700; }
      .section { font-size: 31px; font-weight: 700; }
      .label { font-size: 31px; font-weight: 600; }
      .state-label { font-size: 35px; font-weight: 600; }
      .small { font-size: 24px; }
      .tiny { font-size: 20px; }
      .entity-name { font-size: 31px; font-weight: 700; }
      .entity-row { font-size: 25px; }
      .transition { font-size: 25px; }
    </style>
    ${extraDefs}
  </defs>
  <rect width="100%" height="100%" fill="${paper}"/>
  ${body}
</svg>`;
}

function text(x, y, value, className = "small", anchor = "start", attrs = "") {
  return `<text x="${x}" y="${y}" class="${className}" text-anchor="${anchor}" ${attrs}>${esc(value)}</text>`;
}

function multiline(x, y, lines, className = "label", anchor = "middle", lineHeight = 32) {
  return `<text x="${x}" y="${y}" class="${className}" text-anchor="${anchor}">${lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`)
    .join("")}</text>`;
}

function pathLine(points, { dashed = false, arrow = true, width = 3, color = ink } = {}) {
  const d = points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"${dashed ? ' stroke-dasharray="12 9"' : ""}${arrow ? ' marker-end="url(#arrow)"' : ""}/>`;
}

function dependency(points, labelValue, labelX, labelY) {
  return `${pathLine(points, { dashed: true, arrow: true, width: 2.5 })}${
    labelValue ? `<rect x="${labelX - 8}" y="${labelY - 25}" width="${labelValue.length * 12 + 16}" height="32" fill="${paper}"/>${text(labelX, labelY, labelValue, "tiny")}` : ""
  }`;
}

function packageBox(x, y, width, height, titleValue) {
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${paper}" stroke="${ink}" stroke-width="3"/>
    <rect x="${x}" y="${y}" width="${Math.max(310, titleValue.length * 17)}" height="52" fill="${panel}" stroke="${ink}" stroke-width="3"/>
    ${text(x + 20, y + 35, titleValue, "section")}
  </g>`;
}

function componentBox(x, y, width, height, nameLines, stereotype = "component") {
  const labelY = y + (nameLines.length === 1 ? 82 : 66);
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="${paper}" stroke="${ink}" stroke-width="3"/>
    <rect x="${x + width - 50}" y="${y + 17}" width="28" height="36" fill="${paper}" stroke="${ink}" stroke-width="2.5"/>
    <rect x="${x + width - 60}" y="${y + 23}" width="20" height="9" fill="${paper}" stroke="${ink}" stroke-width="2"/>
    <rect x="${x + width - 60}" y="${y + 39}" width="20" height="9" fill="${paper}" stroke="${ink}" stroke-width="2"/>
    ${text(x + 18, y + 31, `&lt;&lt;${stereotype}&gt;&gt;`, "tiny")}
    ${multiline(x + width / 2, labelY, nameLines, "label", "middle", 31)}
  </g>`;
}

function createComponentDiagram() {
  const width = 3000;
  const height = 1700;
  let body = "";

  body += `<rect x="45" y="48" width="2910" height="1600" fill="none" stroke="${ink}" stroke-width="4"/>`;
  body += `<rect x="80" y="28" width="1180" height="58" fill="${paper}"/>`;
  body += text(95, 70, "Digital Staff Promotion Support System", "title");

  body += packageBox(100, 130, 2800, 310, "Presentation Layer");
  const portals = [
    [150, "Lecturer Portal"],
    [700, "HOD / Dean Portal"],
    [1250, "HR Portal"],
    [1800, "Committee Portal"],
    [2350, "Administrator Portal"],
  ];
  for (const [x, name] of portals) body += componentBox(x, 235, 490, 145, [name], "user interface");

  body += packageBox(100, 500, 2800, 690, "Application and Domain Services");
  body += componentBox(1190, 570, 620, 135, ["Application Service Facade"], "interface");

  const services = [
    [180, 790, ["Authentication and", "Role Access Control"]],
    [840, 790, ["Promotion Workflow", "Service"]],
    [1500, 790, ["Evidence Management", "Service"]],
    [2160, 790, ["Verification and", "Eligibility Service"]],
    [430, 995, ["Committee Review", "Service"]],
    [1110, 995, ["Criteria, Reporting", "and Analytics"]],
    [1790, 995, ["Audit and Notification", "Service"]],
  ];
  for (const [x, y, nameLines] of services) body += componentBox(x, y, 560, 145, nameLines);

  body += packageBox(100, 1250, 2800, 310, "Data Access and External Infrastructure");
  body += componentBox(220, 1350, 520, 145, ["Prisma Data Access"], "data access");
  body += componentBox(860, 1350, 520, 145, ["PostgreSQL Database"], "database");
  body += componentBox(1500, 1350, 520, 145, ["Document Blob Store"], "storage");
  body += componentBox(2140, 1350, 520, 145, ["Email Delivery Service"], "external service");

  // Presentation layer dependencies converge on the application facade.
  for (const [x] of portals) {
    const center = x + 245;
    body += dependency([[center, 380], [center, 470], [1500, 470], [1500, 570]], "", 0, 0);
  }
  body += `<rect x="1280" y="450" width="440" height="34" fill="${paper}"/>${text(1500, 476, "HTTPS / authenticated requests", "tiny", "middle")}`;

  // Facade-to-service dependency bus.
  body += pathLine([[1500, 705], [1500, 750]], { dashed: true, arrow: false, width: 2.5 });
  body += pathLine([[460, 750], [2440, 750]], { dashed: true, arrow: false, width: 2.5 });
  for (const [x, y] of services.slice(0, 4)) body += pathLine([[x + 280, 750], [x + 280, y]], { dashed: true, arrow: true, width: 2.5 });
  body += pathLine([[710, 750], [710, 965], [710, 995]], { dashed: true, arrow: true, width: 2.5 });
  body += pathLine([[1390, 750], [1390, 965], [1390, 995]], { dashed: true, arrow: true, width: 2.5 });
  body += pathLine([[2070, 750], [2070, 965], [2070, 995]], { dashed: true, arrow: true, width: 2.5 });
  body += `<rect x="1328" y="724" width="345" height="34" fill="${paper}"/>${text(1500, 750, "invokes domain operations", "tiny", "middle")}`;

  // Domain service collaborations.
  body += dependency([[1400, 862], [1500, 862]], "uses evidence", 1410, 846);
  body += dependency([[2060, 862], [2160, 862]], "verifies", 2070, 846);
  body += dependency([[1120, 930], [710, 930], [710, 995]], "routes review", 820, 914);
  body += dependency([[2440, 935], [2440, 1165], [2070, 1165], [2070, 1140]], "records and notifies", 2140, 1158);

  // Persistence and external-service dependencies.
  body += dependency([[1500, 1190], [1500, 1220], [480, 1220], [480, 1350]], "persists through", 825, 1212);
  body += dependency([[740, 1422], [860, 1422]], "ORM queries", 746, 1405);
  body += dependency([[1780, 1140], [1780, 1320], [1760, 1320], [1760, 1350]], "stores evidence", 1788, 1309);
  body += dependency([[2350, 1140], [2350, 1350]], "sends notifications", 2370, 1250);

  body += `<rect x="120" y="1585" width="2760" height="42" fill="${paper}"/>`;
  body += text(1500, 1615, "Notation: rectangles with component glyphs are deployable/logical components; dashed arrows denote UML dependencies.", "small", "middle");

  return svgDocument(width, height, body);
}

function entityBox(x, y, width, name, rows) {
  const headerHeight = 62;
  const rowHeight = 39;
  const height = headerHeight + rows.length * rowHeight + 12;
  let body = `<g><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${paper}" stroke="${ink}" stroke-width="3"/>`;
  body += `<rect x="${x}" y="${y}" width="${width}" height="${headerHeight}" fill="${panel}" stroke="${ink}" stroke-width="3"/>`;
  body += text(x + width / 2, y + 39, name, "entity-name", "middle");
  rows.forEach((row, index) => {
    const rowY = y + headerHeight + index * rowHeight;
    if (index > 0) body += `<line x1="${x}" y1="${rowY}" x2="${x + width}" y2="${rowY}" stroke="${light}" stroke-width="1.5"/>`;
    const [key, field, type] = row;
    body += text(x + 14, rowY + 25, key || "", "entity-row");
    body += text(x + 88, rowY + 25, field, "entity-row");
    body += text(x + width - 14, rowY + 25, type, "entity-row", "end");
  });
  body += "</g>";
  return { body, x, y, width, height, left: x, right: x + width, top: y, bottom: y + height, cx: x + width / 2, cy: y + height / 2 };
}

function relation(points, labelValue, labelX, labelY, startMultiplicity = "1", endMultiplicity = "0..*", dashed = false) {
  const markerFor = (multiplicity) => multiplicity === "1" ? "card-one" : multiplicity === "0..1" ? "card-zero-one" : "card-zero-many";
  const d = points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  let body = `<path d="${d}" fill="none" stroke="${dashed ? mid : ink}" stroke-width="${dashed ? 2.2 : 2.8}"${dashed ? ' stroke-dasharray="12 9"' : ""} marker-start="url(#${markerFor(startMultiplicity)})" marker-end="url(#${markerFor(endMultiplicity)})"/>`;
  if (labelValue) {
    const labelWidth = Math.max(120, labelValue.length * 11.5);
    body += `<rect x="${labelX - labelWidth / 2}" y="${labelY - 24}" width="${labelWidth}" height="31" fill="${paper}"/>`;
    body += text(labelX, labelY, labelValue, "tiny", "middle");
  }
  return body;
}

function createErdDiagram() {
  const width = 3400;
  const height = 2100;
  let body = text(width / 2, 64, "Core Promotion Data Model", "title", "middle");
  body += text(width / 2, 101, "Relational entity-relationship diagram aligned with the implemented database schema", "small", "middle");

  const faculty = entityBox(80, 160, 430, "FACULTY", [
    ["PK", "id", "Int"], ["UQ", "name", "String"], ["", "description", "String?"],
  ]);
  const department = entityBox(610, 160, 470, "DEPARTMENT", [
    ["PK", "id", "Int"], ["FK", "facultyId", "Int?"], ["UQ", "name", "String"], ["", "description", "String?"],
  ]);
  const user = entityBox(1200, 145, 570, "USER", [
    ["PK", "id", "Int"], ["FK", "departmentId", "Int?"], ["FK", "facultyId", "Int?"], ["UQ", "staffId", "String?"], ["UQ", "email", "String"], ["", "role", "Role"], ["", "currentRank", "AcademicRank?"],
  ]);
  const criteria = entityBox(1920, 145, 620, "PROMOTION_CRITERIA", [
    ["PK", "id", "Int"], ["FK", "createdById", "Int?"], ["", "currentRank", "AcademicRank"], ["", "targetRank", "AcademicRank"], ["", "minimumYears", "Int"], ["", "minimumTotalScore", "Float?"], ["", "isActive", "Boolean"],
  ]);
  const notification = entityBox(2700, 145, 600, "NOTIFICATION", [
    ["PK", "id", "Int"], ["FK", "userId", "Int"], ["FK", "promotionRequestId", "Int?"], ["", "type", "NotificationType"], ["", "title", "String"], ["", "isRead", "Boolean"],
  ]);

  const request = entityBox(760, 690, 760, "PROMOTION_REQUEST", [
    ["PK", "id", "Int"], ["FK", "lecturerId", "Int"], ["FK", "applicantId", "Int?"], ["FK", "requestedById", "Int?"], ["", "currentRank", "String"], ["", "targetRank", "String"], ["", "status", "RequestStatus"], ["", "eligibilityStatus", "EligibilityStatus"], ["", "totalScore", "Float?"],
  ]);
  const document = entityBox(1790, 690, 650, "DOCUMENT", [
    ["PK", "id", "Int"], ["FK", "requestId", "Int"], ["FK", "uploadedById", "Int?"], ["FK", "verifiedById", "Int?"], ["", "category", "DocumentCategory"], ["", "title", "String"], ["", "status", "VerificationStatus"],
  ]);
  const blob = entityBox(2670, 690, 630, "DOCUMENT_FILE_BLOB", [
    ["PK/FK", "documentId", "Int"], ["", "fileName", "String"], ["", "mimeType", "String"], ["", "size", "Int"], ["", "data", "Bytes"],
  ]);

  const score = entityBox(80, 1515, 490, "SCORE", [
    ["PK", "id", "Int"], ["FK", "promotionRequestId", "Int"], ["FK", "createdById", "Int?"], ["", "category", "DocumentCategory"], ["", "score", "Float"], ["", "weightedScore", "Float"],
  ]);
  const review = entityBox(650, 1515, 500, "REVIEW_COMMENT", [
    ["PK", "id", "Int"], ["FK", "promotionRequestId", "Int"], ["FK", "reviewerId", "Int"], ["", "comment", "String"], ["", "recommendation", "Recommendation?"],
  ]);
  const history = entityBox(1230, 1515, 500, "STATUS_HISTORY", [
    ["PK", "id", "Int"], ["FK", "promotionRequestId", "Int"], ["FK", "changedById", "Int"], ["", "oldStatus", "RequestStatus?"], ["", "newStatus", "RequestStatus"],
  ]);
  const audit = entityBox(1810, 1515, 500, "AUDIT_LOG", [
    ["PK", "id", "Int"], ["FK", "requestId", "Int?"], ["FK", "actorId", "Int?"], ["", "action", "String"], ["", "metadata", "Json?"],
  ]);
  const verification = entityBox(2540, 1515, 630, "VERIFICATION", [
    ["PK", "id", "Int"], ["FK", "documentId", "Int"], ["FK", "verifierId", "Int"], ["", "decision", "VerificationStatus"], ["", "comment", "String?"],
  ]);

  const entities = [faculty, department, user, criteria, notification, request, document, blob, score, review, history, audit, verification];

  // Organization and configuration relationships.
  body += relation([[faculty.right, 245], [department.left, 245]], "contains", 560, 227, "0..1", "0..*");
  body += relation([[department.right, 280], [user.left, 280]], "assigns", 1140, 262, "0..1", "0..*");
  body += relation([[faculty.cx, faculty.bottom], [faculty.cx, 560], [user.cx, 560], [user.cx, user.bottom]], "scopes", 860, 548, "0..1", "0..*");
  body += relation([[user.right, 255], [criteria.left, 255]], "maintains", 1845, 237, "0..1", "0..*");

  // Main promotion transaction relationships.
  body += relation([[user.cx, user.bottom], [user.cx, 620], [request.cx, 620], [request.cx, request.top]], "submits / is reviewed by", 1270, 610);
  body += relation([[request.right, 850], [document.left, 850]], "contains evidence", 1655, 832);
  body += relation([[document.right, 835], [blob.left, 835]], "stores file as", 2555, 817, "1", "0..1");
  body += relation([[request.right, 760], [2600, 760], [2600, 455], [notification.left, 455]], "triggers", 2600, 742, "0..1", "0..*");

  // Request-owned records use independent orthogonal routes.
  const requestBottom = request.bottom;
  const childTop = 1515;
  const childRoutes = [
    [score, 900, "stores category scores"],
    [review, 1030, "has review comments"],
    [history, 1160, "tracks state changes"],
    [audit, 1290, "records audit events"],
  ];
  childRoutes.forEach(([child, routeY, labelValue]) => {
    body += relation([[request.cx, requestBottom], [request.cx, routeY], [child.cx, routeY], [child.cx, childTop]], labelValue, child.cx, routeY - 12);
  });
  body += relation([[document.cx, document.bottom], [document.cx, 1390], [verification.cx, 1390], [verification.cx, verification.top]], "has verification decisions", 2470, 1378);

  // Actor references are dashed to distinguish them from aggregate ownership.
  body += relation([[user.right, 400], [2650, 400], [2650, 1360], [verification.cx, 1360], [verification.cx, verification.top]], "verifier", 2650, 1348, "1", "0..*", true);
  body += relation([[user.left, 400], [600, 400], [600, 1450], [review.cx, 1450], [review.cx, review.top]], "reviewer", 860, 1438, "1", "0..*", true);
  body += relation([[user.cx, user.bottom], [user.cx, 1460], [history.cx, 1460], [history.cx, history.top]], "changed by", 1470, 1448, "1", "0..*", true);
  body += relation([[user.right, 365], [2410, 365], [2410, 1450], [audit.cx, 1450], [audit.cx, audit.top]], "actor", 2070, 1438, "0..1", "0..*", true);

  // Draw entities after relationships so table borders remain crisp.
  body += entities.map((entity) => entity.body).join("");

  body += `<rect x="80" y="1995" width="3240" height="72" fill="${paper}" stroke="${mid}" stroke-width="2"/>`;
  body += text(110, 2024, "Cardinality: 1 = exactly one; 0..* = zero or many; 0..1 = optional one.", "tiny");
  body += text(110, 2052, "Solid lines show domain ownership. Dashed lines show actor/audit references to USER. PK = primary key; FK = foreign key; UQ = unique.", "tiny");
  body += text(3290, 2038, "Scope: core promotion-domain entities", "tiny", "end");

  return svgDocument(width, height, body);
}

function stateBox(x, y, width, height, lines) {
  return `<g><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="28" fill="${paper}" stroke="${ink}" stroke-width="4"/>${multiline(
    x + width / 2,
    y + height / 2 - (lines.length - 1) * 17 + 10,
    lines,
    "state-label",
    "middle",
    34
  )}</g>`;
}

function transition(points, labelValue, labelX, labelY) {
  let body = pathLine(points, { dashed: false, arrow: true, width: 3 });
  if (labelValue) {
    const width = Math.max(130, labelValue.length * 10.5);
    body += `<rect x="${labelX - width / 2}" y="${labelY - 24}" width="${width}" height="31" fill="${paper}"/>`;
    body += text(labelX, labelY, labelValue, "transition", "middle");
  }
  return body;
}

function createWorkflowDiagram() {
  const width = 3600;
  const height = 1500;
  let body = text(width / 2, 66, "Promotion Application State Lifecycle", "title", "middle");
  body += text(width / 2, 105, "UML state-machine representation of controlled review, correction, escalation, and completion paths", "small", "middle");

  const y = 560;
  const h = 140;
  body += `<circle cx="85" cy="630" r="24" fill="${ink}"/>`;
  body += stateBox(150, y, 280, h, ["Draft"]);
  body += stateBox(510, y, 300, h, ["Submitted"]);
  body += stateBox(900, y, 360, h, ["Department", "Review"]);
  body += stateBox(1360, y, 340, h, ["HR Verification"]);
  body += stateBox(1800, y, 360, h, ["Committee", "Review"]);
  body += stateBox(2260, y, 330, h, ["Recommended"]);
  body += stateBox(2690, y, 390, h, ["Approved by", "Authority"]);
  body += stateBox(3180, y, 280, h, ["Completed"]);
  body += `<circle cx="3545" cy="630" r="30" fill="${paper}" stroke="${ink}" stroke-width="4"/><circle cx="3545" cy="630" r="19" fill="${ink}"/>`;

  body += transition([[109, 630], [150, 630]], "start application", 210, 520);
  body += transition([[430, 630], [510, 630]], "submit complete evidence", 470, 605);
  body += transition([[810, 630], [900, 630]], "route to scoped reviewer", 855, 605);
  body += transition([[1260, 630], [1360, 630]], "forward", 1310, 605);
  body += transition([[1700, 630], [1800, 630]], "eligible and verified", 1750, 605);
  body += transition([[2160, 630], [2260, 630]], "recommend", 2210, 605);
  body += transition([[2590, 630], [2690, 630]], "record approval", 2640, 605);
  body += transition([[3080, 630], [3180, 630]], "finalise record", 3130, 605);
  body += transition([[3460, 630], [3515, 630]], "close", 3485, 605);

  // Correction loop above the main lifecycle.
  body += stateBox(980, 190, 460, 140, ["Returned for Correction"]);
  body += transition([[1080, 560], [1080, 330]], "evidence incomplete", 945, 450);
  body += transition([[1530, 560], [1530, 260], [1440, 260]], "rejected evidence", 1585, 430);
  body += transition([[980, 260], [660, 260], [660, 560]], "correct and resubmit", 790, 244);

  // Controlled further-review loop and non-recommendation outcome below.
  body += stateBox(1540, 1010, 430, 140, ["Further Review", "Required"]);
  body += transition([[1530, 700], [1530, 1080], [1540, 1080]], "criteria not satisfied", 1430, 890);
  body += transition([[1980, 700], [1980, 1080], [1970, 1080]], "request clarification", 2070, 890);
  body += transition([[1755, 1010], [1755, 910], [1530, 910], [1530, 700]], "HR re-verifies", 1640, 894);
  body += transition([[1540, 1080], [1080, 1080], [1080, 700]], "department clarification", 1300, 1064);

  body += stateBox(2260, 1010, 390, 140, ["Not Recommended"]);
  body += transition([[2070, 700], [2070, 930], [2455, 930], [2455, 1010]], "do not recommend", 2260, 914);
  body += transition([[2650, 1080], [3320, 1080], [3320, 700]], "record final outcome", 2985, 1064);

  body += `<rect x="120" y="1325" width="3360" height="92" fill="${paper}" stroke="${mid}" stroke-width="2"/>`;
  body += text(150, 1360, "Control rule: every state change is role-authorised, timestamped, and written to status history and the audit log.", "small");
  body += text(150, 1395, "Terminal completion occurs after either authority approval or a formally recorded non-recommendation.", "small");

  return svgDocument(width, height, body);
}

const diagrams = [
  ["figure-05-ch4-02-component-diagram", createComponentDiagram()],
  ["figure-06-ch4-03-entity-relationship-diagram", createErdDiagram()],
  ["figure-07-ch4-04-promotion-workflow-state-diagram", createWorkflowDiagram()],
];

async function main() {
  for (const [name, svg] of diagrams) {
    const svgPath = path.join(outputDir, `${name}.svg`);
    const pngPath = path.join(outputDir, `${name}.png`);
    fs.writeFileSync(svgPath, svg, "utf8");
    await sharp(Buffer.from(svg)).resize({ width: 4200 }).png({ compressionLevel: 9 }).toFile(pngPath);
    const metadata = await sharp(pngPath).metadata();
    console.log(`${name}: SVG + ${metadata.width}x${metadata.height} PNG`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
