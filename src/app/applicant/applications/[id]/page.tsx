// Trivial comment to bust cache
import * as React from 'react';
import Link from 'next/link';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import ApplicationDocumentUploadForm from './ApplicationDocumentUploadForm';
import WithdrawButton from './WithdrawButton';

const navItems: NavItem[] = [
  { index: '01', label: 'Profile', href: '/applicant' },
  { index: '02', label: 'Applications', href: '/applicant/applications' },
  { index: '03', label: 'Documents', href: '/applicant/documents' },
  { index: '04', label: 'Career Path', href: '/career-path' },
];

export default async function ApplicantApplicationPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  if (!id) {
    notFound();
  }

  // Get the logged-in applicant
  const applicant = await getCurrentUser();
  if (!applicant) {
    notFound();
  }

  // Get the specific application for the logged-in applicant
  const application = await prisma.application.findUnique({
    where: { id },
    include: { vacancy: true, documents: true },
  });

  // Ensure the application belongs to the logged-in applicant
  if (!application || application.applicantId !== applicant.id) {
    notFound();
  }

  return (
    <div className="app-shell">
      <Sidebar
        wordmarkSub="Applicant"
        navItems={navItems}
        roleChip="Applicant"
        userName={applicant.name}
        userSub={applicant.email}
      />
      <main className="main">
        <TopLine
          title="Application Details"
          subtitle={`Application for ${application.vacancy?.positionTitle || 'Unknown Position'}`}
        />
        <div className="card">
          <div className="card-head">
            <h3>Application Details</h3>
          </div>
          <div className="grid grid-2col">
            <div>
              <p>
                <strong>Vacancy: </strong>
                {application.vacancy?.positionTitle || 'N/A'}
              </p>
              <p>
                <strong>Submitted: </strong>
                {new Date(application.submittedAt).toLocaleDateString()}
              </p>
              <p>
                <strong>Status: </strong>
                <span
                  className={`
                    badge ${application.status === 'qualified' ? 'approved' : application.status === 'deficient' ? 'flagged' : 'pending'}
                  `}
                >
                  {application.status}
                </span>
              </p>
              <p>
                <strong>QS Match: </strong>
                {application.qsMatchScore !== null ? `${application.qsMatchScore}%` : 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <div className="seal" style={{ width: 60, height: 60 }} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Documents</h3>
          </div>
          {/* Upload Form for this specific application */}
          <ApplicationDocumentUploadForm applicationId={application.id} />
          {application.documents.length === 0 ? (
            <p className="muted">No documents uploaded for this application.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {application.documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.type}</td>
                    <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`
                          badge ${doc.verificationStatus === 'verified' ? 'approved' : doc.verificationStatus === 'flagged' ? 'flagged' : 'pending'}
                        `}
                      >
                        {doc.verificationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Actions</h3>
          </div>
          <div className="card-body">
            <WithdrawButton applicationId={id} status={application.status} pscOutcome={application.pscOutcome} />
          </div>
        </div>
      </main>
    </div>
  );
}