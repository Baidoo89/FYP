import HodApplicationsWorkspace from '../../../components/hod/HodApplicationsWorkspace';

export default function HodRoutePage() {
  return (
    <HodApplicationsWorkspace
      initialSegment="returned"
      eyebrow="HOD / Dean Corrections"
      title="Returned Files"
      description="Monitor files returned to lecturers for correction and resubmission."
    />
  );
}