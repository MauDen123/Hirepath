'use client';

import React from 'react';

export default function TopLine({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return React.createElement(
    'div',
    { className: 'topline' },
    React.createElement(
      'div',
      null,
      React.createElement('h1', null, title),
      subtitle && React.createElement('p', { className: 'sub' }, subtitle)
    ),
    action
  );
}
