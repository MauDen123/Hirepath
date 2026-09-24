import React from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  return React.createElement(
    'div',
    {
      className:
        'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8',
    },
    React.createElement(
      'div',
      { className: 'w-full max-w-md space-y-8' },
      React.createElement(
        'div',
        { className: 'text-center' },
        React.createElement(
          'h2',
          {
            className: 'mt-6 text-center text-3xl font-extrabold text-gray-900',
          },
          'Create HirePath Account'
        ),
        React.createElement(
          'p',
          { className: 'mt-2 text-center text-sm text-gray-600' },
          'Sign up for free'
        )
      ),
      React.createElement(
        'form',
        {
          className: 'mt-8 space-y-6',
          action: '/api/auth/register',
          method: 'POST',
        },
        React.createElement(
          'div',
          { className: 'rounded-md shadow-sm -space-y-px' },
          React.createElement(
            'div',
            { className: '' },
            React.createElement(
              'label',
              { htmlFor: 'name', className: 'sr-only' },
              'Name'
            ),
            React.createElement('input', {
              id: 'name',
              name: 'name',
              type: 'text',
              autoComplete: 'name',
              required: true,
              className:
                'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm',
            })
          ),
          React.createElement(
            'div',
            { className: '' },
            React.createElement(
              'label',
              { htmlFor: 'email-address', className: 'sr-only' },
              'Email address'
            ),
            React.createElement('input', {
              id: 'email-address',
              name: 'email',
              type: 'email',
              autoComplete: 'email',
              required: true,
              className:
                'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm',
            })
          ),
          React.createElement(
            'div',
            { className: '' },
            React.createElement(
              'label',
              { htmlFor: 'password', className: 'sr-only' },
              'Password'
            ),
            React.createElement('input', {
              id: 'password',
              name: 'password',
              type: 'password',
              autoComplete: 'current-password',
              required: true,
              className:
                'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm',
            })
          )
        ),
        React.createElement(
          'div',
          { className: 'flex items-center justify-between' },
          React.createElement(
            'div',
            { className: 'flex items-center' },
            React.createElement('input', {
              id: 'terms',
              name: 'terms',
              type: 'checkbox',
              required: true,
              className:
                'h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded',
            }),
            React.createElement(
              'label',
              {
                htmlFor: 'terms',
                className: 'ml-2 block text-sm text-gray-900',
              },
              'I agree to the terms and conditions'
            )
          )
        ),
        React.createElement(
          'div',
          null,
          React.createElement(
            'button',
            {
              type: 'submit',
              className:
                'group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:offset-2',
            },
            'Create account'
          )
        )
      ),
      React.createElement(
        'p',
        { className: 'mt-6 text-center text-sm text-gray-500' },
        React.createElement(
          Link,
          { href: '/' },
          'Already have an account? Sign in'
        )
      )
    )
  );
}
