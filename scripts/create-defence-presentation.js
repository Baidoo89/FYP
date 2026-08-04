const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const PptxGenJS = require('pptxgenjs');
const { PDFDocument } = require('pdf-lib');

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'defence-pack');
const RENDERED = path.join(OUT, 'rendered-slides');
const DOWNLOADS = path.join(process.env.USERPROFILE || '', 'Downloads');
const PPTX_NAME = 'GCTU_Promotion_System_Defence_Benjamin_Baidoo.pptx';
const PDF_NAME = 'GCTU_Promotion_System_Defence_Benjamin_Baidoo.pdf';
const W = 1920;
const H = 1080;
const C = {
  navy: '#0B2239', teal: '#0A6F68', gold: '#D5A11E', ink: '#17212B',
  muted: '#5B6670', light: '#F2F5F6', line: '#D5DDE1', white: '#FFFFFF',
  blue: '#2D5B7C', green: '#2B7A4B', red: '#A33B3B', paleGold: '#FAF5E8',
  paleTeal: '#EAF4F3', paleBlue: '#EDF3F7', paleRed: '#F8EEEE',
};
const FONT = 'Aptos, Segoe UI, Arial, sans-serif';

fs.mkdirSync(OUT, { recursive: true });
fs.rmSync(RENDERED, { recursive: true, force: true });
fs.mkdirSync(RENDERED, { recursive: true });

function esc(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
function rect(x, y, w, h, fill, stroke = 'none', sw = 0, rx = 0) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" rx="${rx}"/>`;
}
function line(x1, y1, x2, y2, color = C.line, sw = 2, dash = '') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}
function circle(cx, cy, r, fill, stroke = 'none', sw = 0) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}
function text(lines, x, y, options = {}) {
  const values = Array.isArray(lines) ? lines : [lines];
  const size = options.size || 28;
  const color = options.color || C.ink;
  const weight = options.weight || 400;
  const anchor = options.anchor || 'start';
  const gap = options.gap || Math.round(size * 1.25);
  const opacity = options.opacity == null ? 1 : options.opacity;
  const style = options.italic ? 'italic' : 'normal';
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" opacity="${opacity}" font-style="${style}" letter-spacing="0">${values.map((value, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : gap}">${esc(value)}</tspan>`).join('')}</text>`;
}
function imageData(file) {
  const ext = path.extname(file).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}
