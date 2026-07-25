import HodApplicationsWorkspace from '../../../components/hod/HodApplicationsWorkspace';

export default function HodRoutePage() {
  return (
    <HodApplicationsWorkspace
      initialSegment="all"
      eyebrow="HOD / Dean Records"
      title="Department Records"
      description="View all promotion files within your assigned department or faculty scope."
    />
  );
}