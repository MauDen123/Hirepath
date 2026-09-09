import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function VacanciesPage() {
  const user = await getCurrentUser(undefined); // undefined triggers cookies() path
  if (!user) {
    // If no user, redirect to login (or return notFound? We'll redirect)
    // In server component we can't redirect directly; we can return a redirect via NextResponse?
    // Simpler: show a message to log in.
    return notFound(); // or we could redirect; but for simplicity, we'll show notFound.
  }
  // Only HR and admin can view vacancy management page
  if (user.role !== 'hr' && user.role !== 'admin') {
    return notFound();
  }

  const vacancies = await prisma.vacancy.findMany({
    include: {
      college: true,
      qsTemplate: true,
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Vacancy Management</h1>
        <Link
          href="/vacancies/create"
          className="btn btn-primary"
        >
          + Create Vacancy
        </Link>
      </div>

      {vacancies.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No vacancies yet. Create your first vacancy above.
        </p>
      ) : (
        <div className="space-y-4">
          {vacancies.map((vacancy) => (
            <div key={vacancy.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{vacancy.positionTitle}</h2>
                  <p className="text-sm text-gray-600 mb-1">
                    {vacancy.placeOfAssignment} • {vacancy.salaryGrade}
                  </p>
                  <p className="text-sm">
                    Status:{" "}
                    <span className={`badge ${getBadgeClass(vacancy.status)}`}>
                      {vacancy.status}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Created by:{' '}
                    {vacancy.createdBy?.name ?? 'Unknown'} ({new Date(
                      vacancy.createdAt
                    ).toLocaleDateString()})
                  </p>
                </div>
                <div className="space-x-2">
                  <Link
                    href={`/vacancies/${vacancy.id}`}
                    className="btn btn-ghost btn-sm"
                  >
                    View
                  </Link>
                  {user.role === 'hr' || user.role === 'admin' ? (
                    <Link
                      href={`/vacancies/${vacancy.id}/edit`}
                      className="btn btn-ghost btn-sm"
                    >
                      Edit
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getBadgeClass(status: string): string {
  switch (status) {
    case 'draft':
      return 'badge-neutral';
    case 'pending_hr_review':
      return 'badge-pending';
    case 'returned':
      return 'badge-flagged';
    case 'awaiting_vpaa_endorsement':
      return 'badge-pending';
    case 'awaiting_president_approval':
      return 'badge-pending';
    case 'awaiting_board_confirmation':
      return 'badge-pending';
    case 'published':
      return 'badge-approved';
    case 'closed':
      return 'badge-flagged';
    default:
      return 'badge-neutral';
  }
}