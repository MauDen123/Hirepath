import * as React from 'react';
import Link from 'next/link';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';

const navItems: NavItem[] = [
  { index: '01', label: 'Applicants', href: '/hr' },
  { index: '02', label: 'Vacancies', href: '/vacancies' },
  { index: '03', label: 'CRRC Evaluations', href: '/crrc-evaluations' },
  { index: '04', label: 'Career Path Tool', href: '/career-path' },
  { index: '05', label: 'Reports', href: '/reports' },
];

// Status metadata for badges (same as in HR page)
const statusMeta: Record<string, { label: string; badge: string }> = {
  submitted: { label: 'Submitted', badge: 'neutral' },
  under_review: { label: 'Under review', badge: 'pending' },
  deficient: { label: 'Deficient', badge: 'flagged' },
  qualified: { label: 'Qualified', badge: 'approved' },
  psc_screened: { label: 'PSC screened', badge: 'pending' },
  shortlisted: { label: 'Shortlisted', badge: 'approved' },
  psb_evaluated: { label: 'PSB evaluated', badge: 'approved' },
  crrc_scheduled: { label: 'CRRC scheduled', badge: 'pending' },
  crrc_evaluated: { label: 'CRRC evaluated', badge: 'approved' },
  appointed: { label: 'Appointed', badge: 'approved' },
  not_selected: { label: 'Not selected', badge: 'flagged' },
};

// Function to get initials from name (same as in HR page)
function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// Function to get badge class based on status (same as in vacancy detail page)
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

// Action to update application status
export const updateApplicationStatus = async (formData: FormData) => {
  "use server";

  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Check if user is HR or admin
    if (user.role !== 'hr' && user.role !== 'admin') {
      throw new Error('Forbidden: insufficient role');
    }

    const applicationId = formData.get('applicationId') as string;
    const newStatus = formData.get('status') as string;
    const notes = formData.get('notes') as string || null;

    if (!applicationId) {
      throw new Error('Application ID is required');
    }
    if (!newStatus) {
      throw new Error('Status is required');
    }

    // Update the application
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        // We could add notes to a separate field if needed in the future
        // For now, we're just updating the status
      },
    });

    // In a real implementation, we might want to:
    // 1. Create an audit log entry
    // 2. Send a notification email to the applicant
    // 3. Trigger any workflows based on the status change

    return { success: true };
  } catch (error) {
    console.error('Error updating application status:', error);
    throw new Error('Failed to update application status');
  }
};

