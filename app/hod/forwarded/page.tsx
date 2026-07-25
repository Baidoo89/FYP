import HodApplicationsWorkspace from '../../../components/hod/HodApplicationsWorkspace';

export default function HodRoutePage() {
  return (
    <HodApplicationsWorkspace
      initialSegment="forwarded"
      eyebrow="HOD / Dean Tracking"
      title="Forwarded Files"
      description="Track applications already forwarded to HR, committee review, and final administrative action."
    />
  );
}