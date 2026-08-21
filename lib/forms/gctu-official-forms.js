const crypto = require('crypto');
const { ACADEMIC_FORM_TEMPLATES } = require('./academic-official-forms');
const { SCHEDULE_K_APPLICATION_TEMPLATES } = require('./schedule-k-application-forms');
const { SCHEDULE_K_ABILITY_TEMPLATES } = require('./schedule-k-ability-forms');
const { SCHEDULE_K_AREA_TEMPLATES } = require('./schedule-k-area-forms');

const FORM_TEMPLATES = [
  ...ACADEMIC_FORM_TEMPLATES,
  ...SCHEDULE_K_APPLICATION_TEMPLATES,
  ...SCHEDULE_K_ABILITY_TEMPLATES,
  ...SCHEDULE_K_AREA_TEMPLATES,
];

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = canonical(value[key]);
    return result;
  }, {});
}

function contentHash(template) {
  return crypto.createHash('sha256').update(JSON.stringify(canonical(template.schema))).digest('hex');
}

function routeMatches(template, routeCode) {
  if (!template.routeCodePrefixes || template.routeCodePrefixes.length === 0) return true;
  return Boolean(routeCode) && template.routeCodePrefixes.some((prefix) => routeCode.startsWith(prefix));
}

function resolveApplicableTemplates({ routeCode, trackType, staffCategory, audience }) {
  return FORM_TEMPLATES.filter((template) => (
    (!audience || template.audience === audience)
    && (!template.trackType || template.trackType === trackType)
    && (!template.staffCategory || template.staffCategory === staffCategory)
    && routeMatches(template, routeCode)
  ));
}

function validateOfficialFormTemplates() {
  const keys = new Set();
  for (const template of FORM_TEMPLATES) {
    const key = `${template.code}:${template.version}`;
    if (keys.has(key)) throw new Error(`Duplicate official form template ${key}`);
    keys.add(key);

    for (const section of template.schema.sections || []) {
      const fieldIds = new Set();
      for (const field of section.fields || []) {
        if (fieldIds.has(field.id)) throw new Error(`${key} has duplicate field ${field.id} in ${section.id}`);
        fieldIds.add(field.id);
        if (field.type === 'score_matrix' && field.totalWeight !== 100) {
          throw new Error(`${key} field ${field.id} has total weight ${field.totalWeight}; expected 100`);
        }
      }
    }
  }
  return true;
}

module.exports = {
  FORM_TEMPLATES,
  contentHash,
  resolveApplicableTemplates,
  validateOfficialFormTemplates,
};
