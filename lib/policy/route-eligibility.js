function toValidDate(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function completedYearsBetween(startValue, endValue = new Date()) {
  const start = toValidDate(startValue);
  const end = toValidDate(endValue);
  if (!start || !end || start > end) return 0;

  let years = end.getUTCFullYear() - start.getUTCFullYear();
  const anniversaryHasPassed =
    end.getUTCMonth() > start.getUTCMonth() ||
    (end.getUTCMonth() === start.getUTCMonth() && end.getUTCDate() >= start.getUTCDate());

  if (!anniversaryHasPassed) years -= 1;
  return Math.max(0, years);
}

function addUtcMonths(value, months) {
  const date = toValidDate(value);
  if (!date) return null;

  const result = new Date(date.getTime());
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const endOfTargetMonth = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(originalDay, endOfTargetMonth));
  return result;
}

function assessRouteAvailability(input) {
  const asOf = toValidDate(input.asOf || new Date());
  const rankStartedAt = toValidDate(input.rankStartedAt);
  const retirementDate = toValidDate(input.retirementDate);
  const minimumYears = Number.isFinite(input.minimumYearsInRank) ? Number(input.minimumYearsInRank) : null;
  const completedYears = rankStartedAt && asOf ? completedYearsBetween(rankStartedAt, asOf) : 0;
  const timeRequirementMet = minimumYears === null || completedYears >= minimumYears;
  const retirementCutoff = asOf ? addUtcMonths(asOf, 6) : null;
  const retirementRequirementMet = Boolean(retirementDate && retirementCutoff && retirementDate >= retirementCutoff);
  const staffRecordVerified = input.verificationState === 'VERIFIED';
  const employmentActive = input.employmentStatus === 'ACTIVE';
  const routeAvailable = input.routeStatus === 'ACTIVE' || input.routeStatus === 'PROVISIONAL';
  const warnings = [];

  if (!staffRecordVerified) warnings.push('HRODD staff verification is required.');
  if (!employmentActive) warnings.push('The authoritative employment record is not active.');
  if (!rankStartedAt) warnings.push('A verified rank start date is required.');
  if (!timeRequirementMet && minimumYears !== null) {
    warnings.push(`${minimumYears} completed year${minimumYears === 1 ? '' : 's'} in rank required; ${completedYears} recorded.`);
  }
  if (!retirementDate) warnings.push('An authoritative retirement date is required.');
  else if (!retirementRequirementMet) warnings.push('The application falls inside the six-month retirement cutoff.');
  if (!routeAvailable) warnings.push('This policy route is not active.');
  if (input.routeStatus === 'PROVISIONAL' || input.evidenceState === 'VERIFIED_CONFLICT') {
    warnings.push('A recorded policy conflict requires confirmation at the decision stage.');
  }

  return {
    completedYears,
    minimumYearsInRank: minimumYears,
    timeRequirementMet,
    retirementRequirementMet,
    canStart: Boolean(
      staffRecordVerified &&
      employmentActive &&
      rankStartedAt &&
      timeRequirementMet &&
      retirementRequirementMet &&
      routeAvailable
    ),
    warnings,
  };
}

module.exports = {
  completedYearsBetween,
  addUtcMonths,
  assessRouteAvailability,
};
