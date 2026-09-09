import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export default async function ReportsPage() {
  const currentUser = await getCurrentUser();
  
  // Check if user is authorized (HR or admin)
  if (!currentUser || !(currentUser.role === 'hr' || currentUser.role === 'admin')) {
    // Redirect to home if not authorized (middleware should handle this, but extra check)
    return null;
  }

  // For now, just show a placeholder - in a real app, this would show actual reports
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold">Available Reports</h2>
          <p className="text-muted">Report generation functionality coming soon.</p>
        </div>
      </div>
    </div>
  );
}
