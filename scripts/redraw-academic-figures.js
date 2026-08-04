const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.join(process.cwd(), 'docs', 'images');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function writeFigure(baseName, svg) {
  const svgPath = path.join(outDir, `${baseName}.svg`);
  const pngPath = path.join(outDir, `${baseName}.png`);
  fs.writeFileSync(svgPath, svg, 'utf8');
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(pngPath);
  const meta = await sharp(pngPath).metadata();
  console.log(`${baseName}.png ${meta.width}x${meta.height}`);
}

function header() {
  return `<defs>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 Z" fill="#111827"/></marker>
    <marker id="crow" markerWidth="18" markerHeight="14" refX="16" refY="7" orient="auto"><path d="M16,7 L2,1 M16,7 L2,7 M16,7 L2,13" stroke="#111827" stroke-width="2" fill="none"/></marker>
  </defs>
  <style>
    .page{fill:#fff}.ink{stroke:#111827;stroke-width:3;fill:none}.thin{stroke:#374151;stroke-width:2;fill:none}.dash{stroke:#6b7280;stroke-width:2;stroke-dasharray:8 8;fill:none}.arrow{stroke:#111827;stroke-width:3;fill:none;marker-end:url(#arrow)}
    .rel{stroke:#111827;stroke-width:2.4;fill:none;marker-end:url(#crow)}.label{font:600 24px Arial,Helvetica,sans-serif;fill:#111827}.text{font:500 23px Arial,Helvetica,sans-serif;fill:#111827}.small{font:500 20px Arial,Helvetica,sans-serif;fill:#374151}.tiny{font:500 18px Arial,Helvetica,sans-serif;fill:#374151}.head{font:700 28px Arial,Helvetica,sans-serif;fill:#fff}.entityHead{fill:#1f2937}.entity{fill:#fff;stroke:#111827;stroke-width:3}.fieldLine{stroke:#e5e7eb;stroke-width:1.5}.node{fill:#f9fafb;stroke:#111827;stroke-width:3}.decision{fill:#fff;stroke:#111827;stroke-width:3}.lane{fill:#f8fafc;stroke:#cbd5e1;stroke-width:2}.actorText{font:700 24px Arial,Helvetica,sans-serif;fill:#111827}
  </style>`;
}

