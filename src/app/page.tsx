import * as React from 'react';
import Seal from '@/components/Seal';
import RoleSelect from '@/components/RoleSelect';

export default function LoginPage() {
  return React.createElement(
    'div',
    { className: 'landing' },
    React.createElement(
      'section',
      { className: 'landing-story' },
      React.createElement(
        'div',
        { className: 'landing-brand' },
        React.createElement(Seal, null),
        React.createElement(
          'div',
          { className: 'wordmark' },
          'PLM-HirePath',
          React.createElement('span', null, 'Recruitment & Career Pathing')
        )
      ),
      React.createElement(
        'div',
        { className: 'landing-headline' },
        React.createElement(
          'span',
          { className: 'kicker' },
          'Case File No. 2026-0000'
        ),
        React.createElement(
          'h1',
          null,
          'Every credential,',
          React.createElement('br', null),
          'one case file.'
        ),
        React.createElement(
          'p',
          null,
          'Document screening, CRRC scoring, and career pathing for PLM&apos;s',
          ' ',
          'administrative and faculty hiring — in one record, from application',
          ' ',
          'to appointment.'
        )
      ),
      React.createElement(
        'div',
        { className: 'landing-foot' },
        React.createElement(
          'div',
          null,
          React.createElement('strong', null, '3'),
          ' hiring tracks'
        ),
        React.createElement(
          'div',
          null,
          React.createElement('strong', null, 'CSC'),
          ' aligned QS'
        ),
        React.createElement(
          'div',
          null,
          React.createElement('strong', null, 'CRRC'),
          ' scoring built in'
        )
      )
    ),
    React.createElement(
      'section',
      { className: 'landing-panel' },
      React.createElement(
        'div',
        { className: 'login-card' },
        React.createElement('h2', null, 'Sign in to your case file'),
        React.createElement(
          'p',
          { className: 'sub' },
          'Select your role, then continue with your PLM credentials.'
        ),
        React.createElement(RoleSelect, null),
        React.createElement(
          'p',
          { className: 'login-note' },
          'This is a front-end mockup — no credentials are checked.',
          React.createElement('br', null),
          'Forgot your password? Contact PLM HRDO.'
        )
      )
    )
  );
}
