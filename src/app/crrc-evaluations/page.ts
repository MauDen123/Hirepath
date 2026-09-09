import * as React from 'react';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';

const navItems: NavItem[] = [
  { index: '01', label: 'Applicants', href: '/hr' },
  { index: '02', label: 'Vacancies', href: '/vacancies' },
  { index: '03', label: 'CRRC Evaluations', href: '/crrc-evaluations' },
  { index: '04', label: 'Career Path Tool', href: '/career-path' },
  { index: '05', label: 'Reports', href: '/reports' },
];

export default async function CrrcEvaluationsPage() {
  return React.createElement(
    'div',
    { className: 'app-shell' },
    React.createElement(Sidebar, {
      wordmarkSub: 'HR Personnel',
      navItems: navItems,
      roleChip: 'HR Personnel',
      userName: 'Reynaldo J. Villegas',
      userSub: 'Human Resource Mgmt. Office',
    }),
    React.createElement(
      'main',
      { className: 'main' },
      React.createElement(TopLine, {
        title: 'CRRC Evaluations',
        subtitle: 'Manage CRRC evaluation schedules and results',
      }),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'CRRC Evaluations')
        ),
        React.createElement(
          'p',
          { className: 'muted' },
          'CRRC evaluations management interface will be implemented here.'
        )
      )
    )
  );
}
