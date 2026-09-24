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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Get form values
      const form = e.currentTarget as HTMLFormElement;
      const emailInput = form.elements.namedItem('email') as HTMLInputElement;
      const passwordInput = form.elements.namedItem(
        'password'
      ) as HTMLInputElement;

      const email = emailInput.value;
      const password = passwordInput.value;

      // Basic client-side validation
      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

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
        const errorMessage = errorData.error || 'Login failed. Please check your credentials.';
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Login successful, now navigate
      router.push(selected.href);
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    } finally {
      setLoading(false);
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
          onChange: () => setError(null),
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
          onChange: () => setError(null),
        })
      ),
      error && React.createElement(
        'div',
        { className: 'error-message' },
        React.createElement('p', { className: 'error-text' }, error)
      ),
      React.createElement(
        'button',
        {
          type: 'submit',
          className: `btn btn-primary login-submit${loading ? ' loading' : ''}`,
          disabled: loading
        },
        loading ? 'Signing in...' : `Continue as ${selected.label}`
      )
    )
  );
}
