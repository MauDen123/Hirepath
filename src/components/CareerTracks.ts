'use client';

import { useState } from 'react';
import React from 'react';

export interface Requirement {
  label: string;
  value: string;
}

export function RankCard({
  sg,
  title,
  current,
  reqs,
}: {
  sg: string;
  title: string;
  current?: boolean;
  reqs: Requirement[];
}) {
  return React.createElement(
    'div',
    { className: `rank-card${current ? ' current' : ''}` },
    React.createElement('div', { className: 'sg' }, sg),
    React.createElement('h4', null, title),
    React.createElement(
      'div',
      { className: 'req' },
      reqs.map((r) =>
        React.createElement(
          'div',
          { key: r.label },
          React.createElement('b', null, r.label),
          ' — ',
          r.value
        )
      )
    )
  );
}

export function RankConnector() {
  return React.createElement('div', {
    className: 'rank-connector',
    'aria-hidden': 'true',
  });
}

export default function CareerTracks({
  faculty,
  admin,
}: {
  faculty: React.ReactNode;
  admin: React.ReactNode;
}) {
  const [track, setTrack] = useState<'faculty' | 'admin'>('faculty');

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { className: 'track-tabs' },
      React.createElement(
        'button',
        {
          type: 'button',
          className: `track-tab${track === 'faculty' ? ' active' : ''}`,
          onClick: () => setTrack('faculty'),
        },
        'Faculty Track'
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          className: `track-tab${track === 'admin' ? ' active' : ''}`,
          onClick: () => setTrack('admin'),
        },
        'Administrative Track'
      )
    ),
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement(
        'div',
        {
          className: 'rail',
          style: { display: track === 'faculty' ? 'block' : 'none' },
        },
        React.createElement('div', { className: 'rail-line' }, faculty)
      ),
      React.createElement(
        'div',
        {
          className: 'rail',
          style: { display: track === 'admin' ? 'block' : 'none' },
        },
        React.createElement('div', { className: 'rail-line' }, admin)
      )
    )
  );
}
