const { PrismaClient } = require('@prisma/client');
const {
  POLICY_SOURCES,
  POLICY_VERSIONS,
  ORGANIZATION_UNITS,
  OFFICE_DEFINITIONS,
  RANK_DEFINITIONS,
  TRACKS,
  ROUTES,
  POLICY_CONFLICTS,
  validateFoundation,
} = require('../lib/policy/v2-foundation');

const prisma = new PrismaClient();

function dateOrNull(value) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

async function seedPolicyRegistry() {
  const sourcesByCode = new Map();
  for (const source of POLICY_SOURCES) {
    const data = {
      title: source.title,
      authority: source.authority,
      issuingBody: source.issuingBody,
      sourceUrl: source.sourceUrl || null,
      issuedOn: dateOrNull(source.issuedOn),
      notes: source.notes || null,
    };
    const record = await prisma.policySource.upsert({
      where: { code: source.code },
      update: data,
      create: { code: source.code, ...data },
    });
    sourcesByCode.set(source.code, record);
  }

  const versionsByKey = new Map();
  for (const version of POLICY_VERSIONS) {
    const source = sourcesByCode.get(version.sourceCode);
    const data = {
      status: version.status,
      effectiveFrom: dateOrNull(version.effectiveFrom),
      effectiveTo: dateOrNull(version.effectiveTo),
      approvedBy: version.approvedBy || null,
      contentHash: version.contentHash || null,
      notes: version.notes || null,
    };
    const record = await prisma.policyVersion.upsert({
      where: {
        policySourceId_versionLabel: {
          policySourceId: source.id,
          versionLabel: version.versionLabel,
        },
      },
      update: data,
      create: {
        policySourceId: source.id,
        versionLabel: version.versionLabel,
        ...data,
      },
    });
    versionsByKey.set(`${version.sourceCode}:${version.versionLabel}`, record);
  }

  return versionsByKey;
}

async function seedInstitutionStructure() {
  const unitsByCode = new Map();
  for (const unit of ORGANIZATION_UNITS) {
    const parentId = unit.parentCode ? unitsByCode.get(unit.parentCode).id : null;
    const data = {
      name: unit.name,
      type: unit.type,
      parentId,
      isActive: unit.isActive !== false,
      validFrom: dateOrNull(unit.validFrom),
      validTo: dateOrNull(unit.validTo),
    };
    const record = await prisma.organizationUnit.upsert({
      where: { code: unit.code },
      update: data,
      create: { code: unit.code, ...data },
    });
    unitsByCode.set(unit.code, record);
  }

  for (const office of OFFICE_DEFINITIONS) {
    const data = {
      name: office.name,
      description: office.description || null,
      defaultUnitType: office.defaultUnitType || null,
      isActive: office.isActive !== false,
    };
    await prisma.officeDefinition.upsert({
      where: { code: office.code },
      update: data,
      create: { code: office.code, ...data },
    });
  }
}

async function seedRanks() {
  const ranksByCode = new Map();
  for (const rank of RANK_DEFINITIONS) {
    const data = {
      name: rank.name,
      category: rank.category,
      family: rank.family || null,
      level: rank.level,
      isTerminal: rank.isTerminal === true,
      isActive: rank.isActive !== false,
      validFrom: dateOrNull(rank.validFrom),
      validTo: dateOrNull(rank.validTo),
    };
    const record = await prisma.rankDefinition.upsert({
      where: { code: rank.code },
      update: data,
      create: { code: rank.code, ...data },
    });
    ranksByCode.set(rank.code, record);
  }
  return ranksByCode;
}