export default async function HrReviewPage({
  params,
}: {
  params: { id: string };
}) {
  // Safely extract id from params
  const id = params?.id;

  // Validate id is a non-empty string (handles undefined, null, empty string, whitespace-only)
  if (typeof id !== 'string' || !id || !id.trim()) {
    notFound();
  }

  // Start both requests in parallel for better performance
  const [user, application] = await Promise.all([
    getCurrentUser(),
    prisma.application.findUnique({
      where: { id },
      include: {
        applicant: { select: { id: true, name: true, email: true } },
        vacancy: { select: { id: true, positionTitle: true, status: true } },
        documents: true,
      },
    })
  ]);

  // Handle authentication and authorization
  if (!user) {
    notFound();
  }

  if (user.role !== 'hr' && user.role !== 'admin') {
    notFound();
  }

  // Handle application not found
  if (!application) {
    notFound();
  }

  // Pre-compute values for better React performance
  const vacancyPositionTitle = application.vacancy?.positionTitle || 'Unknown Position';
  const applicantName = application.applicant.name;
  const applicantEmail = application.applicant.email;
  const submittedAtFormatted = new Date(application.submittedAt).toLocaleDateString();
  const qsMatchScoreFormatted = application.qsMatchScore !== null ? `${application.qsMatchScore}%` : 'N/A';
  const crrcScoreFormatted = application.crrcScore !== null ? `${application.crrcScore}` : 'N/A';

  // Compute badge class for application status
  let applicationStatusBadgeClass = 'badge-neutral';
  if (application.status === 'qualified') {
    applicationStatusBadgeClass = 'badge-approved';
  } else if (application.status === 'deficient') {
    applicationStatusBadgeClass = 'badge-flagged';
  } else {
    applicationStatusBadgeClass = 'badge-pending';
  }

  return (
    <div className="app-shell">
      <Sidebar
        wordmarkSub="HR Personnel"
        navItems={navItems}
        roleChip="HR Personnel"
        userName={user.name || 'HR Personnel'}
        userSub={user.email}
      />
      <main className="main">
        <TopLine
          title="Application Review"
          subtitle={`Reviewing application for ${vacancyPositionTitle}`}
        />

        {/* Application Details */}
        <div className="card">
          <div className="card-head">
            <h3>Application Details</h3>
          </div>
          <div className="grid grid-2col gap-6">
            <div>
              <p>
                <strong>Applicant: </strong>
                <span className="flex items-center space-x-2">
                  <span className="avatar-dot">{initialsFrom(applicantName)}</span>
                  <span className="cell-primary">{applicantName}</span>
                </span>
              </p>
              <p>
                <strong>Email: </strong>
                {applicantEmail}
              </p>
              <p>
                <strong>Vacancy: </strong>
                {application.vacancy?.positionTitle || 'N/A'}
              </p>
              <p>
                <strong>Submitted: </strong>
                {submittedAtFormatted}
              </p>
              <p>
                <strong>Status: </strong>
                <span className={applicationStatusBadgeClass}>
                  {application.status}
                </span>
              </p>
              <p>
                <strong>QS Match: </strong>
                {qsMatchScoreFormatted}
              </p>
              <p>
                <strong>CRRC Score: </strong>
                {crrcScoreFormatted}
              </p>
            </div>
            <div className="text-right">
              <div className="seal" style={{ width: 60, height: 60 }} />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="card mt-4">
          <div className="card-head">
            <h3>Documents Submitted</h3>
          </div>
          <div className="card-body">
            {application.documents.length === 0 ? (
              <p className="muted">No documents uploaded for this application.</p>
            ) : (
              <div className="space-y-3">
                {application.documents.map((doc) => {
                  // Pre-compute values for each document
                  const uploadedAtFormatted = new Date(doc.uploadedAt).toLocaleDateString();

                  // Compute badge class for verification status
                  let verificationStatusBadgeClass = 'badge-neutral';
                  if (doc.verificationStatus === 'verified') {
                    verificationStatusBadgeClass = 'badge-approved';
                  } else if (doc.verificationStatus === 'flagged') {
                    verificationStatusBadgeClass = 'badge-flagged';
                  } else {
                    verificationStatusBadgeClass = 'badge-pending';
                  }

                  return (
                    <div key={doc.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{doc.type}</p>
                          <p className="text-sm text-gray-500">
                            Uploaded: {uploadedAtFormatted}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={verificationStatusBadgeClass}>
                            {doc.verificationStatus}
                          </span>
                        </div>
                      </div>
                      {/* Document preview iframe */}
                      <div className="mt-3">
                        <iframe
                          src={doc.fileUrl}
                          title={`Preview of ${doc.type}`}
                          className="w-full h-96 border rounded"
                          loading="lazy"
                          sandbox="allow-same-origin allow-scripts"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Status Update Form */}
        <div className="card mt-4">
          <div className="card-head">
            <h3>Update Application Status</h3>
          </div>
          <div className="card-body">
            <form action={updateApplicationStatus} className="space-y-4" method="POST">
              <input type="hidden" name="applicationId" value={application.id} />
              <div>
                <label className="block text-sm font-medium mb-1">New Status</label>
                <select
                  name="status"
                  className="select select-bordered w-full"
                  defaultValue={application.status}
                  required
                >
                  {/* Map of status options */}
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under review</option>
                  <option value="deficient">Deficient</option>
                  <option value="qualified">Qualified</option>
                  <option value="psc_screened">PSC screened</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="psb_evaluated">PSB evaluated</option>
                  <option value="crrc_scheduled">CRRC scheduled</option>
                  <option value="crrc_evaluated">CRRC evaluated</option>
                  <option value="appointed">Appointed</option>
                  <option value="not_selected">Not selected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  name="notes"
                  className="textarea textarea-bordered w-full"
                  rows="4"
                  placeholder="Add any notes about this status change..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-outline"
                >
                  <Link href="/hr">Back to Applications</Link>
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}