'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';

const roles = [
  { label: 'Applicant', href: '/applicant' },
  { label: 'HR Personnel', href: '/hr' },
  { label: 'Administrator', href: '/admin' },
] as const;

export default function RoleSelect() {
  const [selected, setSelected] = useState<(typeof roles)[number]>(roles[0]);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Get form values
    const form = e.currentTarget as HTMLFormElement;
    const emailInput = form.elements.namedItem('email') as HTMLInputElement;
    const passwordInput = form.elements.namedItem(
      'password'
    ) as HTMLInputElement;

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Show error to user - for now, just log it
        console.error('Login failed:', errorData);
        // TODO: Show error message to user in UI
        return;
      }

      // Login successful, now navigate
      router.push(selected.href);
    } catch (error) {
      console.error('Login error:', error);
      // TODO: Show error message to user in UI
    }
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { className: 'role-select' },
      roles.map((role) =>
        React.createElement(
          'button',
          {
            key: role.href,
            type: 'button',
            className: `role-btn${role.href === selected.href ? ' selected' : ''}`,
            onClick: () => setSelected(role),
          },
          role.label
        )
      )
    ),
    React.createElement(
      'form',
      { onSubmit: handleSubmit },
      React.createElement(
        'div',
        { className: 'field' },
        React.createElement('label', { htmlFor: 'email' }, 'Email address'),
        React.createElement('input', {
          id: 'email',
          type: 'email',
          placeholder: 'you@plm.edu.ph',
          name: 'email',
        })
      ),
      React.createElement(
        'div',
        { className: 'field' },
        React.createElement('label', { htmlFor: 'password' }, 'Password'),
        React.createElement('input', {
          id: 'password',
          type: 'password',
          placeholder: '••••••••••',
          name: 'password',
        })
      ),
      React.createElement(
        'button',
        { type: 'submit', className: 'btn btn-primary login-submit' },
        `Continue as ${selected.label}`
      )
    )
  );
}
