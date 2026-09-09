import * as React from 'react';
import Link from 'next/link';
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

export default async function ApplicantDocumentsPage() {
  // Get the logged-in applicant
  const applicant = await getCurrentUser();
  if (!applicant) {
    return notFound();
  }

  // Get all applications for the logged-in applicant with their documents
  const applications = await prisma.application.findMany({
    where: { applicantId: applicant.id },
    include: { documents: true },
  });

  // Flatten all documents from all applications
  const documents = applications.flatMap((app) => app.documents);

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
        title: 'My Documents',
        subtitle: 'Manage your uploaded documents',
      }),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'My Documents')
        ),
        documents.length === 0
          ? React.createElement(
              'p',
              { className: 'muted' },
              'You have not uploaded any documents yet.'
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
                  React.createElement('th', null, 'Status'),
                  React.createElement('th', null, 'Actions')
                )
              ),
              React.createElement(
                'tbody',
                null,
                documents.map((doc) => {
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
                    ),
                    React.createElement(
                      'td',
                      null,
                      React.createElement(
                        Link,
                        {
                          href: `/applicant/documents/${doc.id}`,
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
