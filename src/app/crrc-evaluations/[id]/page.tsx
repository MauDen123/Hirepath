import * as React from 'react';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';
import ScoreForm from '../ScoreForm';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { saveCrrcEvaluation } from './actions';

const navItems: NavItem[] = [
  { index: '01', label: 'Applicants', href: '/hr' },
  { index: '02', label: 'Vacancies', href: '/vacancies' },
  { index: '03', label: 'CRRC Evaluations', href: '/crrc-evaluations' },
  { index: '04', label: 'Career Path Tool', href: '/career-path' },
  { index: '05', label: 'Reports', href: '/reports' },
];

export default async function CrrcEvaluationPage({
  params,
}: {
  params: { id: string };
}) {
  // Get current user
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    notFound();
  }

  // Only HR and Deans can access CRRC evaluations
  if (currentUser.role !== 'hr' && currentUser.role !== 'dean') {
    notFound();
  }

  // Get the application with related data
  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      applicant: true,
      vacancy: true
    }
  });

  // If application not found or not in correct status, redirect back
  if (!application || application.status !== 'crrc_scheduled' || application.vacancy.track !== 'faculty') {
    return redirect('/crrc-evaluations');
  }

  // Get existing CRRC evaluation if any
  const existingEvaluation = await prisma.crrcEvaluation.findUnique({
    where: { applicationId: params.id }
  });

  // Handle form submission for CRRC evaluation (Dean only)
  const handleEvaluationUpdate = async (data: any) => {
    if (currentUser.role !== 'dean') {
      return;
    }

    try {
      await saveCrrcEvaluation(params.id, data);
      // Refresh the application data to get updated crrcScore
      await prisma.application.findUnique({
        where: { id: params.id },
        select: { crrcScore: true }
      });
    } catch (err) {
      console.error('Error saving CRRC evaluation:', err);
      throw err;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        wordmarkSub="CRRC Evaluation Details"
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
          title="CRRC Evaluation"
          subtitle={`Evaluation for ${application.vacancy.positionTitle}`}
          action={
            <Link href="/crrc-evaluations" className="btn btn-ghost btn-sm">
              Back to List
            </Link>
          }
        />
        <div className="space-y-6">
          {/* Application Info Card */}
          <div className="card">
            <div className="card-head">
              <h3>Application Details</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Applicant</p>
                  <p className="text-lg font-bold">{application.applicant.name}</p>
                  <p className="text-xs text-gray-500">{application.applicant.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Position</p>
                  <p className="text-lg font-medium">{application.vacancy.positionTitle}</p>
                  <p className="text-xs text-gray-500">SG-${application.vacancy.salaryGrade}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Submitted</p>
                  <p className="text-lg font-medium">{new Date(application.submittedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Vacancy Status</p>
                  <p className={`text-lg font-medium ${application.vacancy.status === 'published' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {application.vacancy.status}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CRRC Evaluation Card */}
          <div className="card">
            <div className="card-head">
              <h3>CRRC Evaluation Form</h3>
            </div>
            <div className="space-y-4">
              {/* Current Score Display (for backward compatibility) */}
              {application.crrcScore !== null ? (
                <>
                  <div className="text-center mb-4">
                    <p className="text-sm font-medium text-gray-500">Current CRRC Score (Backward Compatibility)</p>
                    <p className="text-2xl font-bold text-blue-600">{application.crrcScore}</p>
                    <p className="text-sm text-gray-500">
                      {application.crrcScore >= 70 ? 'Meets minimum threshold (70)' : 'Below minimum threshold (70)'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm font-medium text-gray-500">No CRRC score recorded</p>
                  <p className="text-xs text-gray-400 italic">Awaiting evaluation by Dean</p>
                </div>
              )}

              {/* Score Form (only for Deans) */}
              {currentUser.role === 'dean' ? (
                <ScoreForm
                  applicationId={application.id}
                  initialData={
                    existingEvaluation ? {
                      // KRA I - Instruction
                      kra1TeachingEffectiveness: existingEvaluation.kra1TeachingEffectiveness,
                      kra1CurriculumMaterials: existingEvaluation.kra1CurriculumMaterials,
                      kra1SpecialProjects: existingEvaluation.kra1SpecialProjects,

                      // KRA II - Research, Innovation, and/or Creative Work
                      kra2ResearchOutputs: existingEvaluation.kra2ResearchOutputs,
                      kra2Inventions: existingEvaluation.kra2Inventions,
                      kra2CreativeWorks: existingEvaluation.kra2CreativeWorks,

                      // KRA III - Extension Services
                      kra3ServiceToInstitution: existingEvaluation.kra3ServiceToInstitution,
                      kra3ServiceToCommunity: existingEvaluation.kra3ServiceToCommunity,
                      kra3QualityOfService: existingEvaluation.kra3QualityOfService,
                      kra3Bonus: existingEvaluation.kra3Bonus,

                      // KRA IV - Professional Development
                      kra4ProfessionalOrgs: existingEvaluation.kra4ProfessionalOrgs,
                      kra4ContinuingDevelopment: existingEvaluation.kra4ContinuingDevelopment,
                      kra4AwardsRecognition: existingEvaluation.kra4AwardsRecognition,
                      kra4NewHireBonus: existingEvaluation.kra4NewHireBonus
                    } : null
                  }
                  onUpdate={handleEvaluationUpdate}
                />
              ) : (
                // For HR, show read-only view with explanation
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm font-medium text-blue-800">
                    CRRC scoring is restricted to Deans for faculty track evaluations.
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    HR personnel can view scores but cannot modify them.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}