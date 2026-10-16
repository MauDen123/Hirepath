import * as React from 'react';
import Link from 'next/link';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { QualificationFlag } from '@/lib/qualification-flags';

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

// Function to get badge class based on qualification flag
function getQualificationFlagBadgeClass(flag: QualificationFlag | undefined): string {
  if (!flag) return 'badge-neutral';
  switch (flag) {
    case 'pending':
      return 'badge-neutral';
    case 'green':
      return 'badge-approved';
    case 'yellow':
      return 'badge-pending';
    case 'red':
      return 'badge-flagged';
    default:
      return 'badge-neutral';
  }
}

// Function to get label based on qualification flag
function getQualificationFlagLabel(flag: QualificationFlag | undefined): string {
  if (!flag) return 'Unknown';
  switch (flag) {
    case 'pending':
      return 'Pending';
    case 'green':
      return 'Green Flag';
    case 'yellow':
      return 'Yellow Flag';
    case 'red':
      return 'Red Flag';
    default:
      return 'Unknown';
  }
}

// Action to update application status
export const updateApplicationStatus = async (formData: FormData) => {
  'use server';

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
    const notes = (formData.get('notes') as string) || null;

    if (!applicationId) {
      throw new Error('Application ID is required');
    }
    if (!newStatus) {
      throw new Error('Status is required');
    }
    const allowedStatuses = ["submitted", "under_review", "deficient", "qualified", "psc_screened", "shortlisted", "psb_evaluated", "crrc_scheduled", "crrc_evaluated", "appointed", "not_selected"];
    if (!allowedStatuses.includes(newStatus)) {
      throw new Error("Invalid status");
    }

    // Get the current application to retrieve the previous status for audit logging
    const currentApplication = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        status: true,
        qualificationFlag: true,
        qualificationDetails: true,
      },
    });

    if (!currentApplication) {
      throw new Error('Application not found');
    }

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        notes: notes,
      },
    });

    // Update audit log if status changed and flag is not GREEN
    if (currentApplication.qualificationFlag !== QualificationFlag.green) {
      await prisma.auditLog.create({
        data: {
          applicationId: application.id,
          action: 'STATUS_CHANGE',
          details: JSON.stringify({
            previousStatus: currentApplication.status, // Correctly using the status before update
            newStatus: newStatus,
            qualificationFlag: currentApplication.qualificationFlag,
            qualificationDetails: currentApplication.qualificationDetails,
            changedAt: new Date().toISOString(),
            changedBy: user.id
          })
        }
      })
    }

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
      select: {
        id: true,
        status: true,
        qsMatchScore: true,
        crrcScore: true,
        qualificationFlag: true,
        qualificationDetails: true,
        submittedAt: true,
        applicant: { select: { id: true, name: true, email: true } },
        vacancy: { select: { id: true, positionTitle: true, status: true } },
        documents: {
          select: {
            id: true,
            type: true,
            fileUrl: true,
            uploadedAt: true,
            verificationStatus: true,
            parsingConfidence: true,
          },
        },
      },
    }),
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
  const vacancyPositionTitle =
    application.vacancy?.positionTitle || 'Unknown Position';
  const applicantName = application.applicant.name;
  const applicantEmail = application.applicant.email;
  const submittedAtFormatted = new Date(
    application.submittedAt
  ).toLocaleDateString();
  const qsMatchScoreFormatted =
    application.qsMatchScore !== null ? `${application.qsMatchScore}%` : 'N/A';
  const crrcScoreFormatted =
    application.crrcScore !== null ? `${application.crrcScore}` : 'N/A';

  // Use helper functions for qualification flag
  const qualificationFlagBadgeClass = getQualificationFlagBadgeClass(application.qualificationFlag);
  const qualificationFlagLabel = getQualificationFlagLabel(application.qualificationFlag);

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
                  <span className="avatar-dot">
                    {initialsFrom(applicantName)}
                  </span>
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
                <strong>Qualification Flag: </strong>
                <span className={qualificationFlagBadgeClass}>
                  {qualificationFlagLabel}
                </span>
              </p>
              <p>
                <strong>CRRC Score: </strong>
                {crrcScoreFormatted}
              </p>

              {/* Qualification Details */}
              {application.qualificationDetails && (
                <>
                  <p className="font-medium mb-2">Qualification Breakdown:</p>
                  <div className="space-y-2">
                    <div className="border rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Education</span>
                        <span
                          className={getQualificationFlagBadgeClass(application.qualificationDetails.dimensions.education.flag)}
                        >
                          {getQualificationFlagLabel(
                            application.qualificationDetails.dimensions
                              .education.flag
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        <strong>Required:</strong>{' '}
                        {
                          application.qualificationDetails.dimensions.education
                            .required
                        }
                      </p>
                      <p className="text-sm text-gray-500 mb-1">
                        <strong>Found:</strong>{' '}
                        {
                          application.qualificationDetails.dimensions.education
                            .found
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>Reason:</strong>{' '}
                        {
                          application.qualificationDetails.dimensions.education
                            .reason
                        }
                      </p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Experience</span>
                        <span
                          className={getQualificationFlagBadgeClass(application.qualificationDetails.dimensions.experience.flag)}
                        >
                          {getQualificationFlagLabel(
                            application.qualificationDetails.dimensions
                              .experience.flag
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        <strong>Required:</strong>{' '}
                        {
                          application.qualificationDetails.dimensions.experience
                            .required
                        }
                      </p>
                      <p className="text-sm text-gray-500 mb-1">
                        <strong>Found:</strong>{' '}
                        {
                          application.qualificationDetails.dimensions.experience
                            .found
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>Reason:</strong>{' '}
                        {
                          application.qualificationDetails.dimensions.experience
                            .reason
                        }
                      </p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Training</span>
                        <span
                          className={getQualificationFlagBadgeClass(application.qualificationDetails.dimensions.training.flag)}
                        >
                          {getQualificationFlagLabel(
                            application.qualificationDetails.dimensions.training
                              .flag
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        <strong>Required:</strong>{' '}
                        {
                          application.qualificationDetails.dimensions.training
                            .required
                        }
                      </p>
                      <p className="text-sm text-gray-500 mb-1">
                        <strong>Found:</strong>{' '}
                        {
                          application.qualificationDetails.dimensions.training
                            .found
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>Reason:</strong>{' '}
                        {
                          application.qualificationDetails.dimensions.training
                            .reason
                        }
                      </p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Eligibility</span>
                        <span
                          className={getQualificationFlagBadgeClass(application.qualificationDetails.dimensions.eligibility.flag)}
                        >
                          {getQualificationFlagLabel(
                            application.qualificationDetails.dimensions
                              .eligibility.flag
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        <strong>Required:</strong>{' '}
                        {
                          application.qualificationDetails.dimensions
                            .eligibility.required
                        }
                      </p>
                      <p className="text-sm text-gray-500 mb-1">
                        <strong>Found:</strong>{' '}
                        {
                          application.qualificationDetails.dimensions
                            .eligibility.found
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>Reason:</strong>{' '}
                        {
                          application.qualificationDetails.dimensions
                            .eligibility.reason
                        }
                      </p>
                    </div>
                  </div>

                  {application.qualificationDetails.suggestedAction && (
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="font-medium mb-1">Suggested Action:</p>
                      <p className="text-sm">
                        {application.qualificationDetails.suggestedAction}
                      </p>
                    </div>
                  )}
                </>
              )}
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
              <p className="muted">
                No documents uploaded for this application.
              )
            ) : (
              <div className="space-y-3">
                {application.documents.map((doc) => {
                  // Pre-compute values for each document
                  const uploadedAtFormatted = new Date(
                    doc.uploadedAt
                  ).toLocaleDateString();

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
                          {doc.parsingConfidence !== null && (
                            <p className="text-sm text-gray-500">
                              Parsing Confidence:{' '}
                              {(doc.parsingConfidence * 100).toFixed(0)}%
                            )}
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
                          sandbox="allow-same-origin"
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
            <form
              action={updateApplicationStatus}
              className="space-y-4"
              method="POST"
            >
              <input
                type="hidden"
                name="applicationId"
                value={application.id}
              />
              <div>
                <label className="block text-sm font-medium mb-1">
                  New Status
                </label>
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
                <label className="block text-sm font-medium mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  className="textarea textarea-bordered w-full"
                  rows="4"
                  placeholder="Add any notes about this status change..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" className="btn btn-outline">
                  <Link href="/hr">Back to Applications</Link>
                </button>
                <button type="submit" className="btn btn-primary">
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