async function seedTracksAndRoutes(versionsByKey, ranksByCode) {
  const tracksByCode = new Map();
  const areasByTrackAndCode = new Map();

  for (const track of TRACKS) {
    const policyVersion = versionsByKey.get(track.policyVersionKey);
    const data = {
      name: track.name,
      type: track.type,
      staffCategory: track.staffCategory,
      status: track.status,
      description: track.description || null,
    };
    const record = await prisma.promotionTrack.upsert({
      where: {
        policyVersionId_code: {
          policyVersionId: policyVersion.id,
          code: track.code,
        },
      },
      update: data,
      create: {
        policyVersionId: policyVersion.id,
        code: track.code,
        ...data,
      },
    });
    tracksByCode.set(track.code, record);

    for (const area of track.areas) {
      const areaData = {
        name: area.name,
        description: area.description || null,
        sortOrder: area.sortOrder || 0,
        isCore: area.isCore === true,
      };
      const areaRecord = await prisma.assessmentAreaDefinition.upsert({
        where: {
          promotionTrackId_code: {
            promotionTrackId: record.id,
            code: area.code,
          },
        },
        update: areaData,
        create: {
          promotionTrackId: record.id,
          code: area.code,
          ...areaData,
        },
      });
      areasByTrackAndCode.set(`${track.code}:${area.code}`, areaRecord);
    }
  }

  for (const route of ROUTES) {
    const track = tracksByCode.get(route.trackCode);
    const currentRank = ranksByCode.get(route.currentRankCode);
    const targetRank = ranksByCode.get(route.targetRankCode);
    const routeData = {
      name: route.name,
      currentRankId: currentRank ? currentRank.id : null,
      targetRankId: targetRank.id,
      minimumYearsInRank: route.minimumYearsInRank ?? null,
      normalProgression: route.normalProgression !== false,
      finalAuthority: route.finalAuthority || null,
      evidenceState: route.evidenceState,
      status: route.status,
      sourceClause: route.sourceClause || null,
      effectiveFrom: dateOrNull(route.effectiveFrom),
      effectiveTo: dateOrNull(route.effectiveTo),
    };
    const routeRecord = await prisma.promotionRoute.upsert({
      where: {
        promotionTrackId_code: {
          promotionTrackId: track.id,
          code: route.code,
        },
      },
      update: routeData,
      create: {
        promotionTrackId: track.id,
        code: route.code,
        ...routeData,
      },
    });

    for (const requirement of route.requirements) {
      const requirementData = {
        name: requirement.name,
        type: requirement.type,
        numberValue: requirement.numberValue ?? null,
        textValue: requirement.textValue ?? null,
        booleanValue: requirement.booleanValue ?? null,
        jsonValue: requirement.jsonValue ?? null,
        evidenceState: requirement.evidenceState || 'VERIFIED',
        sourceClause: requirement.sourceClause || route.sourceClause || null,
        notes: requirement.notes || null,
      };
      await prisma.promotionRouteRequirement.upsert({
        where: {
          promotionRouteId_code: {
            promotionRouteId: routeRecord.id,
            code: requirement.code,
          },
        },
        update: requirementData,
        create: {
          promotionRouteId: routeRecord.id,
          code: requirement.code,
          ...requirementData,
        },
      });
    }

    for (const areaRequirement of route.areaRequirements) {
      const area = areasByTrackAndCode.get(`${route.trackCode}:${areaRequirement.areaCode}`);
      const areaData = {
        minimumCategory: areaRequirement.minimumCategory || null,
        required: areaRequirement.required !== false,
        evidenceState: areaRequirement.evidenceState || 'VERIFIED',
        sourceClause: areaRequirement.sourceClause || route.sourceClause || null,
      };
      await prisma.promotionRouteAreaRequirement.upsert({
        where: {
          promotionRouteId_assessmentAreaId: {
            promotionRouteId: routeRecord.id,
            assessmentAreaId: area.id,
          },
        },
        update: areaData,
        create: {
          promotionRouteId: routeRecord.id,
          assessmentAreaId: area.id,
          ...areaData,
        },
      });
    }
  }
}

async function seedPolicyConflicts() {
  for (const conflict of POLICY_CONFLICTS) {
    const data = {
      title: conflict.title,
      description: conflict.description,
      status: conflict.status,
      sourceReferences: conflict.sourceReferences,
      affectedRouteCodes: conflict.affectedRouteCodes || null,
      provisionalResolution: conflict.provisionalResolution || null,
      resolution: conflict.resolution || null,
      owner: conflict.owner || null,
      resolvedAt: dateOrNull(conflict.resolvedAt),
    };
    await prisma.policyConflict.upsert({
      where: { code: conflict.code },
      update: data,
      create: { code: conflict.code, ...data },
    });
  }
}

async function seedFoundationSettings() {
  await prisma.systemSetting.upsert({
    where: { key: 'policy.foundation.version' },
    update: { value: '2026-08-10' },
    create: {
      key: 'policy.foundation.version',
      value: '2026-08-10',
      description: 'Version of the verified GCTU V2 policy foundation seed.',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'policy.unverified_tracks.blocked' },
    update: { value: 'true' },
    create: {
      key: 'policy.unverified_tracks.blocked',
      value: 'true',
      description: 'Blocks eligibility decisions for tracks without a controlled approved policy version.',
    },
  });
}

async function main() {
  validateFoundation();

  const versionsByKey = await seedPolicyRegistry();
  await seedInstitutionStructure();
  const ranksByCode = await seedRanks();
  await seedTracksAndRoutes(versionsByKey, ranksByCode);
  await seedPolicyConflicts();
  await seedFoundationSettings();

  console.log('GCTU V2 policy foundation seeded successfully.');
  console.log(`Policy sources: ${POLICY_SOURCES.length}`);
  console.log(`Organization units: ${ORGANIZATION_UNITS.length}`);
  console.log(`Rank definitions: ${RANK_DEFINITIONS.length}`);
  console.log(`Promotion tracks: ${TRACKS.length}`);
  console.log(`Verified or provisional routes: ${ROUTES.length}`);
  console.log(`Tracked policy conflicts: ${POLICY_CONFLICTS.length}`);
  console.log('No lecturer or applicant account was seeded.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
