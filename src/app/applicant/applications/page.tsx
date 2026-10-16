import * as React from 'react';
import Link from 'next/link';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';

// Set runtime to Node.js
export const runtime = 'nodejs';

const navItems: NavItem[] = [
  { index: '01', label: 'Profile', href: '/applicant' },
  { index: '02', label: 'Applications', href: '/applicant/applications' },
  { index: '03', label: 'Vacancies', href: '/applicant/vacancies' },
  { index: '04', label: 'Documents', href: '/applicant/documents' },
  { index: '05', label: 'Career Path', href: '/career-path' },
];

export default async function ApplicantApplicationsPage() {
  // Get the logged-in applicant
  const applicant = await getCurrentUser();
  if (!applicant) {
    notFound();
  }

  // Get applications for the logged-in applicant
  const applications = await prisma.application.findMany({
    where: { applicantId: applicant.id },
    include: {
      vacancy: true,
      documents: {
        select: {
          type: true,
          uploadedAt: true,
          verificationStatus: true,
        },
        orderBy: { uploadedAt: 'desc' },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });

  if (!applicant) {
    return React.createElement(
      'div',
      { className: 'app-shell' },
      React.createElement(Sidebar, {
        wordmarkSub: 'Applicant',
        navItems: navItems,
        roleChip: 'Applicant',
        userName: 'Applicant',
        userSub: 'No applicant data found',
      }),
      React.createElement(
        'main',
        { className: 'main' },
        React.createElement(TopLine, {
          title: 'My Applications',
          subtitle: 'No applicant data available',
        }),
        React.createElement(
          'p',
          { className: 'muted' },
          'Please run the seed script to load sample data.'
        )
      )
    );
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
        title: 'My Applications',
        subtitle: 'Track your job applications and their status',
      }),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'My Applications')
        ),
        applications.length === 0
          ? React.createElement(
              'p',
              { className: 'muted' },
              'You have not submitted any applications yet.'
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
                  React.createElement('th', null, 'Vacancy'),
                  React.createElement('th', null, 'Submitted'),
                  React.createElement('th', null, 'Status'),
                  React.createElement('th', null, 'Documents'),
                  React.createElement('th', null, 'Actions')
                )
              ),
              React.createElement(
                'tbody',
                null,
                applications.map((app: any) => {
                  const docs = app.documents || [];
                  return React.createElement(
                    'tr',
                    { key: app.id },
                    React.createElement('td', null, app.vacancy.positionTitle),
                    React.createElement(
                      'td',
                      null,
                      new Date(app.submittedAt).toLocaleDateString()
                    ),
                    React.createElement(
                      'td',
                      null,
                      // Status badge
                      React.createElement(
                        'span',
                        { className: `badge ${app.status.toLowerCase()}` },
                        app.status.replace(/_/g, ' ').toUpperCase()
                      )
                    ),
                    React.createElement(
                      'td',
                      null,
                      docs.length > 0
                        ? React.createElement(
                            'div',
                            { className: 'doc-list' },
                            docs.map((doc: any) =>
                              React.createElement(
                                'div',
                                { key: doc.id, className: 'doc-item' },
                                React.createElement(
                                  'span',
                                  { className: 'doc-type' },
                                  doc.type.replace(/_/g, ' ').toUpperCase()
                                ),
                                React.createElement(
                                  'span',
                                  {
                                    className: `doc-status ${doc.verificationStatus}`,
                                  },
                                  doc.verificationStatus
                                    .charAt(0)
                                    .toUpperCase() +
                                    doc.verificationStatus.slice(1)
                                ),
                                React.createElement(
                                  'span',
                                  { className: 'doc-date' },
                                  new Date(doc.uploadedAt).toLocaleDateString()
                                )
                              )
                            )
                          )
                        : React.createElement(
                            'p',
                            { className: 'muted' },
                            'No documents uploaded'
                          )
                    ),
                    React.createElement(
                      'td',
                      null,
                      React.createElement(
                        'Link',
                        {
                          href: `/applicant/applications/${app.id}`,
                          className: 'btn btn-ghost btn-sm',
                        },
                        'View'
                      )
                    )
                  );
                })
              )
            )
      )
    )
  );
}
