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

export default async function ApplicantProfilePage() {
  // Get the logged-in applicant
  const applicant = await getCurrentUser();
  if (!applicant) {
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
        title: 'Edit Profile',
        subtitle: 'Update your personal information',
      }),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'Profile Information')
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
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Created at: '),
              new Date(applicant.createdAt).toLocaleDateString()
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
          React.createElement('h3', null, 'Update Profile')
        ),
        React.createElement(
          'form',
          { className: 'space-y-4' },
          React.createElement(
            'div',
            null,
            React.createElement('label', { htmlFor: 'name' }, 'Full Name'),
            React.createElement('input', {
              id: 'name',
              type: 'text',
              defaultValue: applicant.name,
              className: 'input input-bordered w-full',
            })
          ),
          React.createElement(
            'div',
            null,
            React.createElement('label', { htmlFor: 'email' }, 'Email Address'),
            React.createElement('input', {
              id: 'email',
              type: 'email',
              defaultValue: applicant.email,
              className: 'input input-bordered w-full',
            })
          ),
          React.createElement(
            'button',
            { type: 'submit', className: 'btn btn-primary' },
            'Save Changes'
          )
        )
      )
    )
  );
}
