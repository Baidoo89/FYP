import HodApplicationsWorkspace from '../../../components/hod/HodApplicationsWorkspace';

export default function HodRoutePage() {
  return (
    <HodApplicationsWorkspace
      initialSegment="active"
      eyebrow="HOD / Dean Queue"
      title="Review Workspace"
      description="Review scoped promotion applications, filter by status, record academic decisions, and monitor files after forwarding."
    />
  );
}