import * as React from 'react';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';

// Set runtime to Node.js for Prisma client usage
export const runtime = 'nodejs';

// Server action to update user profile
export const updateProfile = async (formData: FormData) => {
  "use server";

  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const ageStr = formData.get('age') as string;
    let gender = formData.get('gender') as string | null;
    let address = formData.get('address') as string | null;

    // Convert empty strings to null for optional fields
    if (gender === '') gender = null;
    if (address === '') address = null;

    // Validate required fields
    if (!name || !email) {
      throw new Error('Name and email are required');
    }

    // Parse age (optional)
    const age = ageStr ? parseInt(ageStr, 10) : null;
    if (ageStr && (isNaN(age) || age < 0)) {
      throw new Error("Age must be a valid positive number");
    }

    // Update user in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        age,
        gender,
        address,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    // Prisma error often has .message or .code
    const msg = error?.message ?? error ?? 'Unknown error';
    throw new Error(`Failed to update profile: ${msg}`);
  }

  // Redirect to profile page to show updated data
  redirect('/applicant/profile');
};

const navItems: NavItem[] = [
  { index: '01', label: 'Profile', href: '/applicant' },
  { index: '02', label: 'Applications', href: '/applicant/applications' },
  { index: '03', label: 'Vacancies', href: '/applicant/vacancies' },
  { index: '04', label: 'Documents', href: '/applicant/documents' },
  { index: '05', label: 'Career Path', href: '/career-path' },
];

export default async function ApplicantProfilePage() {
  // Get the logged-in applicant
  const applicant = await getCurrentUser();
  if (!applicant) {
    notFound();
  }

  return React.createElement(
    'div',
    { className: 'app-shell' },
    React.createElement(Sidebar, {
      wordmarkSub: 'Applicant',
      navItems: navItems,
      roleChip: 'Applicant',
      userName: applicant.name,
      userSub: applicant.email,
    }),
    React.createElement(
      'main',
      { className: 'main' },
      React.createElement(TopLine, {
        title: 'Edit Profile',
        subtitle: 'Update your personal information',
      }),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'Profile Information')
        ),
        React.createElement(
          'div',
          { className: 'grid grid-2col' },
          React.createElement(
            'div',
            null,
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Name: '),
              applicant.name
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Age: '),
              applicant.age !== null && applicant.age !== undefined ? applicant.age : 'Not specified'
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Gender: '),
              applicant.gender !== null && applicant.gender !== undefined ? applicant.gender : 'Not specified'
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Address: '),
              applicant.address !== null && applicant.address !== undefined ? applicant.address : 'Not specified'
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Email: '),
              applicant.email
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Role: '),
              applicant.role
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Created at: '),
              new Date(applicant.createdAt).toLocaleDateString()
            )
          ),
          React.createElement(
            'div',
            { className: 'text-right' },
            React.createElement('div', {
              className: 'seal',
              style: { width: 60, height: 60 },
            })
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'Update Profile')
        ),
        React.createElement(
          'form',
          { action: updateProfile, className: 'space-y-4' },
          React.createElement(
            'div',
            null,
            React.createElement('label', { htmlFor: 'name' }, 'Full Name'),
            React.createElement('input', {
              id: 'name',
              name: 'name',
              type: 'text',
              defaultValue: applicant.name,
              className: 'input input-bordered w-full',
            })
          ),
          React.createElement(
            'div',
            null,
            React.createElement('label', { htmlFor: 'email' }, 'Email Address'),
            React.createElement('input', {
              id: 'email',
              name: 'email',
              type: 'email',
              defaultValue: applicant.email,
              className: 'input input-bordered w-full',
            })
          ),
          React.createElement(
            'div',
            null,
            React.createElement('label', { htmlFor: 'age' }, 'Age'),
            React.createElement('input', {
              id: 'age',
              name: 'age',
              type: 'number',
              defaultValue: applicant.age !== null && applicant.age !== undefined ? applicant.age : '',
              className: 'input input-bordered w-full',
            })
          ),
          React.createElement(
            'div',
            null,
            React.createElement('label', { htmlFor: 'gender' }, 'Gender'),
            React.createElement('input', {
              id: 'gender',
              name: 'gender',
              type: 'text',
              defaultValue: applicant.gender !== null && applicant.gender !== undefined ? applicant.gender : '',
              className: 'input input-bordered w-full',
            })
          ),
          React.createElement(
            'div',
            null,
            React.createElement('label', { htmlFor: 'address' }, 'Address'),
            React.createElement('input', {
              id: 'address',
              name: 'address',
              type: 'text',
              defaultValue: applicant.address !== null && applicant.address !== undefined ? applicant.address : '',
              className: 'input input-bordered w-full',
            })
          ),
          React.createElement(
            'button',
            { type: 'submit', className: 'btn btn-primary' },
            'Save Changes'
          )
        )
      )
    )
  );
}