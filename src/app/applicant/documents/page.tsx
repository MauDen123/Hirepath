'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';
import { notFound } from 'next/navigation';
import ApplicantDocumentsUploadForm from './ApplicantDocumentsUploadForm';

const navItems: NavItem[] = [
  { index: '01', label: 'Profile', href: '/applicant' },
  { index: '02', label: 'Applications', href: '/applicant/applications' },
  { index: '03', label: 'Vacancies', href: '/applicant/vacancies' },
  { index: '04', label: 'Documents', href: '/applicant/documents' },
  { index: '05', label: 'Career Path', href: '/career-path' },
];

export default function ApplicantDocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [applicant, setApplicant] = React.useState<any>(null);
  const [applications, setApplications] = React.useState<any[]>([]);
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState<string>(searchParams.get('sort') || 'date_desc');
  const [deleteLoading, setDeleteLoading] = React.useState<boolean>(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = React.useState<boolean>(false);

  // Fetch applicant, applications, and documents when sort changes or on mount
  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/applicant/documents?sort=${sort}`);
        if (!res.ok) {
          // If not authenticated, redirect to login (handled by notFound for simplicity)
          if (res.status === 401) {
            notFound();
          }
          throw new Error('Failed to fetch data');
        }
        const data = await res.json();
        setApplicant(data.user);
        setApplications(data.applications);
        setDocuments(data.documents);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    }

    fetchData();
  }, [sort, router]);

  // Reset deleteSuccess message after 3 seconds
  React.useEffect(() => {
    if (deleteSuccess) {
      const timer = setTimeout(() => {
        setDeleteSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccess]);

  // When sort changes, update URL and trigger refetch
  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    router.replace(`/applicant/documents?${params.toString()}`);
  };

  // Delete document
  const deleteDocument = async (docId: string) => {
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }

      // Successfully removed, update state directly
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      setDeleteSuccess(true);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete document');
    } finally {
      setDeleteLoading(false);
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
          title: 'My Documents',
          subtitle: 'Manage your uploaded documents',
        }),
        React.createElement(
          'p',
          { className: 'muted' },
          'Loading...'
        )
      )
    );
  }

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
        title: 'My Documents',
        subtitle: 'Manage your uploaded documents',
      }),
      deleteError && React.createElement(
        'div',
        { className: 'mb-4 p-3 bg-red-50 rounded border border-red-200' },
        React.createElement('p', { className: 'text-sm text-red-700' }, deleteError)
      ),
      deleteSuccess && React.createElement(
        'div',
        { className: 'mb-4 p-3 bg-green-50 rounded border border-green-200' },
        React.createElement('p', { className: 'text-sm text-green-700' }, 'Document deleted successfully!')
      ),
      React.createElement(
        'div',
        { className: 'mb-4' },
        React.createElement(
          'label',
          { className: 'block text-sm font-medium mb-1' },
          'Sort by:'
        ),
        React.createElement(
          'select',
          {
            value: sort,
            onChange: (e) => handleSortChange(e.target.value),
            className: 'select w-sm'
          },
          React.createElement(
            'option',
            { value: 'date_desc' },
            'Date (newest first)'
          ),
          React.createElement(
            'option',
            { value: 'date_asc' },
            'Date (oldest first)'
          ),
          React.createElement(
            'option',
            { value: 'type_asc' },
            'Type (A-Z)'
          ),
          React.createElement(
            'option',
            { value: 'type_desc' },
            'Type (Z-A)'
          )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement(
        'div',
        { className: 'card-head' },
        React.createElement('h3', null, 'My Documents')
      ),
      React.createElement(
        'div',
        { className: 'card-body' },
        React.createElement(ApplicantDocumentsUploadForm, { applications, userId: applicant.id })
      )
    ),
    React.createElement(
      'div',
      { className: 'card mt-4' },
      React.createElement(
        'div',
        { className: 'card-head' },
        React.createElement('h3', null, 'Document List')
      ),
      React.createElement(
        'div',
        { className: 'card-body' },
        documents.length === 0 ? (
          React.createElement(
            'p',
            { className: 'muted' },
            'You have not uploaded any documents yet.'
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
                React.createElement(
                  'th',
                  { className: 'text-left' },
                  'Document Type'
                ),
                React.createElement(
                  'th',
                  { className: 'text-left' },
                  'Uploaded'
                ),
                React.createElement(
                  'th',
                  { className: 'text-left' },
                  'Status'
                ),
                React.createElement(
                  'th',
                  { className: 'text-left' },
                  'Actions'
                )
              )
            ),
            React.createElement(
              'tbody',
              null,
              documents.map((doc) => (
                React.createElement(
                  'tr',
                  { key: doc.id },
                  React.createElement(
                    'td',
                    null,
                    doc.type
                  ),
                  React.createElement(
                    'td',
                    null,
                    new Date(doc.uploadedAt).toLocaleDateString()
                  ),
                  React.createElement(
                    'td',
                    null,
                    React.createElement(
                      'span',
                      {
                        className: `badge ${doc.verificationStatus === 'verified' ? 'approved' : doc.verificationStatus === 'flagged' ? 'flagged' : 'pending'}`,
                      }
                    ),
                    doc.verificationStatus
                  ),
                  React.createElement(
                    'td',
                    null,
                    React.createElement(
                      Link,
                      { href: `/applicant/documents/${doc.id}`, className: 'btn btn-ghost btn-sm' },
                      'View'
                    ),
                    React.createElement(
                      Link,
                      { href: `/applicant/documents/${doc.id}/edit`, className: 'btn btn-outline btn-sm' },
                      'Edit'
                    ),
                    React.createElement(
                      'button',
                      {
                        onClick: () => deleteDocument(doc.id),
                        disabled: deleteLoading,
                        className: `btn btn-outline btn-sm ${deleteLoading ? 'opacity-50' : ''}`
                      },
                      deleteLoading ? 'Deleting...' : 'Delete'
                    )
                  )
                )
              ))
            )
          )
        )
      )
    )
  );
}