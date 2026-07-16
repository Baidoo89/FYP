import AuditLogViewer from '../../../components/audit/AuditLogViewer';

export default function HrAuditLogsPage() {
  return (
    <AuditLogViewer
      title="HR Audit Logs"
      eyebrow="HR Compliance Trail"
      description="Monitor HR verification, promotion workflow decisions, report exports, and sensitive administrative actions in one controlled audit workspace."
      backHref="/hr/dashboard"
      backLabel="Back to HR Dashboard"
    />
  );
}