function wrap(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${header()}<rect class="page" width="${w}" height="${h}"/>${body}</svg>`;
}

function multiText(lines, x, y, cls = 'text', line = 28, anchor = 'middle') {
  return lines.map((t, i) => `<text class="${cls}" x="${x}" y="${y + i * line}" text-anchor="${anchor}">${esc(t)}</text>`).join('');
}

function entity(x, y, w, title, fields) {
  const rowH = 34;
  const h = 58 + fields.length * rowH + 18;
  let s = `<rect class="entity" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/><rect class="entityHead" x="${x}" y="${y}" width="${w}" height="58" rx="8"/><rect class="entityHead" x="${x}" y="${y+30}" width="${w}" height="28"/><text class="head" x="${x + w/2}" y="${y + 38}" text-anchor="middle">${esc(title)}</text>`;
  fields.forEach((f, i) => {
    const yy = y + 58 + i * rowH;
    s += `<line class="fieldLine" x1="${x}" y1="${yy}" x2="${x+w}" y2="${yy}"/><text class="small" x="${x+18}" y="${yy+24}">${esc(f)}</text>`;
  });
  return s;
}

function box(x, y, w, h, lines, cls = 'node') {
  return `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/>${multiText(lines, x+w/2, y + h/2 - (lines.length-1)*13 + 8, 'text', 28)}`;
}

function diamond(cx, cy, w, h, lines) {
  const points = `${cx},${cy-h/2} ${cx+w/2},${cy} ${cx},${cy+h/2} ${cx-w/2},${cy}`;
  return `<polygon class="decision" points="${points}"/>${multiText(lines, cx, cy - (lines.length-1)*13 + 8, 'text', 28)}`;
}

function actor(x, y, label) {
  return `<circle class="ink" cx="${x}" cy="${y}" r="28"/><line class="ink" x1="${x}" y1="${y+28}" x2="${x}" y2="${y+110}"/><line class="ink" x1="${x-58}" y1="${y+62}" x2="${x+58}" y2="${y+62}"/><line class="ink" x1="${x}" y1="${y+110}" x2="${x-54}" y2="${y+178}"/><line class="ink" x1="${x}" y1="${y+110}" x2="${x+54}" y2="${y+178}"/>${multiText(label.split('\n'), x, y+220, 'actorText', 30)}`;
}

function oval(cx, cy, w, h, lines) {
  return `<ellipse class="node" cx="${cx}" cy="${cy}" rx="${w/2}" ry="${h/2}"/>${multiText(lines, cx, cy - (lines.length-1)*13 + 8, 'text', 28)}`;
}

function erDiagram() {
  const e = [];
  e.push(entity(80, 70, 420, 'Faculty', ['PK id', 'name', 'description', 'createdAt / updatedAt']));
  e.push(entity(690, 70, 440, 'Department', ['PK id', 'FK facultyId', 'name', 'description', 'createdAt / updatedAt']));
  e.push(entity(1280, 70, 440, 'User', ['PK id', 'FK departmentId', 'FK facultyId', 'name, email, staffId', 'role, currentRank', 'emailVerified, onboarded']));
  e.push(entity(610, 500, 590, 'PromotionRequest', ['PK id', 'FK lecturerId', 'currentRank, targetRank', 'yearsInCurrentRank', 'status', 'eligibilityStatus', 'totalScore, eligibilityReason']));
  e.push(entity(80, 940, 520, 'Document', ['PK id', 'FK requestId', 'FK uploadedById', 'category, title', 'fileName, fileType, fileSize', 'verificationStatus']));
  e.push(entity(80, 1390, 520, 'Verification', ['PK id', 'FK documentId', 'FK verifierId', 'decision', 'comment', 'createdAt']));
  e.push(entity(660, 970, 500, 'StatusHistory', ['PK id', 'FK promotionRequestId', 'FK changedById', 'oldStatus', 'newStatus', 'comment, createdAt']));
  e.push(entity(1220, 970, 500, 'ReviewComment', ['PK id', 'FK promotionRequestId', 'FK reviewerId', 'recommendation', 'comment', 'createdAt']));
  e.push(entity(660, 1390, 500, 'AuditLog', ['PK id', 'FK requestId', 'FK actorId', 'action', 'entityType / entityId', 'metadata, createdAt']));
  e.push(entity(1220, 1390, 500, 'Notification', ['PK id', 'FK userId', 'FK promotionRequestId', 'title, message', 'type, isRead', 'createdAt']));
  e.push(entity(80, 1850, 520, 'Score', ['PK id', 'FK promotionRequestId', 'category', 'score, weight', 'weightedScore', 'createdAt']));
  e.push(entity(760, 1850, 600, 'PromotionCriteria', ['PK id', 'currentRank, targetRank', 'minimumYearsInCurrentRank', 'requiredDocumentCategories', 'minimumTotalScore', 'isActive']));

  const r = [];
  function line(x1,y1,x2,y2,label,lx,ly){ r.push(`<path class="rel" d="M${x1},${y1} L${x2},${y2}"/><text class="tiny" x="${lx}" y="${ly}" text-anchor="middle">${esc(label)}</text>`); }
  line(500,170,690,170,'1 to many departments',595,150);
  line(1130,190,1280,190,'department users',1205,168);
  line(1500,370,1050,500,'lecturer owns requests',1375,440);
  line(760,860,460,940,'request contains documents',535,910);
  line(340,1265,340,1390,'document has verifications',455,1340);
  line(900,860,900,970,'status events',985,925);
  line(1080,760,1220,1020,'review comments',1235,895);
  line(900,860,900,1390,'audit records',990,1160);
  line(1120,815,1340,1390,'notifications',1310,1135);
  line(790,860,340,1850,'optional scores',465,1580);
  r.push(`<path class="thin" d="M1060,1850 C1060,1720 1110,1680 1200,1600"/><text class="tiny" x="1190" y="1765">criteria configures eligibility rules</text>`);
  return wrap(1800, 2250, [...e, ...r].join(''));
}

function useCaseDiagram() {
  const body = [];
  body.push(`<rect class="node" x="330" y="90" width="1140" height="1990" rx="6"/><text class="label" x="900" y="145" text-anchor="middle">Digital Staff Promotion Support System</text>`);
  body.push(actor(160, 260, 'Lecturer'));
  body.push(actor(160, 760, 'HOD / Dean'));
  body.push(actor(160, 1430, 'System\nAdmin'));
  body.push(actor(1640, 500, 'HR Admin'));
  body.push(actor(1640, 1120, 'Committee\nReviewer'));
  const cases = [
    ['UC1', 620, 280, ['Register / sign in', 'and complete profile']],
    ['UC2', 620, 480, ['Create promotion', 'application']],
    ['UC3', 620, 680, ['Upload evidence', 'documents']],
    ['UC4', 620, 880, ['Track status and', 'read feedback']],
    ['UC5', 900, 760, ['Review departmental', 'application']],
    ['UC6', 900, 960, ['Forward, return, or', 'request review']],
    ['UC7', 1180, 520, ['Verify or reject', 'evidence']],
    ['UC8', 1180, 720, ['View eligibility', 'recommendation']],
    ['UC9', 1180, 920, ['Record final HR', 'decision']],
    ['UC10', 1180, 1120, ['Generate reports', 'and exports']],
    ['UC11', 900, 1220, ['Review verified', 'application']],
    ['UC12', 900, 1420, ['Record committee', 'recommendation']],
    ['UC13', 620, 1540, ['Manage users,', 'faculties and departments']],
    ['UC14', 620, 1740, ['Configure promotion', 'criteria']],
    ['UC15', 900, 1740, ['View audit logs', 'and settings']],
    ['UC16', 1180, 1320, ['Eligibility engine', 'calculates score']],
  ];
  for (const [,x,y,lines] of cases) body.push(oval(x,y,330,118,lines));
  function assoc(x1,y1,x2,y2){ body.push(`<line class="thin" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`); }
  assoc(220, 310, 455, 280); assoc(220, 330, 455, 480); assoc(220, 350, 455, 680); assoc(220, 370, 455, 880);
  assoc(220, 810, 735, 760); assoc(220, 840, 735, 960);
  assoc(1580, 555, 1345, 520); assoc(1580, 575, 1345, 720); assoc(1580, 595, 1345, 920); assoc(1580, 615, 1345, 1120);
  assoc(1580, 1175, 1065, 1220); assoc(1580, 1195, 1065, 1420);
  assoc(220, 1510, 455, 1540); assoc(220, 1535, 455, 1740); assoc(220, 1560, 735, 1740);
  body.push(`<path class="dash" d="M1010,720 L1085,1320"/><text class="tiny" x="1055" y="1020" transform="rotate(76 1055 1020)">includes</text>`);
  body.push(`<path class="dash" d="M1035,520 L1115,1320"/><text class="tiny" x="1095" y="925" transform="rotate(84 1095 925)">triggers</text>`);
  return wrap(1800, 2200, body.join(''));
}

function activityDiagram() {
  const body = [];
  const lanes = [
    ['Lecturer',100,410], ['HOD / Dean',440,330], ['HR Admin',800,360], ['Eligibility Engine',1190,300], ['Committee Reviewer',1520,310], ['HR / Authority',1860,270]
  ];
  for (const [name,y,h] of lanes) {
    body.push(`<rect class="lane" x="70" y="${y}" width="1360" height="${h}" rx="0"/><text class="label" x="170" y="${y+45}" text-anchor="middle">${esc(name)}</text>`);
  }
  body.push(`<circle cx="750" cy="70" r="24" fill="#111827"/>`);
  body.push(box(520,130,460,72,['Create or open application']));
  body.push(box(520,245,460,72,['Upload required evidence']));
  body.push(diamond(750,385,360,120,['All evidence', 'attached?']));
  body.push(box(520,525,460,72,['Submit application']));
  body.push(box(500,650,500,72,['HOD/Dean reviews application']));
  body.push(diamond(750,760,390,120,['Academically', 'complete?']));
  body.push(box(500,900,500,72,['Forward application to HR']));
  body.push(box(500,1030,500,72,['HR verifies uploaded evidence']));
  body.push(diamond(750,1160,390,120,['Required evidence', 'verified?']));
  body.push(box(500,1305,500,72,['Calculate eligibility score']));
  body.push(diamond(750,1430,390,120,['Meets configured', 'threshold?']));
  body.push(box(500,1585,500,72,['Route to committee review']));
  body.push(diamond(750,1710,390,120,['Committee', 'recommendation?']));
  body.push(box(500,1875,500,72,['Record authority approval']));
  body.push(box(500,1990,500,72,['Complete workflow and notify applicant']));
  body.push(`<circle cx="750" cy="2120" r="28" fill="none" stroke="#111827" stroke-width="4"/><circle cx="750" cy="2120" r="16" fill="#111827"/>`);
  const arrows = [[750,94,750,130],[750,202,750,245],[750,317,750,325],[750,445,750,525],[750,597,750,650],[750,722,750,700],[750,820,750,900],[750,972,750,1030],[750,1102,750,1100],[750,1220,750,1305],[750,1377,750,1370],[750,1490,750,1585],[750,1657,750,1650],[750,1770,750,1875],[750,1947,750,1990],[750,2062,750,2092]];
  arrows.forEach(([x1,y1,x2,y2]) => body.push(`<path class="arrow" d="M${x1},${y1} L${x2},${y2}"/>`));
  body.push(`<path class="arrow" d="M570,385 C360,385 360,260 520,260"/><text class="tiny" x="420" y="355">No</text>`);
  body.push(`<path class="arrow" d="M945,760 C1170,760 1170,270 980,270"/><text class="tiny" x="1110" y="735">No: return for correction</text>`);
  body.push(`<path class="arrow" d="M945,1160 C1170,1160 1170,1035 1000,1035"/><text class="tiny" x="1130" y="1128">No: request correction</text>`);
  body.push(`<path class="arrow" d="M945,1430 C1180,1430 1180,1045 1000,1045"/><text class="tiny" x="1145" y="1400">No: further review</text>`);
  body.push(`<path class="arrow" d="M945,1710 C1180,1710 1180,1045 1000,1045"/><text class="tiny" x="1145" y="1680">Further review</text>`);
  body.push(`<path class="arrow" d="M555,1710 C350,1710 350,1990 500,2025"/><text class="tiny" x="330" y="1855">Not recommended</text>`);
  body.push(`<text class="tiny" x="765" y="510">Yes</text><text class="tiny" x="765" y="885">Yes</text><text class="tiny" x="765" y="1288">Yes</text><text class="tiny" x="765" y="1568">Yes</text><text class="tiny" x="765" y="1855">Recommended</text>`);
  return wrap(1500, 2180, body.join(''));
}

function sequenceDiagram() {
  const w = 1800, h = 1650;
  const xs = [160, 450, 740, 1030, 1320, 1600];
  const names = ['HR Admin','API Route','Workflow Service','Eligibility Engine','Prisma DB','Audit / Notification'];
  const body = [];
  xs.forEach((x,i)=>{
    body.push(`<rect class="node" x="${x-115}" y="70" width="230" height="70" rx="10"/>${multiText(names[i].split(' / '), x, i===5?100:112, 'text', 24)}`);
    body.push(`<line class="dash" x1="${x}" y1="140" x2="${x}" y2="1540"/>`);
  });
  function msg(from,to,y,label,ret=false){
    const x1=xs[from], x2=xs[to];
    body.push(`<path class="${ret?'dash':'arrow'}" d="M${x1},${y} L${x2},${y}"${ret?' marker-end="url(#arrow)"':''}/><text class="tiny" x="${(x1+x2)/2}" y="${y-12}" text-anchor="middle">${esc(label)}</text>`);
  }
  function act(i,y,h){ body.push(`<rect fill="#f3f4f6" stroke="#111827" stroke-width="2" x="${xs[i]-12}" y="${y}" width="24" height="${h}"/>`); }
  act(1,205,1140); act(2,285,940); act(3,445,520); act(4,360,680); act(5,1050,245);
  msg(0,1,210,'Request eligibility calculation');
  msg(1,2,290,'Validate role and request status');
  msg(2,4,365,'Load request, criteria and verified documents');
  msg(4,2,430,'Return request data',true);
  msg(2,3,505,'Apply configured promotion criteria');
  msg(3,3,590,'Count verified required categories');
  msg(3,3,675,'Compute criteria score and recommendation');
  msg(3,2,760,'Return eligibility result',true);
  msg(2,4,840,'Update request status and total score');
  msg(4,2,925,'Persisted result',true);
  msg(2,5,1060,'Write status history and audit log');
  msg(5,2,1140,'Audit records created',true);
  msg(2,5,1220,'Notify next responsible role');
  msg(2,1,1335,'Return updated application state',true);
  msg(1,0,1435,'Display score, reason and next status',true);
  return wrap(w,h,body.join(''));
}

(async () => {
  await writeFigure('fig-4-03-er-diagram', erDiagram());
  await writeFigure('fig-4-05-use-case-diagram', useCaseDiagram());
  await writeFigure('fig-4-06-overall-process-activity', activityDiagram());
  await writeFigure('fig-4-12-eligibility-sequence-diagram', sequenceDiagram());
})();
