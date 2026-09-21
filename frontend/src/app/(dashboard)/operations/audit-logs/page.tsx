import type { Metadata } from 'next'
import AuditLogsClient from './AuditLogsClient'
export const metadata: Metadata = { title: 'Audit Logs | Operations', description: 'Audit logs viewer' }
export default function AuditLogsPage() { return <AuditLogsClient /> }
