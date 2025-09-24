import { AdminGuard } from '@/components/admin/admin-guard'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  )
}

export const metadata = {
  title: 'Admin Dashboard - Madhubani Nikah',
  description: 'Admin dashboard for managing Madhubani Nikah platform',
}