const PERFORMANCE_OPTIONS = ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'SATISFACTORY', 'UNSATISFACTORY'];

function text(id, label, options = {}) {
  return { id, type: 'text', label, ...options };
}

function textarea(id, label, options = {}) {
  return { id, type: 'textarea', label, ...options };
}

function date(id, label, options = {}) {
  return { id, type: 'date', label, ...options };
}

function select(id, label, options, extra = {}) {
  return { id, type: 'select', label, options, ...extra };
}

function repeater(id, label, columns, options = {}) {
  return { id, type: 'repeater', label, columns, ...options };
}

function scoreMatrix(id, label, rows, options = {}) {
  return {
    id,
    type: 'score_matrix',
    label,
    rows: rows.map(([rowId, rowLabel, weight]) => ({ id: rowId, label: rowLabel, weight })),
    totalWeight: rows.reduce((total, row) => total + row[2], 0),
    ...options,
  };
}

function identitySection(unitLabel = 'Department / Unit') {
  return {
    id: 'application_identity',
    title: 'Application identity',
    fields: [
      text('applicantName', 'Applicant name', { required: true, autofill: 'applicant.name', readOnly: true }),
      text('staffId', 'Staff ID', { required: true, autofill: 'applicant.staffId', readOnly: true }),
      text('currentRank', 'Current rank', { required: true, autofill: 'request.currentRank', readOnly: true }),
      text('targetRank', 'Rank applied for', { required: true, autofill: 'request.targetRank', readOnly: true }),
      text('unit', unitLabel, { required: true, autofill: 'assignment.unitName', readOnly: true }),
    ],
  };
}

function acknowledgementSchema(owner) {
  return {
    title: `Application Receipt - ${owner}`,
    instructions: 'Confirm receipt only after checking that the digital dossier is readable and assigned to the correct route.',
    declarationText: 'I acknowledge receipt of this promotion application and its recorded dossier version.',
    sections: [
      identitySection(),
      {
        id: 'receipt',
        title: 'Receipt and routing',
        fields: [
          date('receivedAt', 'Date received', { required: true }),
          text('dossierVersion', 'Dossier version received', { required: true, autofill: 'request.dossierVersion', readOnly: true }),
          select('completenessCheck', 'Initial completeness check', ['COMPLETE', 'RETURN_FOR_MISSING_ITEMS'], { required: true }),
          textarea('missingItems', 'Missing or unreadable items'),
          text('forwardedTo', 'Forwarded to / next authority'),
          date('forwardedAt', 'Date forwarded'),
        ],
      },
    ],
  };
}

module.exports = {
  PERFORMANCE_OPTIONS,
  acknowledgementSchema,
  date,
  identitySection,
  repeater,
  scoreMatrix,
  select,
  text,
  textarea,
};
