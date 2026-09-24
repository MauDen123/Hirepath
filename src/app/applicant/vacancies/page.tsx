'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';

const navItems: NavItem[] = [
  { index: '01', label: 'Profile', href: '/applicant' },
  { index: '02', label: 'Applications', href: '/applicant/applications' },
  { index: '03', label: 'Vacancies', href: '/applicant/vacancies' },
  { index: '04', label: 'Documents', href: '/applicant/documents' },
  { index: '05', label: 'Career Path', href: '/career-path' },
];

export default function ApplicantVacanciesPage() {
  console.log('ApplicantVacanciesPage rendered');
  const router = useRouter();

  const [vacancies, setVacancies] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [applySuccess, setApplySuccess] = React.useState<string | null>(null);
  const [applyError, setApplyError] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.log('UseEffect in ApplicantVacanciesPage called');
    async function fetchVacancies() {
      try {
        const res = await fetch('http://localhost:3000/api/vacancies');
        console.log('Vacancies fetch response:', res);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Vacancies fetch error:', res.status, errorText);
          throw new Error('Failed to fetch vacancies: ' + res.status);
        }
        const data = await res.json();
        console.log('Vacancies data:', data);
        // Show all vacancies (like HRMO does) but we'll indicate which are open for application
        setVacancies(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching vacancies:', err);
        setError('Could not load vacancies');
        setLoading(false);
      }
    }

    fetchVacancies();
  }, [router]);

  const handleApply = async (vacancyId: string) => {
    // Find the vacancy to check its status
    const vacancy = vacancies.find((v: any) => v.id === vacancyId);
    if (!vacancy || vacancy.status !== 'published') {
      setApplyError('Can only apply to published vacancies');
      return;
    }

    setApplySuccess(null);
    setApplyError(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vacancyId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply');
      }
      setApplySuccess('Application submitted successfully!');
      // Optionally, we could refetch applications list if we want to show updated count
    } catch (err: any) {
      console.error('Error applying:', err);
      setApplyError(err.message || 'Something went wrong');
    }
  };

  if (loading) {
    return React.createElement(
      'div',
      { className: 'app-shell' },
      React.createElement(Sidebar, {
        wordmarkSub: 'Applicant',
        navItems: navItems,
        roleChip: 'Applicant',
        userName: 'Loading...',
        userSub: '',
      }),
      React.createElement(
        'main',
        { className: 'main' },
        React.createElement(TopLine, {
          title: 'Available Vacancies',
          subtitle: 'Browse and apply for open positions',
        }),
        React.createElement('p', { className: 'muted' }, 'Loading...')
      )
    );
  }

  if (error) {
    return React.createElement(
      'div',
      { className: 'app-shell' },
      React.createElement(Sidebar, {
        wordmarkSub: 'Applicant',
        navItems: navItems,
        roleChip: 'Applicant',
        userName: 'Error',
        userSub: '',
      }),
      React.createElement(
        'main',
        { className: 'main' },
        React.createElement(TopLine, {
          title: 'Available Vacancies',
          subtitle: 'Browse and apply for open positions',
        }),
        React.createElement('p', { className: 'muted' }, error)
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
      userName: 'Applicant',
      userSub: '',
    }),
    React.createElement(
      'main',
      { className: 'main' },
      React.createElement(TopLine, {
        title: 'Available Vacancies',
        subtitle: 'Browse and apply for open positions',
      }),
      applySuccess && (
        React.createElement(
          'div',
          { className: 'mt-4 p-3 bg-green-50 rounded border border-green-200' },
          React.createElement('p', { className: 'text-sm text-green-700' }, applySuccess)
        )
      ),
      applyError && (
        React.createElement(
          'div',
          { className: 'mt-4 p-3 bg-red-50 rounded border border-red-200' },
          React.createElement('p', { className: 'text-sm text-red-700' }, applyError)
        )
      ),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'Vacancies')
        ),
        React.createElement(
          'div',
          { className: 'card-body' },
          vacancies.length === 0 ? (
            React.createElement(
              'p',
              { className: 'muted' },
              'No vacancies at the moment.'
            )
          ) : (
            React.createElement(
              'table',
              { className: 'w-full' },
              React.createElement(
                'thead',
                null,
                React.createElement(
                  'tr',
                  null,
                  React.createElement('th', null, 'Position'),
                  React.createElement('th', null, 'College'),
                  React.createElement('th', null, 'Track'),
                  React.createElement('th', null, 'Salary Grade'),
                  React.createElement('th', null, 'Status'),
                  React.createElement('th', null, 'Actions')
                )
              ),
              React.createElement(
                'tbody',
                null,
                vacancies.map((vac: any) => {
                  const isPublished = vac.status === 'published';
                  // Get badge class based on status (same logic as HRMO page)
                  let badgeClass = 'badge-neutral';
                  switch (vac.status) {
                    case 'draft':
                      badgeClass = 'badge-neutral';
                      break;
                    case 'pending_hr_review':
                      badgeClass = 'badge-pending';
                      break;
                    case 'returned':
                      badgeClass = 'badge-flagged';
                      break;
                    case 'awaiting_vpaa_endorsement':
                      badgeClass = 'badge-pending';
                      break;
                    case 'awaiting_president_approval':
                      badgeClass = 'badge-pending';
                      break;
                    case 'awaiting_board_confirmation':
                      badgeClass = 'badge-pending';
                      break;
                    case 'published':
                      badgeClass = 'badge-approved';
                      break;
                    case 'closed':
                      badgeClass = 'badge-flagged';
                      break;
                    default:
                      badgeClass = 'badge-neutral';
                  }
                  return React.createElement(
                    'tr',
                    { key: vac.id },
                    React.createElement('td', null, vac.positionTitle),
                    React.createElement(
                      'td',
                      null,
                      vac.college ? vac.college.name : 'N/A'
                    ),
                    React.createElement('td', null, vac.track),
                    React.createElement('td', null, vac.salaryGrade ?? 'N/A'),
                    React.createElement(
                      'td',
                      null,
                      React.createElement('span', { className: badgeClass }, vac.status)
                    ),
                    React.createElement(
                      'td',
                      null,
                      React.createElement(
                        'button',
                        {
                          onClick: () => handleApply(vac.id),
                          className: `btn btn-primary btn-sm ${!isPublished ? 'opacity-50' : ''}`,
                          disabled: !isPublished,
                          title: isPublished ? undefined : 'Can only apply to published vacancies'
                        },
                        'Apply'
                      )
                    )
                  );
                })
              )
            )
          )
        )
      )
    )
  );
}