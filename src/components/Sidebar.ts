'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Seal from './Seal';
import React from 'react';

export interface NavItem {
  index: string;
  label: string;
  href: string;
}

export default function Sidebar({
  wordmarkSub,
  navItems,
  roleChip,
  userName,
  userSub,
}: {
  wordmarkSub: string;
  navItems: NavItem[];
  roleChip: string;
  userName: string;
  userSub: string;
}) {
  const pathname = usePathname();

  return React.createElement(
    'aside',
    { className: 'sidebar' },
    React.createElement(
      'div',
      { className: 'sidebar-brand' },
      React.createElement(Seal),
      React.createElement(
        'div',
        { className: 'wordmark' },
        'PLM-HirePath',
        React.createElement('span', null, wordmarkSub)
      )
    ),
    React.createElement(
      'ul',
      { className: 'folder-nav' },
      navItems.map((item) =>
        React.createElement(
          'li',
          {
            key: item.href,
            className: pathname === item.href ? 'active' : undefined,
          },
          React.createElement(
            Link,
            { href: item.href },
            React.createElement('span', { className: 'tab-index' }, item.index),
            ' ',
            item.label
          )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'sidebar-foot' },
      React.createElement('span', { className: 'role-chip' }, '● ', roleChip),
      React.createElement(
        'p',
        { style: { marginTop: 10 } },
        userName,
        React.createElement('br'),
        userSub
      )
    )
  );
}
