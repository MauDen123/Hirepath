import * as React from 'react';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';
import ScoreForm from './ScoreForm';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const navItems: NavItem[] = [
  { index: '01', label: 'Applicants', href: '/hr' },
  { index: '02', label: 'Vacancies', href: '/vacancies' },
  { index: '03', label: 'CRRC Evaluations', href: '/crrc-evaluations' },
  { index: '04', label: 'Career Path Tool', href: '/career-path' },
  { index: '05', label: 'Reports', href: '/reports' },
];

export default async function CrrcEvaluationsPage() {
  // Get current user
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    notFound();
  }

  // Only HR and Deans can access CRRC evaluations
  if (currentUser.role !== 'hr' && currentUser.role !== 'dean') {
    notFound();
  }

  // Get applications that are ready for CRRC evaluation (faculty track only)
  const applications = await prisma.application.findMany({
    where: {
      status: 'crrc_scheduled',
      vacancy: {
        track: 'faculty'
      }
    },
    include: {
      applicant: true,
      vacancy: true
    },
    orderBy: {
      submittedAt: 'desc'
    }
  });

  return (
    <div className="app-shell">
      <Sidebar
        wordmarkSub="CRRC Evaluations"
        navItems={navItems}
        roleChip={currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
        userName={currentUser.name || ''}
        userSub={
          currentUser.role === 'hr'
            ? 'Human Resource Mgmt. Office'
            : currentUser.role === 'dean'
              ? currentUser.collegeId
                ? `College ${currentUser.collegeId}`
                : 'University-wide'
              : ''
        }
      />
      <main className="main">
        <TopLine
          title="CRRC Evaluations"
          subtitle="Faculty track evaluations for College Retention and Recruitment"
          action={
            <Link href="/" className="btn btn-ghost btn-sm">
              Sign out
            </Link>
          }
        />
        {applications.length === 0 ? (
          <div className="card">
            <div className="card-head">
              <h3>No CRRC Evaluations Pending</h3>
            </div>
            <p className="muted">
              No faculty applications are currently scheduled for CRRC evaluation.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Applications Awaiting CRRC Evaluation</h2>
                <p className="text-sm text-gray-500">
                  {applications.length} application{applications.length !== 1 ? 's' : ''} pending
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left rtl:text-right">
                  <thead className="text-xs font-semibold bg-gray-50">
                    <tr>
                      <th className="px-4 py-2">Applicant</th>
                      <th className="px-4 py-2">Position</th>
                      <th className="px-4 py-2">Submitted</th>
                      <th className="px-4 py-2">CRRC Score</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          {app.applicant.name}
                          <br />
                          <span className="text-xs text-gray-500">
                            {app.applicant.email}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {app.vacancy.positionTitle}
                          <br />
                          <span className="text-xs text-gray-500">
                            SG-{app.vacancy.salaryGrade}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {app.crrcScore !== null ? (
                            <>
                              <span className="font-bold">{app.crrcScore}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {app.crrcScore >= 70 ? 'Pass' : 'Below threshold'}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Not evaluated</span>
                          )}
                        </td>
                        <td className="px-4 py-3 space-x-2">
                          {/* Only show Evaluate button for Deans (HR can view but not edit) */}
                          {currentUser.role === 'dean' && (
                            <Link
                              href={`/crrc-evaluations/${app.id}`}
                              className="btn btn-outline btn-sm"
                            >
                              Evaluate
                            </Link>
                          )}
                          {/* Show score details for HR and Deans when score exists */}
                          {app.crrcScore !== null && (
                            <Link
                              href={`/crrc-evaluations/${app.id}`}
                              className="btn btn-outline btn-sm"
                            >
                              View
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}