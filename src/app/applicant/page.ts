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

export default async function ApplicantPage() {
  // Get the logged-in applicant
  const applicant = await getCurrentUser();
  if (!applicant) {
    return notFound();
  }

  // Get applications for the logged-in applicant
  const applications = await prisma.application.findMany({
    where: { applicantId: applicant.id },
    include: { vacancy: true },
    orderBy: { submittedAt: 'desc' },
  });

  
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
      React.createElement(
        TopLine,
        {
          title: 'My Dashboard',
          subtitle: 'Your applications and profile information',
        },
        React.createElement(
          Link,
          { href: '/applicant/profile', className: 'btn btn-ghost btn-sm' },
          'Edit Profile'
        )
      ),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'Profile')
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
              React.createElement('strong', null, 'Name: '),
              applicant.name
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Email: '),
              applicant.email
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Role: '),
              applicant.role
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
                  React.createElement('th', null, 'QS Match'),
                  React.createElement('th', null)
                )
              ),
              React.createElement(
                'tbody',
                null,
                applications.map((app) => {
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
                      React.createElement(
                        'span',
                        { className: 'badge pending' },
                        app.status
                      )
                    ),
                    React.createElement(
                      'td',
                      null,
                      app.qsMatchScore !== null ? `${app.qsMatchScore}%` : 'N/A'
                    ),
                    React.createElement(
                      'td',
                      null,
                      React.createElement(
                        Link,
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
