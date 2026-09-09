import Link from 'next/link';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';
import CareerTracks, {
  RankCard,
  RankConnector,
} from '@/components/CareerTracks';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import React from 'react';

export default async function CareerPathPage() {
  // Get current user
  const currentUser = await getCurrentUser();
  
  // If not authenticated, redirect to login (should be handled by middleware, but just in case)
  if (!currentUser) {
    // In a server component, we can't redirect directly, but we can return null or a redirect component
    // For now, we'll handle this in middleware, so this is just a fallback
    return null;
  }

  // Fetch faculty and admin career ranks from the database
  const [facultyRanks, adminRanks] = await Promise.all([
    // Get faculty track career ranks ordered by sequence
    prisma.careerRank.findMany({
      where: { track: 'faculty' },
      include: { qsTemplate: true },
      orderBy: { sequenceNo: 'asc' },
    }),

    // Get administrative track career ranks ordered by sequence
    prisma.careerRank.findMany({
      where: { track: 'administrative' },
      include: { qsTemplate: true },
      orderBy: { sequenceNo: 'asc' },
    }),
  ]);

  // Transform faculty ranks to RankCard components
  const faculty = facultyRanks.map((rank, index) =>
    React.createElement(RankCard, {
      key: rank.id,
      sg: `SG-${rank.qsTemplate.salaryGrade}`,
      title: rank.qsTemplate.positionTitle,
      current: index === 1, // Mark second rank as current for demo
      reqs: [
        {
          label: 'Education',
          value: rank.qsTemplate.education ?? 'Not specified',
        },
        {
          label: 'Experience',
          value: rank.qsTemplate.experience ?? 'Not specified',
        },
        {
          label: 'Training',
          value: rank.qsTemplate.training ?? 'Not specified',
        },
      ],
    })
  );

  // Transform admin ranks to RankCard components
  const admin = adminRanks.map((rank, index) =>
    React.createElement(RankCard, {
      key: rank.id,
      sg: `SG-${rank.qsTemplate.salaryGrade}`,
      title: rank.qsTemplate.positionTitle,
      current: index === 1, // Mark second rank as current for demo
      reqs: [
        {
          label: 'Education',
          value: rank.qsTemplate.education ?? 'Not specified',
        },
        {
          label: 'Experience',
          value: rank.qsTemplate.experience ?? 'Not specified',
        },
        {
          label: 'Training',
          value: rank.qsTemplate.training ?? 'Not specified',
        },
      ],
    })
  );

  // Add RankConnector between each rank (except after the last one)
  const facultyWithConnectors: React.ReactNode[] = [];
  facultyRanks.forEach((_, index) => {
    facultyWithConnectors.push(faculty[index]);
    if (index < facultyRanks.length - 1) {
      facultyWithConnectors.push(
        React.createElement(RankConnector, {
          key: `faculty-conn-${index}`,
        })
      );
    }
  });

  const adminWithConnectors: React.ReactNode[] = [];
  adminRanks.forEach((_, index) => {
    adminWithConnectors.push(admin[index]);
    if (index < adminRanks.length - 1) {
      adminWithConnectors.push(
        React.createElement(RankConnector, {
          key: `admin-conn-${index}`,
        })
      );
    }
  });

  // Determine role-specific sidebar info
  let roleChip = currentUser.role;
  let userName = currentUser.name || '';
  let userSub = '';

  if (currentUser.role === 'applicant') {
    userSub = `Applicant ID: APP-${currentUser.id.slice(-5).toUpperCase()}`;
  } else if (currentUser.role === 'hr') {
    userSub = 'Human Resource Mgmt. Office';
  } else if (currentUser.role === 'admin') {
    userSub = 'System Administrator';
  } else {
    userSub = currentUser.role;
  }

  // Use appropriate nav items based on role
  const navItems: NavItem[] =
    currentUser.role === 'applicant'
      ? [
          { index: '01', label: 'Profile', href: '/applicant' },
          { index: '02', label: 'Applications', href: '/applicant/applications' },
          { index: '03', label: 'Documents', href: '/applicant/documents' },
          { index: '04', label: 'Career Path', href: '/career-path' },
        ]
      : currentUser.role === 'hr'
      ? [
          { index: '01', label: 'Applicants', href: '/hr' },
          { index: '02', label: 'Vacancies', href: '/vacancies' },
          { index: '03', label: 'CRRC Evaluations', href: '/crrc-evaluations' },
          { index: '04', label: 'Career Path Tool', href: '/career-path' },
          { index: '05', label: 'Reports', href: '/reports' },
        ]
      : [
          { index: '01', label: 'Dashboard', href: '/admin' },
          { index: '02', label: 'Vacancies', href: '/vacancies' },
          { index: '03', label: 'Reports', href: '/reports' },
          { index: '04', label: 'Career Path', href: '/career-path' },
        ];

  return React.createElement(
    'div',
    { className: 'app-shell' },
    React.createElement(Sidebar, {
      wordmarkSub: 'Career Pathing',
      navItems: navItems,
      roleChip: roleChip,
      userName: userName,
      userSub: userSub,
    }),
    React.createElement(
      'main',
      { className: 'main' },
      React.createElement(TopLine, {
        title: 'Career path',
        subtitle:
          'Required education, experience, and training at each step — faculty and administrative tracks.',
        action: React.createElement(
          Link,
          {
            href: '/',
            className: 'btn btn-ghost btn-sm',
          },
          'Sign out'
        ),
      }),
      React.createElement(CareerTracks, {
        faculty: facultyWithConnectors,
        admin: adminWithConnectors,
      }),
      React.createElement(
        'p',
        {
          className: 'muted',
          style: { fontSize: 11.5, marginTop: 14 },
        },
        "Values pulled from PLM's Qualification Standards and Career Path matrix. Note: the administrative",
        ' ',
        'track is shown here as a straight ladder for layout consistency, but PLM HR has confirmed',
        ' ',
        'admin promotion is not strictly sequential — treat this visualization as illustrative.'
      )
    )
  );
}
