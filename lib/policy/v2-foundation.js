const sourceData = require('./v2-source-data');

const combinedScheduleK = sourceData.TRACKS.find((track) => track.code === 'SCHEDULE_K_ADMIN_PRO');

if (!combinedScheduleK) {
  throw new Error('The source policy data is missing the combined Schedule K definition.');
}

function scheduleKTrack(code, name, staffCategory, description) {
  return {
    ...combinedScheduleK,
    code,
    name,
    staffCategory,
    description,
    areas: combinedScheduleK.areas.map((area) => ({ ...area })),
  };
}

const TRACKS = [
  ...sourceData.TRACKS.filter((track) => track.code !== combinedScheduleK.code),
  scheduleKTrack(
    'SCHEDULE_K_ADMINISTRATIVE',
    'Schedule K Administrative Senior Member Promotion',
    'ADMINISTRATIVE_SENIOR_MEMBER',
    'Administrative routes using the shared Schedule K four-area framework.',
  ),
  scheduleKTrack(
    'SCHEDULE_K_PROFESSIONAL',
    'Schedule K Professional Senior Member Promotion',
    'PROFESSIONAL_SENIOR_MEMBER',
    'Professional routes using the shared Schedule K four-area framework and profession-specific rubrics.',
  ),
];

const REGISTRY_ROUTE_CODES = new Set([
  'K-REGISTRY-FIRST',
  'K-REGISTRY-MIDDLE',
  'K-REGISTRY-HIGHEST',
]);

const PROFESSORIAL_ROUTE_CODES = new Set([
  'J-SENIOR-LECTURER-TO-ASSOCIATE-PROFESSOR-CASE-I',
  'J-SENIOR-RESEARCH-FELLOW-TO-ASSOCIATE-PROFESSOR-CASE-II',
  'J-ASSOCIATE-PROFESSOR-TO-PROFESSOR-CASE-I',
  'J-ASSOCIATE-PROFESSOR-TO-PROFESSOR-CASE-II',
]);

function canonicalRoute(route) {
  if (route.trackCode === combinedScheduleK.code) {
    const highestTier = route.code.endsWith('-HIGHEST');
    return {
      ...route,
      trackCode: REGISTRY_ROUTE_CODES.has(route.code)
        ? 'SCHEDULE_K_ADMINISTRATIVE'
        : 'SCHEDULE_K_PROFESSIONAL',
      finalAuthority: highestTier ? 'COUNCIL' : 'UAPC',
      evidenceState: 'VERIFIED_CONFLICT',
      status: 'PROVISIONAL',
    };
  }

  if (PROFESSORIAL_ROUTE_CODES.has(route.code)) {
    return {
      ...route,
      finalAuthority: 'COUNCIL',
      evidenceState: 'VERIFIED_CONFLICT',
      status: 'PROVISIONAL',
    };
  }

  return route;
}

const ROUTES = sourceData.ROUTES.map(canonicalRoute);

const POLICY_CONFLICTS = [
  ...sourceData.POLICY_CONFLICTS.map((conflict) => {
    if (conflict.code !== 'SCHEDULE-K-FINAL-AUTHORITY') return conflict;
    return {
      ...conflict,
      description: 'Committee-function wording and the 2024 Administrative Procedures Manual differ on the final authority for Schedule K routes.',
      provisionalResolution: 'Use the 2024 Manual working route: UAPC decides ordinary cases and recommends Deputy Registrar or approved analogous routes to Council.',
      owner: 'Registrar / Legal Unit / Council Secretariat',
    };
  }),
  {
    code: 'SCHEDULE-J-PROFESSORIAL-FINAL-AUTHORITY',
    title: 'Final authority for Associate Professor and Professor routes',
    description: 'Detailed Schedule J and the 2024 Manual route professorial cases through UAPC to Council, while parts of the HOD Handbook contain inconsistent final-authority wording.',
    status: 'PROVISIONALLY_RESOLVED',
    sourceReferences: ['GCTU Basic Laws, Schedule J', 'Administrative Procedures Manual, 2024', 'Heads of Academic Departments Handbook, 2025'],
    affectedRouteCodes: [...PROFESSORIAL_ROUTE_CODES],
    provisionalResolution: 'Use Council as final/ratifying authority after UAPC and retain the conflict until Registrar/Legal confirms it.',
    owner: 'Registrar / Legal Unit / UAPC Secretariat',
  },
];

function validateFoundation() {
  sourceData.validateFoundation();

  const trackCodes = new Set(TRACKS.map((track) => track.code));
  if (trackCodes.size !== TRACKS.length) throw new Error('Canonical TRACKS contains duplicate codes.');
  if (trackCodes.has(combinedScheduleK.code)) throw new Error('Combined Schedule K source track leaked into persistence data.');

  for (const route of ROUTES) {
    if (!trackCodes.has(route.trackCode)) throw new Error(`Unknown canonical track ${route.trackCode}`);

    if (REGISTRY_ROUTE_CODES.has(route.code) && route.trackCode !== 'SCHEDULE_K_ADMINISTRATIVE') {
      throw new Error(`Registry route ${route.code} must use the administrative Schedule K track.`);
    }

    if (route.code.startsWith('K-') && !REGISTRY_ROUTE_CODES.has(route.code) && route.trackCode !== 'SCHEDULE_K_PROFESSIONAL') {
      throw new Error(`Professional route ${route.code} must use the professional Schedule K track.`);
    }

    if (route.code.startsWith('K-')) {
      const expectedAuthority = route.code.endsWith('-HIGHEST') ? 'COUNCIL' : 'UAPC';
      if (route.finalAuthority !== expectedAuthority) {
        throw new Error(`Schedule K route ${route.code} must use working authority ${expectedAuthority}.`);
      }
    }

    if (PROFESSORIAL_ROUTE_CODES.has(route.code) && route.finalAuthority !== 'COUNCIL') {
      throw new Error(`Professorial route ${route.code} must proceed to Council after UAPC.`);
    }
  }

  const conflictCodes = new Set(POLICY_CONFLICTS.map((conflict) => conflict.code));
  if (conflictCodes.size !== POLICY_CONFLICTS.length) throw new Error('Canonical policy conflicts contain duplicate codes.');

  return true;
}

module.exports = {
  ...sourceData,
  TRACKS,
  ROUTES,
  POLICY_CONFLICTS,
  validateFoundation,
};
