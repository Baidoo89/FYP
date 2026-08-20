const OUTPUT_EQUIVALENCE_UNITS = Object.freeze({
  REFEREED_JOURNAL_ARTICLE: 1,
  PEER_REVIEWED_HIGHER_EDUCATION_BOOK: 3,
  PEER_REVIEWED_EXHIBITION: 1,
  INDEXED_CONFERENCE_PROCEEDING: 1,
  NON_INDEXED_CONFERENCE_PROCEEDING: 0.5,
  DEPLOYED_TECHNOLOGY_PRODUCT_DESIGN: 2,
  PATENTED_INVENTION: 3,
  PEER_REVIEWED_BOOK_CHAPTER: 1,
  NON_PEER_REVIEWED_BOOK_CHAPTER: 0.5,
});

function equivalenceUnitsFor(type) {
  const units = OUTPUT_EQUIVALENCE_UNITS[type];
  if (typeof units !== 'number') throw new Error(`Unsupported Schedule J output type: ${type}`);
  return units;
}

function wholeNumberRequirement(requirements, code) {
  const value = requirements.find((requirement) => requirement.code === code)?.numberValue;
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function academicRequirementsFromRoute(requirements = []) {
  return {
    submittedMinimum: wholeNumberRequirement(requirements, 'OUTPUTS_SUBMITTED_MIN'),
    submittedMaximum: wholeNumberRequirement(requirements, 'OUTPUTS_SUBMITTED_MAX'),
    minimumRefereed: wholeNumberRequirement(requirements, 'REFEREED_OUTPUTS_MIN'),
    bestOutputsRequired: wholeNumberRequirement(requirements, 'BEST_OUTPUTS_COUNT'),
  };
}

function evaluateAcademicDossier(input) {
  const requirements = input.requirements || {};
  const outputs = Array.isArray(input.outputs) ? input.outputs : [];
  const selectedOutputIds = Array.isArray(input.selectedOutputIds) ? input.selectedOutputIds : [];
  const uniqueSelectedIds = [...new Set(selectedOutputIds)];
  const claimedOutputs = outputs.filter((output) => output.claimedForCurrentRoute !== false);
  const outputById = new Map(outputs.map((output) => [Number(output.id), output]));
  const selectedOutputs = uniqueSelectedIds.map((id) => outputById.get(Number(id))).filter(Boolean);
  const invalidSelectionIds = uniqueSelectedIds.filter((id) => {
    const output = outputById.get(Number(id));
    return !output || output.claimedForCurrentRoute === false;
  });
  const blockers = [];
  const warnings = [];

  if (!input.applicantDeclaration) {
    blockers.push({ code: 'DECLARATION_REQUIRED', message: 'Confirm the applicant declaration before submission.' });
  }

  if (requirements.submittedMinimum !== null && claimedOutputs.length < requirements.submittedMinimum) {
    blockers.push({
      code: 'OUTPUT_MINIMUM_NOT_MET',
      message: `Claim at least ${requirements.submittedMinimum} scholarly outputs for this route.`,
    });
  }

  if (requirements.submittedMaximum !== null && claimedOutputs.length > requirements.submittedMaximum) {
    blockers.push({
      code: 'OUTPUT_MAXIMUM_EXCEEDED',
      message: `This route accepts at most ${requirements.submittedMaximum} claimed outputs; retain other work in the catalog but exclude it from this route.`,
    });
  }

  const refereedCount = claimedOutputs.filter((output) => output.isRefereed === true).length;
  if (requirements.minimumRefereed !== null && refereedCount < requirements.minimumRefereed) {
    blockers.push({
      code: 'REFEREED_MINIMUM_NOT_MET',
      message: `At least ${requirements.minimumRefereed} claimed outputs must be identified as refereed and remain subject to verification.`,
    });
  }

  if (requirements.bestOutputsRequired !== null && uniqueSelectedIds.length !== requirements.bestOutputsRequired) {
    blockers.push({
      code: 'BEST_N_INCOMPLETE',
      message: `Select exactly ${requirements.bestOutputsRequired} outputs for the frozen assessment packet.`,
    });
  }

  if (selectedOutputIds.length !== uniqueSelectedIds.length) {
    blockers.push({ code: 'DUPLICATE_SELECTION', message: 'An output can appear only once in the assessment packet.' });
  }

  if (invalidSelectionIds.length > 0) {
    blockers.push({ code: 'INVALID_SELECTION', message: 'Every selected output must belong to and be claimed for this application.' });
  }

  const pendingVerificationCount = selectedOutputs.filter(
    (output) => output.departmentVerificationStatus !== 'VERIFIED' || output.libraryVerificationStatus !== 'VERIFIED',
  ).length;
  if (pendingVerificationCount > 0) {
    warnings.push({
      code: 'OUTPUT_VERIFICATION_PENDING',
      message: `${pendingVerificationCount} selected output(s) still require both Department and Library verification.`,
    });
  }

  const selectedEquivalentUnits = selectedOutputs.reduce(
    (total, output) => total + equivalenceUnitsFor(output.type),
    0,
  );

  return {
    readyForSubmission: blockers.length === 0,
    blockers,
    warnings,
    metrics: {
      catalogCount: outputs.length,
      claimedOutputCount: claimedOutputs.length,
      claimedRefereedCount: refereedCount,
      selectedOutputCount: uniqueSelectedIds.length,
      selectedEquivalentUnits,
      pendingVerificationCount,
    },
  };
}

function normalizeDoi(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//, '');
  return normalized || null;
}

function scholarlyOutputSnapshot(output) {
  return {
    id: output.id,
    type: output.type,
    title: output.title,
    citation: output.citation,
    publicationDate: output.publicationDate instanceof Date
      ? output.publicationDate.toISOString()
      : output.publicationDate || null,
    doi: output.doi || null,
    url: output.url || null,
    issn: output.issn || null,
    isbn: output.isbn || null,
    journalOrPublisher: output.journalOrPublisher || null,
    authors: output.authors,
    applicantAuthorPosition: output.applicantAuthorPosition || null,
    contributionStatement: output.contributionStatement,
    isRefereed: output.isRefereed,
    isIndexed: output.isIndexed,
    equivalenceUnits: equivalenceUnitsFor(output.type),
    departmentVerificationStatus: output.departmentVerificationStatus,
    libraryVerificationStatus: output.libraryVerificationStatus,
  };
}

module.exports = {
  OUTPUT_EQUIVALENCE_UNITS,
  academicRequirementsFromRoute,
  equivalenceUnitsFor,
  evaluateAcademicDossier,
  normalizeDoi,
  scholarlyOutputSnapshot,
};
