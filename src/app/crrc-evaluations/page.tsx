"use client";

import * as React from 'react';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  index: string;
  label: string;
  href: string;
}

interface QSTemplate {
  id: string;
  positionTitle: string;
  salaryGrade: number;
  track: string;
  education: string;
  experience: string;
  training: string;
  eligibility: string;
  competencies: string | null;
}

interface Document {
  id: string;
  type: string;
  fileUrl: string;
  verificationStatus: string;
  parsedData: Record<string, any> | null;
  parsingConfidence: number | null;
}

interface ApplicationWithData {
  id: string;
  status: string;
  qsMatchScore: number | null;
  pscScore: number | null;
  pscOutcome: string | null;
  pscOutcomeNote: string | null;
  teachingDemoConducted: boolean;
  teachingDemoScore: number | null;
  crrcScore: number | null;
  mastersDeadline: Date | null;
  mastersCompleted: boolean | null;
  decisionNotes: string | null;
  submittedAt: Date;
  updatedAt: Date;
  applicant: {
    id: string;
    email: string;
    name: string;
  };
  vacancy: {
    id: string;
    positionTitle: string;
    plantillaItemNo: string | null;
    salaryGrade: number;
    placeOfAssignment: string;
    track: string;
    appointmentType: string;
    slots: number;
    qsTemplate: QSTemplate | null;
    college: {
      id: string;
      name: string;
    } | null;
  };
  documents: Document[];
}

