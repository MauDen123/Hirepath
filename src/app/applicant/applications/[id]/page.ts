import * as React from 'react';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';

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
  // Get the logged-in applicant
  const applicant = await getCurrentUser();
  if (!applicant) {
    return notFound();
  }

  // Get the specific application for the logged-in applicant
  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: { vacancy: true, documents: true },
  });

  // Ensure the application belongs to the logged-in applicant
  if (!application || application.applicantId !== applicant.id) {
    return notFound();
  }

  return React.createElement(
    'div',
    { className: 'app-shell' },
    React.createElement(Sidebar, {
      wordmarkSub: 'Applicant',
      navItems: navItems,
      roleChip: 'Applicant',
      userName: applicant.name,
      userSub: applicant.email,
    }),
    React.createElement(
      'main',
      { className: 'main' },
      React.createElement(TopLine, {
        title: 'Application Details',
        subtitle: `Application for ${application.vacancy?.positionTitle || 'Unknown Position'}`,
      }),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'Application Details')
        ),
        React.createElement(
          'div',
          { className: 'grid grid-2col' },
          React.createElement(
            'div',
            null,
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Vacancy: '),
              application.vacancy?.positionTitle || 'N/A'
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Submitted: '),
              new Date(application.submittedAt).toLocaleDateString()
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Status: '),
              React.createElement(
                'span',
                {
                  className: `badge ${application.status === 'qualified' ? 'approved' : application.status === 'deficient' ? 'flagged' : 'pending'}`,
                },
                application.status
              )
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'QS Match: '),
              application.qsMatchScore !== null
                ? `${application.qsMatchScore}%`
                : 'N/A'
            )
          ),
          React.createElement(
            'div',
            { className: 'text-right' },
            React.createElement('div', {
              className: 'seal',
              style: { width: 60, height: 60 },
            })
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'Documents')
        ),
        application.documents.length === 0
          ? React.createElement(
              'p',
              { className: 'muted' },
              'No documents uploaded for this application.'
            )
          : React.createElement(
              'table',
              null,
              React.createElement(
                'thead',
                null,
                React.createElement(
                  'tr',
                  null,
                  React.createElement('th', null, 'Document Type'),
                  React.createElement('th', null, 'Uploaded'),
                  React.createElement('th', null, 'Status')
                )
              ),
              React.createElement(
                'tbody',
                null,
                application.documents.map((doc) => {
                  return React.createElement(
                    'tr',
                    { key: doc.id },
                    React.createElement('td', null, doc.type),
                    React.createElement(
                      'td',
                      null,
                      new Date(doc.uploadedAt).toLocaleDateString()
                    ),
                    React.createElement(
                      'td',
                      null,
                      React.createElement(
                        'span',
                        {
                          className: `badge ${doc.verificationStatus === 'verified' ? 'approved' : doc.verificationStatus === 'flagged' ? 'flagged' : 'pending'}`,
                        },
                        doc.verificationStatus
                      )
                    )
                  );
                })
              )
            )
      ),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'Actions')
        ),
        React.createElement(
          'Link',
          { href: '/applicant/applications', className: 'btn btn-ghost' },
          'Back to Applications'
        )
      )
    )
  );
}