function picture(file, x, y, w, h, fit = 'meet', opacity = 1) {
  return `<image href="${imageData(file)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid ${fit}" opacity="${opacity}"/>`;
}
function svg(body, background = C.white) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${rect(0, 0, W, H, background)}${body}</svg>`;
}
function frame(title, number, kicker = 'GCTU DIGITAL STAFF PROMOTION SUPPORT SYSTEM') {
  return [
    rect(0, 0, W, 18, C.teal),
    text(kicker, 78, 63, { size: 18, color: C.teal, weight: 700 }),
    text(title, 78, 133, { size: 46, color: C.navy, weight: 700 }),
    line(78, 160, 1842, 160, C.line, 2),
    text('BENJAMIN BAIDOO | 4231230141', 78, 1042, { size: 16, color: C.muted, weight: 600 }),
    text(String(number).padStart(2, '0'), 1842, 1042, { size: 16, color: C.teal, weight: 700, anchor: 'end' }),
  ].join('');
}
function bullet(label, body, x, y, width, accent = C.teal) {
  return [
    circle(x + 13, y + 13, 13, accent),
    text(label, x + 42, y + 8, { size: 23, color: C.navy, weight: 700 }),
    text(body, x + 42, y + 45, { size: 20, color: C.muted, gap: 27 }),
    line(x + 42, y + 119, x + width, y + 119, C.line, 1),
  ].join('');
}

const logo = path.join(ROOT, 'public', 'gctu-logo.jpg');
const architecture = path.join(ROOT, 'docs', 'print-clean-academic-diagrams', 'figure-04-ch4-01-system-architecture.png');
const workflow = path.join(ROOT, 'docs', 'print-clean-academic-diagrams', 'figure-07-ch4-04-promotion-workflow-state-diagram.png');
const hrQueue = path.join(ROOT, 'docs', 'images', 'fig-4-17-hr-master-queue.png');
const hrVerify = path.join(ROOT, 'docs', 'images', 'fig-4-18-hr-verification-detail.png');
const sysAdmin = path.join(ROOT, 'docs', 'images', 'fig-4-21-sysadmin-dashboard.png');
const login = path.join(ROOT, 'docs', 'images', 'fig-4-14-login.png');

const slides = [];
function addSlide(markup, notes) {
  slides.push({ markup: svg(markup), notes });
}

addSlide([
  picture(login, 1100, 0, 820, 1080, 'slice', 0.92),
  rect(0, 0, 1135, 1080, C.navy),
  rect(79, 101, 8, 720, C.gold),
  rect(115, 95, 176, 118, C.white, 'none', 0, 6),
  picture(logo, 126, 104, 154, 100),
  text('DESIGN AND IMPLEMENTATION OF A', 115, 292, { size: 21, color: '#9CCAC6', weight: 700 }),
  text(['Digital Staff Promotion', 'Support System for GCTU'], 115, 376, { size: 58, color: C.white, weight: 700, gap: 72 }),
  text(['Secure evidence. Controlled workflow.', 'Traceable decisions.'], 115, 570, { size: 30, color: '#D5E2E8', gap: 42 }),
  line(115, 705, 820, 705, '#486175', 2),
  text('PRESENTED BY', 115, 768, { size: 17, color: C.gold, weight: 700 }),
  text('Benjamin Baidoo', 115, 817, { size: 34, color: C.white, weight: 700 }),
  text('4231230141  |  August 2026', 115, 861, { size: 22, color: '#BDD0D9' }),
  text('FINAL YEAR PROJECT DEFENCE', 115, 1015, { size: 16, color: '#9CCAC6', weight: 700 }),
].join(''), 'Introduce the title, name, and scope in under 30 seconds. State that the project supports academic promotion decisions from evidence submission to final-outcome recording.');

addSlide([
  frame('The problem is a broken information flow', 2, 'PROBLEM AND MOTIVATION'),
  text(['The manual process creates delay because evidence, responsibility,', 'and status are not visible in one controlled record.'], 78, 222, { size: 31, color: C.ink, gap: 41 }),
  ...[
    ['01', 'Fragmented evidence', ['Physical and scattered files', 'are difficult to trace.'], C.teal],
    ['02', 'Slow routing', ['Movement between offices', 'depends on manual follow-up.'], C.blue],
    ['03', 'Limited visibility', ['Applicants cannot reliably see', 'where action is required.'], C.gold],
    ['04', 'Weak auditability', ['Reconstructing who acted,', 'what changed, and when is hard.'], C.red],
  ].map(([n, heading, body, accent], index) => {
    const x = 78 + index * 442;
    return [
      text(n, x, 405, { size: 26, color: accent, weight: 700 }),
      line(x, 432, x + 355, 432, accent, 5),
      text(heading, x, 493, { size: 27, color: C.navy, weight: 700 }),
      text(body, x, 545, { size: 21, color: C.muted, gap: 30 }),
    ].join('');
  }),
  rect(78, 753, 1764, 187, C.navy),
  text('RESEARCH PROBLEM', 112, 802, { size: 16, color: C.gold, weight: 700 }),
  text(['How can GCTU standardise promotion evidence and routing while', 'improving security, transparency, and institutional accountability?'], 112, 855, { size: 31, color: C.white, weight: 600, gap: 42 }),
].join(''), 'Explain that the research problem is not merely the absence of a website. It is the absence of a consistent, secure, and auditable information flow.');

addSlide([
  frame('Aim and six objectives', 3, 'RESEARCH DIRECTION'),
  rect(78, 204, 1764, 142, C.navy),
  text('AIM', 112, 249, { size: 17, color: C.gold, weight: 700 }),
  text(['Design and implement a GCTU-adapted digital platform that supports', 'the academic staff promotion workflow from submission to final recording.'], 112, 294, { size: 28, color: C.white, weight: 600, gap: 37 }),
  ...[
    ['01', 'Examine bottlenecks', 'Identify delay, inconsistency, and security risks.'],
    ['02', 'Design the workflow', 'Standardise submission, review, verification, and tracking.'],
    ['03', 'Centralise records', 'Store applications, evidence, feedback, and history securely.'],
    ['04', 'Enforce role access', 'Separate lecturer, academic, HR, committee, and admin duties.'],
    ['05', 'Support eligibility', 'Apply configured rules only to HR-verified evidence.'],
    ['06', 'Improve accountability', 'Provide status, notifications, reports, and audit logs.'],
  ].map(([n, heading, body], index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 78 + col * 588;
    const y = 418 + row * 244;
    return [
      circle(x + 25, y + 25, 25, row === 0 ? C.teal : C.blue),
      text(n, x + 25, y + 33, { size: 16, color: C.white, weight: 700, anchor: 'middle' }),
      text(heading, x + 68, y + 13, { size: 25, color: C.navy, weight: 700 }),
      text([body.split(' ').slice(0, 5).join(' '), body.split(' ').slice(5).join(' ')], x + 68, y + 58, { size: 19, color: C.muted, gap: 27 }),
      line(x, y + 154, x + 515, y + 154, C.line, 1),
    ].join('');
  }),
  text('RESULT: all six objectives achieved; Objective 5 is explicitly bounded to prototype completeness rules.', 78, 961, { size: 20, color: C.teal, weight: 700 }),
].join(''), 'Summarise the six objectives without reading them word for word. State that all were achieved and that eligibility was achieved within the declared prototype scope.');

addSlide([
  frame('Prototyping turned policy into tested workflow', 4, 'METHOD AND REQUIREMENTS'),
  text(['Repeated design, implementation, and evaluation were appropriate because', 'institutional workflow requirements became clearer through a working prototype.'], 78, 218, { size: 29, color: C.ink, gap: 39 }),
  line(178, 451, 1742, 451, C.line, 7),
  ...[
    ['1', 'Analyse', ['Manual bottlenecks', 'and policy context'], C.teal],
    ['2', 'Model', ['Roles, data, states,', 'and interactions'], C.blue],
    ['3', 'Build', ['Interfaces, APIs,', 'RBAC, and storage'], C.gold],
    ['4', 'Test', ['Functions, integration,', 'browser workflow'], C.green],
    ['5', 'Refine', ['Correct defects and', 'clarify terminology'], C.red],
  ].map(([n, heading, body, accent], index) => {
    const x = 178 + index * 391;
    return [
      circle(x, 451, 42, accent, C.white, 7),
      text(n, x, 462, { size: 26, color: C.white, weight: 700, anchor: 'middle' }),
      text(heading, x, 543, { size: 26, color: C.navy, weight: 700, anchor: 'middle' }),
      text(body, x, 588, { size: 19, color: C.muted, anchor: 'middle', gap: 27 }),
    ].join('');
  }),
  rect(78, 754, 1764, 166, C.light),
  text('REQUIREMENT SOURCES', 112, 798, { size: 16, color: C.teal, weight: 700 }),
  text('Study findings', 112, 856, { size: 24, color: C.navy, weight: 700 }),
  text('GCTU policy documents', 503, 856, { size: 24, color: C.navy, weight: 700 }),
  text('Role responsibilities', 1017, 856, { size: 24, color: C.navy, weight: 700 }),
  text('End-to-end testing evidence', 1438, 856, { size: 24, color: C.navy, weight: 700 }),
].join(''), 'Justify prototyping. Mention that the full running workflow exposed a scoring defect that code inspection alone had not revealed. Use the exact Chapter 3 sample figures only if asked.');

addSlide([
  frame('Layered architecture with server-enforced controls', 5, 'SYSTEM ARCHITECTURE AND SECURITY'),
  text('USERS AND ROLE WORKSPACES', 78, 211, { size: 17, color: C.teal, weight: 700 }),
  ...[
    ['Lecturer', 'Submit + track', C.teal],
    ['HOD / Dean', 'Scoped review', C.blue],
    ['HR', 'Verify + record', C.gold],
    ['Committee', 'Recommend', C.green],
    ['System Admin', 'Configure', C.red],
  ].map(([role, action, accent], index) => {
    const x = 78 + index * 353;
    return [
      rect(x, 245, 320, 102, C.light), rect(x, 245, 8, 102, accent),
      text(role, x + 27, 288, { size: 23, color: C.navy, weight: 700 }),
      text(action, x + 27, 323, { size: 17, color: C.muted, weight: 600 }),
    ].join('');
  }),
  line(960, 347, 960, 393, C.teal, 5),
  `<polygon points="960,405 948,384 972,384" fill="${C.teal}"/>`,
  rect(78, 405, 1764, 263, C.navy),
  text('NEXT.JS 15 APPLICATION + TYPESCRIPT SERVER API', 112, 451, { size: 18, color: C.gold, weight: 700 }),
  ...[
    ['Role-specific UI', 'Clear next actions'],
    ['Authentication', 'HTTP-only session'],
    ['RBAC + scope', 'Server enforced'],
    ['Workflow service', 'Valid transitions'],
    ['Eligibility engine', 'Verified evidence'],
    ['Notify + audit', 'Traceable actions'],
  ].map(([heading, body], index) => {
    const x = 112 + index * 281;
    return [
      rect(x, 492, 251, 124, '#153650', '#456079', 1),
      text(heading, x + 18, 540, { size: 20, color: C.white, weight: 700 }),
      text(body, x + 18, 579, { size: 16, color: '#BDD0D9', weight: 550 }),
    ].join('');
  }),
  line(960, 668, 960, 706, C.teal, 5),
  `<polygon points="960,718 948,697 972,697" fill="${C.teal}"/>`,
  rect(78, 718, 1764, 66, C.teal),
  text('PRISMA ORM  |  TYPED DATA ACCESS AND TRANSACTIONS', 960, 760, { size: 21, color: C.white, weight: 700, anchor: 'middle' }),
  rect(78, 818, 1764, 108, C.light, C.line, 2),
  text('POSTGRESQL', 112, 864, { size: 18, color: C.blue, weight: 700 }),
  text('Users + organisational scope', 380, 882, { size: 20, color: C.navy, weight: 650 }),
  text('Applications + workflow history', 796, 882, { size: 20, color: C.navy, weight: 650 }),
  text('Protected PDF evidence', 1266, 882, { size: 20, color: C.navy, weight: 650 }),
  text('Criteria + audit records', 1580, 882, { size: 20, color: C.navy, weight: 650 }),
  text('Passwords are hashed; access, ownership, scope, validation, and status transitions are checked on the server.', 78, 969, { size: 20, color: C.teal, weight: 700 }),
].join(''), 'Move from role workspaces to the Next.js application and TypeScript API, then through Prisma to PostgreSQL. Explain that server-side access, scope, ownership, validation, and workflow rules enforce security.');
addSlide([
  frame('A controlled workflow, not an automatic decision', 6, 'WORKFLOW AND GOVERNANCE'),
  text('PRIMARY PROMOTION PATH', 78, 214, { size: 17, color: C.teal, weight: 700 }),
  ...[
    [['DRAFT'], 'LECTURER', C.teal],
    [['SUBMITTED'], 'LECTURER', C.teal],
    [['ACADEMIC', 'REVIEW'], 'HOD / DEAN', C.blue],
    [['HR', 'VERIFICATION'], 'HR', C.gold],
    [['COMMITTEE', 'REVIEW'], 'COMMITTEE', C.green],
    [['AUTHORITY', 'DECISION'], 'AUTHORITY', C.red],
    [['COMPLETED'], 'HR RECORDS', C.teal],
  ].map(([stage, owner, accent], index) => {
    const x = 78 + index * 252;
    return [
      text(owner, x + 110, 272, { size: 14, color: accent, weight: 700, anchor: 'middle' }),
      rect(x, 303, 220, 139, C.light, C.line, 2),
      rect(x, 303, 220, 8, accent),
      text(stage, x + 110, stage.length === 1 ? 381 : 361, { size: 21, color: C.navy, weight: 700, anchor: 'middle', gap: 29 }),
      index < 6 ? line(x + 220, 373, x + 246, 373, C.teal, 4) : '',
      index < 6 ? `<polygon points="${x + 246},373 ${x + 232},365 ${x + 232},381" fill="${C.teal}"/>` : '',
    ].join('');
  }),
  rect(78, 525, 510, 156, C.paleRed),
  text('RETURNED FOR CORRECTION', 108, 571, { size: 16, color: C.red, weight: 700 }),
  text(['Specific feedback reopens evidence', 'replacement and resubmission.'], 108, 620, { size: 23, color: C.navy, weight: 650, gap: 32 }),
  line(328, 525, 328, 471, C.red, 4),
  `<polygon points="328,458 318,478 338,478" fill="${C.red}"/>`,
  rect(635, 525, 510, 156, C.paleGold),
  text('REQUIRES FURTHER REVIEW', 665, 571, { size: 16, color: '#8B6811', weight: 700 }),
  text(['The case returns to the relevant', 'academic, HR, or committee stage.'], 665, 620, { size: 23, color: C.navy, weight: 650, gap: 32 }),
  rect(1192, 525, 650, 156, C.paleTeal),
  text('ELIGIBILITY GATE', 1222, 571, { size: 16, color: C.teal, weight: 700 }),
  text(['Only HR-verified evidence is calculated.', 'Eligible means proceed to human review.'], 1222, 620, { size: 23, color: C.navy, weight: 650, gap: 32 }),
  rect(78, 741, 1764, 153, C.navy),
  text('ORGANISATIONAL GOVERNANCE', 112, 787, { size: 16, color: C.gold, weight: 700 }),
  text('HOD account = department scope', 112, 842, { size: 23, color: C.white, weight: 650 }),
  text('Dean account = faculty scope', 724, 842, { size: 23, color: C.white, weight: 650 }),
  text('Committee recommendation is not final approval', 1268, 842, { size: 23, color: C.white, weight: 650 }),
  text('Prototype boundary: HOD and Dean currently share one permission set and one academic-review stage.', 78, 957, { size: 20, color: C.red, weight: 700 }),
].join(''), 'Narrate the seven primary stages, then the correction and further-review loops. Explain department scope for HOD, faculty scope for Dean, and that committee recommendation is separate from authority approval.');
addSlide([
  frame('Eligibility is evidence completeness, not academic grading', 7, 'RULE-BASED DECISION SUPPORT'),
  text('CORE COMPLETENESS SCORE', 78, 218, { size: 17, color: C.teal, weight: 700 }),
  ...[
    ['Teaching', 40, C.teal],
    ['Research', 40, C.blue],
    ['Service', 20, C.gold],
  ].map(([name, value, accent], index) => {
    const y = 285 + index * 130;
    return [
      text(name, 78, y, { size: 27, color: C.navy, weight: 700 }),
      rect(270, y - 32, 590, 43, '#E5EAED'),
      rect(270, y - 32, 590 * value / 40, 43, accent),
      text(`${value}%`, 900, y, { size: 28, color: accent, weight: 700, anchor: 'end' }),
    ].join('');
  }),
  text('ALL REQUIRED EVIDENCE GATES', 78, 705, { size: 17, color: C.teal, weight: 700 }),
  text(['Teaching  |  Research  |  Service', 'Qualifications  |  Publications  |  Professional Development'], 78, 756, { size: 23, color: C.ink, weight: 600, gap: 38 }),
  rect(1025, 205, 817, 252, C.paleTeal),
  text('THE ENGINE ANSWERS', 1065, 252, { size: 16, color: C.teal, weight: 700 }),
  text(['Are the configured years-in-rank', 'and required verified records present?'], 1065, 316, { size: 30, color: C.navy, weight: 700, gap: 41 }),
  rect(1025, 493, 817, 252, C.paleGold),
  text('HUMAN REVIEWERS ANSWER', 1065, 540, { size: 16, color: '#8B6811', weight: 700 }),
  text(['Is the evidence academically strong,', 'relevant, and suitable for promotion?'], 1065, 604, { size: 30, color: C.navy, weight: 700, gap: 41 }),
  rect(1025, 783, 817, 137, C.navy),
  text('100/100 = verified core completeness', 1065, 837, { size: 27, color: C.white, weight: 700 }),
  text('It is not a quality grade and not the final decision.', 1065, 881, { size: 20, color: '#C8D8E0' }),
  text('Eligibility permits onward review; it never grants promotion.', 78, 963, { size: 20, color: C.red, weight: 700 }),
].join(''), 'Explain the 40-40-20 core completeness model and the six required evidence gates. Protect the distinction between completeness, eligibility, qualitative merit, and final decision.');

addSlide([
  frame('Implemented role-specific workspaces', 8, 'IMPLEMENTATION EVIDENCE'),
  text('Real interfaces from the completed prototype', 78, 211, { size: 24, color: C.muted }),
  rect(78, 250, 1134, 638, C.white, C.line, 2),
  picture(hrQueue, 92, 264, 1106, 610, 'meet'),
  rect(1252, 250, 590, 300, C.white, C.line, 2),
  picture(hrVerify, 1264, 262, 566, 276, 'meet'),
  rect(1252, 588, 590, 300, C.white, C.line, 2),
  picture(sysAdmin, 1264, 600, 566, 276, 'meet'),
  rect(98, 813, 306, 51, C.navy),
  text('HR master queue', 251, 846, { size: 18, color: C.white, weight: 700, anchor: 'middle' }),
  rect(1272, 486, 268, 42, C.teal),
  text('Evidence verification', 1406, 514, { size: 16, color: C.white, weight: 700, anchor: 'middle' }),
  rect(1272, 824, 302, 42, C.blue),
  text('System administration', 1423, 852, { size: 16, color: C.white, weight: 700, anchor: 'middle' }),
  text('Clear next actions, searchable queues, document preview, status labels, and organisational scope.', 78, 954, { size: 21, color: C.teal, weight: 700 }),
].join(''), 'Let the screenshots prove the implementation. Name the queue, document preview, criteria and structure management, and clear role-specific next actions. Do not describe every control.');

addSlide([
  frame('Testing changed the system, not just the report', 9, 'VERIFICATION AND RESULTS'),
  rect(78, 205, 412, 273, C.navy),
  text('36', 284, 335, { size: 94, color: C.white, weight: 700, anchor: 'middle' }),
  text('formal functional and', 284, 396, { size: 22, color: '#C8D8E0', weight: 600, anchor: 'middle' }),
  text('integration tests', 284, 429, { size: 22, color: '#C8D8E0', weight: 600, anchor: 'middle' }),
  ...[
    ['Type safety', ['TypeScript', 'verification'], C.teal],
    ['Build', ['Production', 'compilation'], C.blue],
    ['Database', ['Health and', 'seed checks'], C.gold],
    ['Browser', ['Complete role', 'workflow'], C.green],
    ['Responsive', ['1440 px and', '390 px views'], C.red],
  ].map(([heading, body, accent], index) => {
    const x = 544 + (index % 3) * 424;
    const y = 205 + Math.floor(index / 3) * 225;
    return [
      rect(x, y, 384, 187, C.light),
      rect(x, y, 384, 7, accent),
      text(heading, x + 27, y + 59, { size: 24, color: C.navy, weight: 700 }),
      text(body, x + 27, y + 105, { size: 20, color: C.muted, gap: 28 }),
    ].join('');
  }),
  rect(78, 665, 1764, 251, C.paleGold),
  text('DEFECT FOUND THROUGH END-TO-END TESTING', 112, 715, { size: 17, color: '#8B6811', weight: 700 }),
  text(['Initial result: verified evidence could still produce a zero score.', 'Root cause: the calculation depended on the wrong data source.', 'Correction: calculate directly from HR-verified document categories.'], 112, 773, { size: 27, color: C.navy, weight: 650, gap: 43 }),
  text('Result: workflow evidence directly improved implementation correctness.', 78, 963, { size: 20, color: C.green, weight: 700 }),
].join(''), 'State the test layers. Use the zero-score defect as the strongest evidence for prototyping and end-to-end testing. Explain the correction without drifting into code-level detail.');

addSlide([
  frame('Limitations define the production roadmap', 10, 'LIMITATIONS AND FUTURE WORK'),
  text('CURRENT PROTOTYPE BOUNDARY', 78, 215, { size: 17, color: C.red, weight: 700 }),
  text('NEXT PRODUCTION STEP', 1115, 215, { size: 17, color: C.green, weight: 700 }),
  ...[
    ['Completeness score only', 'Validate qualitative Schedule J assessment'],
    ['Combined HOD / Dean stage', 'Create sequential HOD then Dean routing'],
    ['Academic pathway only', 'Add Schedule K staff pathway'],
    ['Criteria overwritten in place', 'Version rules by effective date'],
    ['UAT materials prepared', 'Run formal UAT with GCTU officers'],
    ['Standalone authentication', 'Integrate SSO and staff records'],
  ].map(([left, right], index) => {
    const y = 285 + index * 105;
    return [
      rect(78, y - 42, 682, 76, index % 2 === 0 ? C.light : C.white),
      text(left, 106, y + 4, { size: 23, color: C.navy, weight: 650 }),
      line(793, y - 4, 1066, y - 4, C.line, 4),
      `<polygon points="1066,${y - 4} 1048,${y - 14} 1048,${y + 6}" fill="${C.teal}"/>`,
      rect(1115, y - 42, 727, 76, index % 2 === 0 ? C.paleTeal : C.white),
      text(right, 1143, y + 4, { size: 23, color: C.navy, weight: 650 }),
    ].join('');
  }),
  rect(78, 916, 1764, 68, C.navy),
  text('Priority: institutional validation first, then statutory routing and criteria versioning.', 960, 959, { size: 23, color: C.white, weight: 700, anchor: 'middle' }),
].join(''), 'State limitations plainly. Emphasise that formal UAT and institutional validation come before production deployment, followed by sequential routing and versioned criteria.');

addSlide([
  rect(0, 0, W, H, C.navy),
  rect(0, 0, W, 18, C.gold),
  picture(logo, 79, 72, 145, 98, 'meet'),
  text('CONCLUSION', 79, 235, { size: 18, color: C.gold, weight: 700 }),
  text(['A secure, centralised, and auditable', 'promotion support workflow for GCTU'], 79, 314, { size: 50, color: C.white, weight: 700, gap: 62 }),
  ...[
    ['01', 'Standardises', 'evidence and workflow'],
    ['02', 'Controls', 'role and organisational access'],
    ['03', 'Preserves', 'human judgement and accountability'],
  ].map(([n, verb, body], index) => {
    const x = 79 + index * 560;
    return [
      text(n, x, 580, { size: 20, color: C.gold, weight: 700 }),
      line(x, 606, x + 460, 606, '#476175', 2),
      text(verb, x, 663, { size: 28, color: C.white, weight: 700 }),
      text(body, x, 704, { size: 22, color: '#BDD0D9' }),
    ].join('');
  }),
  rect(79, 817, 1762, 116, C.teal),
  text('The system supports promotion decisions. It does not replace decision-makers.', 960, 888, { size: 31, color: C.white, weight: 700, anchor: 'middle' }),
  text('LIVE DEMONSTRATION  |  BENJAMIN BAIDOO REPRESENTATIVE RECORD', 79, 1017, { size: 17, color: '#9CCAC6', weight: 700 }),
].join(''), 'Deliver the final three contributions, protect the decision-support boundary, and transition directly to the controlled Benjamin Baidoo demonstration.');

async function build() {
  const rendered = [];
  for (let index = 0; index < slides.length; index += 1) {
    const output = path.join(RENDERED, `slide-${String(index + 1).padStart(2, '0')}.png`);
    await sharp(Buffer.from(slides[index].markup)).png({ compressionLevel: 9 }).toFile(output);
    rendered.push(output);
  }

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Benjamin Baidoo';
  pptx.company = 'Ghana Communication Technology University';
  pptx.subject = 'Final Year Project Defence';
  pptx.title = 'Digital Staff Promotion Support System for GCTU';
  pptx.lang = 'en-GH';
  pptx.theme = {
    headFontFace: 'Aptos Display', bodyFontFace: 'Aptos', lang: 'en-GH',
  };
  pptx.defineSlideMaster({
    title: 'FULL_BLEED',
    background: { color: 'FFFFFF' },
    objects: [],
    slideNumber: { x: 12.8, y: 7.1, color: 'FFFFFF' },
  });
  rendered.forEach((file, index) => {
    const slide = pptx.addSlide('FULL_BLEED');
    slide.addImage({ path: file, x: 0, y: 0, w: 13.333333, h: 7.5 });
    slide.addNotes(slides[index].notes);
  });

  const pptxPath = path.join(OUT, PPTX_NAME);
  await pptx.writeFile({ fileName: pptxPath });

  const pdf = await PDFDocument.create();
  pdf.setTitle('Digital Staff Promotion Support System for GCTU - Defence');
  pdf.setAuthor('Benjamin Baidoo');
  for (const file of rendered) {
    const png = await pdf.embedPng(fs.readFileSync(file));
    const page = pdf.addPage([960, 540]);
    page.drawImage(png, { x: 0, y: 0, width: 960, height: 540 });
  }
  const pdfPath = path.join(OUT, PDF_NAME);
  fs.writeFileSync(pdfPath, await pdf.save());

  const thumbW = 480;
  const thumbH = 270;
  const gap = 20;
  const columns = 2;
  const rows = Math.ceil(rendered.length / columns);
  const sheetW = columns * thumbW + (columns + 1) * gap;
  const sheetH = rows * thumbH + (rows + 1) * gap;
  const composites = [];
  for (let index = 0; index < rendered.length; index += 1) {
    const input = await sharp(rendered[index]).resize(thumbW, thumbH).png().toBuffer();
    composites.push({ input, left: gap + (index % columns) * (thumbW + gap), top: gap + Math.floor(index / columns) * (thumbH + gap) });
  }
  const contactPath = path.join(OUT, 'defence-slides-contact-sheet.png');
  await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: '#DDE3E6' } })
    .composite(composites)
    .png()
    .toFile(contactPath);

  if (fs.existsSync(DOWNLOADS)) {
    fs.copyFileSync(pptxPath, path.join(DOWNLOADS, PPTX_NAME));
    fs.copyFileSync(pdfPath, path.join(DOWNLOADS, PDF_NAME));
  }
  console.log(`Created ${slides.length} slides.`);
  console.log(`PowerPoint: ${pptxPath}`);
  console.log(`PDF fallback: ${pdfPath}`);
  console.log(`Contact sheet: ${contactPath}`);
  console.log(`Downloads copies: ${DOWNLOADS}`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