async function getFacultyApplicationsNeedingCRRC() {
  const user = await getCurrentUser(undefined);

  // Only Deans can access CRRC evaluations (faculty track evaluations are done by the college/dean)
  if (!user || user.role !== 'dean') {
    return notFound();
  }

  // Get faculty track applications that are at a stage where CRRC evaluation would occur
  const applications = await prisma.application.findMany({
    where: {
      vacancy: {
        track: 'faculty'
      }
    },
    include: {
      applicant: {
        select: {
          id: true,
          email: true,
          name: true,
        }
      },
      vacancy: {
        include: {
          qsTemplate: {
            select: {
              id: true,
              positionTitle: true,
              salaryGrade: true,
              track: true,
              education: true,
              experience: true,
              training: true,
              eligibility: true,
              competencies: true,
            }
          },
          college: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      },
      documents: {
        select: {
          id: true,
          type: true,
          fileUrl: true,
          verificationStatus: true,
          parsedData: true,
          parsingConfidence: true,
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    }
  });

  return applications;
}

async function updateCRRCScore(applicationId: string, score: number | null) {
  const user = await getCurrentUser(undefined);

  // Only Deans can submit CRRC scores
  if (!user || user.role !== 'dean') {
    throw new Error('Unauthorized');
  }

  return prisma.application.update({
    where: { id: applicationId },
    data: {
      crrcScore: score,
    },
  });
}

const navItems: NavItem[] = [
  { index: '01', label: 'Applicants', href: '/hr' },
  { index: '02', label: 'Vacancies', href: '/vacancies' },
  { index: '03', label: 'CRRC Evaluations', href: '/crrc-evaluations' },
  { index: '04', label: 'Career Path Tool', href: '/career-path' },
  { index: '05', label: 'Reports', href: '/reports' },
];

export default async function CrrcEvaluationsPage() {
  const user = await getCurrentUser(undefined);
  if (!user) {
    return notFound();
  }

  // Only Deans can access CRRC evaluations
  if (user.role !== 'dean') {
    return notFound();
  }

  const [applications] = await Promise.all([
    getFacultyApplicationsNeedingCRRC(),
  ]);

  return (
    <div className="app-shell">
      <Sidebar
        wordmarkSub="HR Personnel"
        navItems={navItems}
        roleChip="Dean"
        userName={user.name}
        userSub={`${user.role.charAt(0).toUpperCase() + user.role.slice(1)} - ${user.collegeId ? 'College' : 'University-wide'}`}
      />
      <main className="main">
        <TopLine
          title="CRRC Evaluations"
          subtitle="Faculty track CRRC score entry and review"
        />
        {applications.length === 0 ? (
          <div className="card">
            <div className="card-head">
              <h3>CRRC Evaluations</h3>
            </div>
            <p className="muted">No faculty track applications available for CRRC evaluation.</p>
          </div>
        ) : (
          <div>
            {applications.map((app) => (
              <div key={app.id} className="card mb-6">
                <div className="card-head">
                  <h3>
                    CRRC Evaluation: {app.vacancy.positionTitle} - {app.applicant.name}
                  </h3>
                </div>
                <div className="card-body space-y-4">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Left side: Applicant Data */}
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h2 className="font-semibold mb-2">Applicant Information</h2>
                        <p className="text-sm">
                          <strong>Name: </strong> {app.applicant.name}
                        </p>
                        <p className="text-sm">
                          <strong>Email: </strong> {app.applicant.email}
                        </p>
                        <p className="text-sm">
                          <strong>Application Submitted: </strong> {new Date(app.submittedAt).toLocaleString()}
                        </p>
                        <p className="text-sm">
                          <strong>Current Status: </strong>
                          <span className={`badge ${getBadgeClass(app.status)}`}>
                            {app.status.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </p>
                        <p className="text-sm">
                          <strong>QS Match Score: </strong>
                          {app.qsMatchScore !== null ? `${app.qsMatchScore}%` : '—'}
                        </p>
                        <p className="text-sm">
                          <strong>PSC Score: </strong>
                          {app.pscScore !== null ? `${app.pscScore}` : '—'}
                        </p>
                      </div>

                      {/* Right side: Position/QSTemplate Data */}
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                          <h2 className="font-semibold mb-2">Position Information</h2>
                          <p className="text-sm">
                            <strong>Position: </strong> {app.vacancy.positionTitle}
                          </p>
                          <p className="text-sm">
                            <strong>Salary Grade: </strong> {app.vacancy.salaryGrade}
                          </p>
                          <p className="text-sm">
                            <strong>Place of Assignment: </strong> {app.vacancy.placeOfAssignment}
                          </p>
                          <p className="text-sm">
                            <strong>Track: </strong> {app.vacancy.track === 'faculty' ? 'Faculty' : 'Administrative'}
                          </p>
                          {app.vacancy.college && (
                            <p className="text-sm">
                              <strong>College: </strong> {app.vacancy.college.name}
                            </p>
                          )}

                          {app.vacancy.qsTemplate && (
                            <>
                              <h3 className="font-semibold mt-4 mb-2">Qualification Standard</h3>
                              <p className="text-sm">
                                <strong>Education: </strong> {app.vacancy.qsTemplate.education}
                              </p>
                              <p className="text-sm">
                                <strong>Experience: </strong> {app.vacancy.qsTemplate.experience}
                              </p>
                              <p className="text-sm">
                                <strong>Training: </strong> {app.vacancy.qsTemplate.training}
                              </p>
                              <p className="text-sm">
                                <strong>Eligibility: </strong> {app.vacancy.qsTemplate.eligibility}
                              </p>
                              {app.vacancy.qsTemplate.competencies && (
                                <p className="text-sm">
                                  <strong>Competencies: </strong> {app.vacancy.qsTemplate.competencies}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                    </div>

                    {/* CRRC Score Section */}
                    <div className="border rounded-lg p-4">
                      <h2 className="font-semibold mb-4">CRRC Evaluation Score</h2>
                      <form
                        onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const scoreStr = formData.get('crrcScore') as string;
                          const score = scoreStr ? parseFloat(scoreStr) : null;

                          if (!isNaN(score) && score >= 0 && score <= 100) {
                            try {
                              await updateCRRCScore(app.id, score);
                              // Refresh the data to show the updated score
                              window.location.reload();
                            } catch (error) {
                              alert('Failed to save CRRC score. Please try again.');
                              console.error('Error saving CRRC score:', error);
                            }
                          } else {
                            alert('Please enter a valid score between 0 and 100');
                          }
                        }}
                      >
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium mb-1">
                              Enter CRRC Score (0-100)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={app.crrcScore !== null ? app.crrcScore.toString() : ''}
                              className="input input-bordered w-full"
                              required
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            CRRC (College Retention and Recruitment) score is used for faculty track evaluations.
                          </p>
                          {app.crrcScore !== null && (
                            <div className="mt-4 p-3 bg-blue-50 rounded">
                              <p className="font-medium">Current CRRC Score:</p>
                              <p className="text-2xl font-bold">{app.crrcScore}</p>
                            </div>
                          )}
                          <div className="mt-4">
                            <button type="submit" className="btn btn-primary w-full">
                              Submit CRRC Score
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      </main>
    </div>
  );
}

function getBadgeClass(status: string): string {
  switch (status) {
    case 'submitted':
      return 'badge-neutral';
    case 'under_review':
      return 'badge-pending';
    case 'deficient':
      return 'badge-flagged';
    case 'qualified':
      return 'badge-approved';
    case 'psc_screened':
      return 'badge-pending';
    case 'shortlisted':
      return 'badge-approved';
    case 'psb_evaluated':
      return 'badge-pending';
    case 'crrc_scheduled':
      return 'badge-pending';
    case 'crrc_evaluated':
      return 'badge-approved';
    case 'appointed':
      return 'badge-approved';
    case 'not_selected':
      return 'badge-flagged';
    default:
      return 'badge-neutral';
  }
}