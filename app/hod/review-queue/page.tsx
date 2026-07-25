import HodApplicationsWorkspace from '../../../components/hod/HodApplicationsWorkspace';

export default function HodRoutePage() {
  return (
    <HodApplicationsWorkspace
      initialSegment="active"
      eyebrow="HOD / Dean Queue"
      title="Review Queue"
      description="Work through submitted and department-review promotion files that require academic action."
    />
  );
}