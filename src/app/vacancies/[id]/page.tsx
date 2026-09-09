import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function VacancyDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser(undefined);
  if (!user) {
    return notFound();
  }
  // For viewing, we could allow any authenticated user, or restrict to HR/admin.
  // We'll allow any authenticated user to view vacancy details.
  // If you want to restrict to HR/admin, uncomment the next line.
  // if (user.role !== 'hr' && user.role !== 'admin') return notFound();

  const vacancy = await prisma.vacancy.findUnique({
    where: { id: params.id },
    include: {
      college: true,
      qsTemplate: true, // Note: it's qsTemplate, not qSTemplate
      createdBy: { select: { id: true, name: true, email: true } },
      hrReviewedBy: { select: { id: true, name: true } },
      vpaaEndorsedBy: { select: { id: true, name: true } },
      applications: {
        include: {
          applicant: { select: { id: true, name: true, email: true } },
        },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });

  if (!vacancy) {
    return notFound();
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{vacancy.positionTitle}</h1>
        <div className="flex space-x-3">
          <Link
            href="/vacancies"
            className="btn btn-ghost"
          >
            ← Back to List
          </Link>
          {/* Only show edit button for HR/admin */}
          {(user.role === 'hr' || user.role === 'admin') && (
            <Link
              href={`/vacancies/${vacancy.id}/edit`}
              className="btn btn-primary"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Basic Information</h2>
            <p className="text-sm">
              <strong>Plantilla Item No.:</strong>{' '}
              {vacancy.plantillaItemNo ?? '—'}
            </p>
            <p className="text-sm">
              <strong>Salary Grade:</strong> {' '}
              {vacancy.salaryGrade ?? '—'}
            </p>
            <p className="text-sm">
              <strong>Monthly Salary:</strong> {' '}
              {vacancy.monthlySalary ? `$${vacancy.monthlySalary}` : '—'}
            </p>
            <p className="text-sm">
              <strong>Place of Assignment:</strong> {' '}
              {vacancy.placeOfAssignment}
            </p>
            <p className="text-sm">
              <strong>Track:</strong> {' '}
              {vacancy.track === 'faculty' ? 'Faculty' : 'Administrative'}
            </p>
            <p className="text-sm">
              <strong>Appointment Type:</strong> {' '}
              {vacancy.appointmentType === 'permanent'
                ? 'Permanent'
                : vacancy.appointmentType === 'temporary'
                  ? 'Temporary'
                  : 'Contract of Service'}
            </p>
            <p className="text-sm">
              <strong>Number of Slots:</strong> {' '}
              {vacancy.slots}
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Qualification Standard</h2>
            {vacancy.qsTemplate ? ( // Fixed: use qsTemplate, not qSTemplate
              <>
                <p className="text-sm">
                  <strong>Position Title:</strong> {vacancy.qsTemplate.positionTitle}
                </p>
                <p className="text-sm">
                  <strong>Salary Grade:</strong> {vacancy.qsTemplate.salaryGrade}
                </p>
                <p className="text-sm">
                  <strong>Education:</strong> {vacancy.qsTemplate.education}
                </p>
                <p className="text-sm">
                  <strong>Experience:</strong> {vacancy.qsTemplate.experience}
                </p>
                <p className="text-sm">
                  <strong>Training:</strong> {vacancy.qsTemplate.training}
                </p>
                <p className="text-sm">
                  <strong>Eligibility:</strong> {vacancy.qsTemplate.eligibility}
                </p>
                {vacancy.qsTemplate.competencies && (
                  <p className="text-sm">
                    <strong>Competencies:</strong> {vacancy.qsTemplate.competencies}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">No qualification standard assigned.</p>
            )}
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">College</h2>
            {vacancy.college ? (
              <p className="text-sm">
                {vacancy.college.name}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Not assigned to a college (university-wide)</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Status & Dates</h2>
            <p className="text-sm">
              <strong>Current Status:</strong> {' '}
              <span className={`badge ${getBadgeClass(vacancy.status)}`}>
                {vacancy.status}
              </span>
            </p>
            <p className="text-sm">
              <strong>Created At:</strong> {' '}
              {new Date(vacancy.createdAt).toLocaleString()}
            </p>
            <p className="text-sm">
              <strong>Created By:</strong> {' '}
              {vacancy.createdBy ? `${vacancy.createdBy.name} (${vacancy.createdBy.email})` : '—'}
            </p>
            {vacancy.hrReviewedAt && (
              <p className="text-sm">
                <strong>HR Reviewed At:</strong> {' '}
                {new Date(vacancy.hrReviewedAt).toLocaleString()}
              </p>
            )}
            {vacancy.hrReviewedById && (
              <p className="text-sm">
                <strong>HR Reviewed By:</strong> {' '}
                {vacancy.hrReviewedBy?.name ?? '—'}
              </p>
            )}
            {vacancy.hrReviewNotes && (
              <p className="text-sm">
                <strong>HR Review Notes:</strong> {' '}
                {vacancy.hrReviewNotes}
              </p>
            )}
            {vacancy.vpaaEndorsedAt && (
              <p className="text-sm">
                <strong>VPAA Endorsed At:</strong> {' '}
                {new Date(vacancy.vpaaEndorsedAt).toLocaleString()}
              </p>
            )}
            {vacancy.vpaaEndorsedById && (
              <p className="text-sm">
                <strong>VPAA Endorsed By:</strong> {' '}
                {vacancy.vpaaEndorsedBy?.name ?? '—'}
              </p>
            )}
            {vacancy.presidentApprovedAt && (
              <p className="text-sm">
                <strong>President Approved At:</strong> {' '}
                {new Date(vacancy.presidentApprovedAt).toLocaleString()}
              </p>
            )}
            {vacancy.boardConfirmedAt && (
              <p className="text-sm">
                <strong>Board Confirmed At:</strong> {' '}
                {new Date(vacancy.boardConfirmedAt).toLocaleString()}
              </p>
            )}
            {vacancy.approvalDocumentRef && (
              <p className="text-sm">
                <strong>Approval Document Ref:</strong> {' '}
                {vacancy.approvalDocumentRef}
              </p>
            )}
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Publication & Validity</h2>
            <p className="text-sm">
              <strong>Publication Channels:</strong> {' '}
              {vacancy.publicationChannels.length > 0 ? (
                vacancy.publicationChannels
                  .map((ch) =>
                    ch === 'website'
                      ? 'Website'
                      : ch === 'csc'
                        ? 'CSC Bulletin'
                        : ch === 'bulletin'
                          ? 'Physical Bulletin Board'
                          : ch
                  )
                  .join(', ')
              ) : (
                'None'
              )}
            </p>
            <p className="text-sm">
              <strong>Posting Date:</strong> {' '}
              {vacancy.postingDate
                ? new Date(vacancy.postingDate).toLocaleDateString()
                : '—'}
            </p>
            <p className="text-sm">
              <strong>Closing Date:</strong> {' '}
              {vacancy.closingDate
                ? new Date(vacancy.closingDate).toLocaleDateString()
                : '—'}
            </p>
            <p className="text-sm">
              <strong>Validity Months:</strong> {' '}
              {vacancy.validityMonths ?? '—'}
            </p>
          </div>
        </div>
      </div>

      {vacancy.applications.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Applications ({vacancy.applications.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    QS Match
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CRRC Score
                  </th>
                  <th className="px-6 py-3 text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vacancy.applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 flex items-center justify-center bg-gray-200 rounded-full text-sm font-medium">
                          {app.applicant.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="text-sm font-medium">
                          {app.applicant.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(app.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getBadgeClass(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {app.qsMatchScore != null ? `${app.qsMatchScore}%` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {app.crrcScore != null ? `${app.crrcScore}` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/hr/review/${app.id}`}
                        className="text-primary underline hover:no-underline"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="mt-8 text-center text-gray-500">
          No applications yet for this vacancy.
        </p>
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