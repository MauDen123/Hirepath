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

export default async function ApplicantDocumentPage({
  params,
}: {
  params: { id: string };
}) {
  // Get the logged-in applicant
  const applicant = await getCurrentUser();
  if (!applicant) {
    return notFound();
  }

  // Get the specific document for the logged-in applicant
  const document = await prisma.document.findFirst({
    where: {
      id: params.id,
      application: {
        applicantId: applicant.id,
      },
    },
  });

  if (!document) {
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
        title: 'Document Details',
        subtitle: `Details for ${document.type}`,
      }),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'Document Details')
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
              React.createElement('strong', null, 'Document Type: '),
              document.type
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Uploaded: '),
              new Date(document.uploadedAt).toLocaleDateString()
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Status: '),
              React.createElement(
                'span',
                {
                  className: `badge ${document.verificationStatus === 'verified' ? 'approved' : document.verificationStatus === 'flagged' ? 'flagged' : 'pending'}`,
                },
                document.verificationStatus
              )
            ),
            document.parsingConfidence !== null
              ? React.createElement(
                  'p',
                  null,
                  React.createElement('strong', null, 'Parsing Confidence: '),
                  `${(document.parsingConfidence * 100).toFixed(0)}%`
                )
              : null
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
          React.createElement('h3', null, 'Parsed Data')
        ),
        document.parsedData
          ? React.createElement(
              'pre',
              {
                style: {
                  backgroundColor: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '4px',
                  overflowX: 'auto',
                },
              },
              JSON.stringify(document.parsedData, null, 2)
            )
          : React.createElement(
              'p',
              { className: 'muted' },
              'No parsed data available for this document.'
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
          { href: `/applicant/documents`, className: 'btn btn-ghost' },
          'Back to Documents'
        )
      )
    )
  );
}
