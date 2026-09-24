import * as React from 'react';
import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';

// Set runtime to Node.js
export const runtime = 'nodejs';

const navItems: NavItem[] = [
  { index: '01', label: 'Profile', href: '/applicant' },
  { index: '02', label: 'Applications', href: '/applicant/applications' },
  { index: '03', label: 'Documents', href: '/applicant/documents' },
  { index: '04', label: 'Career Path', href: '/career-path' },
];


// Server action to delete document
export const deleteDocument = async (formData: FormData) => {
  "use server";
  try {
    const id = formData.get('id') as string;
    if (!id) {
      throw new Error('Document ID is required');
    }

    // Log the id for debugging (only visible in server logs)
    console.log(`Attempting to delete document with id: ${id}`);
    // Log the runtime to see if we are in Edge or Node.js
    console.log(`Runtime in deleteDocument: ${typeof globalThis.EdgeRuntime !== 'undefined' ? 'Edge' : 'Node.js'}`);
    // Log if Prisma client is available
    console.log(`Prisma client in deleteDocument: ${prisma ? 'available' : 'null'}`);

    // If Prisma client is not available, throw an error
    if (!prisma) {
      throw new Error('Prisma client is not available. Please check the runtime.');
    }

    // Attempt to delete the document
    await prisma.document.delete({ where: { id } });
    redirect('/applicant/documents');
  } catch (error) {
    // Log the error to the server console
    console.error('Error in deleteDocument server action:', error);
    // Return a user-friendly error message
    throw new Error('Failed to delete document. Please try again.');
  }
};

export default async function ApplicantDocumentPage({
  params,
}: {
  params: { id: string };
}) {
  // Get the logged-in applicant for sidebar info
  const applicant = await getCurrentUser();
  if (!applicant) {
    notFound();
  }

  // Fetch document data directly from Prisma
  const documentId = (await params).id;
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      application: {
        applicantId: applicant.id,
      },
    },
    include: {
      application: {
        include: {
          vacancy: {
            select: {
              id: true,
              positionTitle: true,
              plantillaItemNo: true,
              salaryGrade: true,
              monthlySalary: true,
              placeOfAssignment: true,
              track: true,
              appointmentType: true,
              slots: true,
              status: true,
              qsTemplate: {
                select: {
                  id: true,
                  positionTitle: true,
                  salaryGrade: true,
                  track: true,
                  education: true,
                  experience: true,
                  training: true,
                  eligibility: true,
                }
              },
              college: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!document) {
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
        title: 'Document Details',
        subtitle: `Details for ${document.type}`,
      }),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'Document Details')
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
              React.createElement('strong', null, 'Document Type: '),
              document.type
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Uploaded: '),
              new Date(document.uploadedAt).toLocaleDateString()
            ),
            React.createElement(
              'p',
              null,
              React.createElement('strong', null, 'Status: '),
              React.createElement(
                'span',
                {
                  className: `badge ${document.verificationStatus === 'verified' ? 'approved' : document.verificationStatus === 'flagged' ? 'flagged' : 'pending'}`,
                },
                document.verificationStatus
              )
            ),
            document.parsingConfidence !== null
              ? React.createElement(
                  'p',
                  null,
                  React.createElement('strong', null, 'Parsing Confidence: '),
                  `${(document.parsingConfidence * 100).toFixed(0)}%`
                )
              : null
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
          React.createElement('h3', null, 'Parsed Data')
        ),
        document.parsedData
          ? React.createElement(
              'pre',
              {
                style: {
                  backgroundColor: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '4px',
                  overflowX: 'auto',
                },
              },
              JSON.stringify(document.parsedData, null, 2)
            )
          : React.createElement(
              'p',
              { className: 'muted' },
              'No parsed data available for this document.'
            )
      ),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'Document Preview')
        ),
        React.createElement(
          'div',
          { className: 'card-body' },
          document.fileUrl && document.fileUrl.trim() !== ''
            ? React.createElement(
                'iframe',
                {
                  src: document.fileUrl,
                  style: { width: '100%', height: '800px', border: 'none' },
                  title: 'Document preview'
                }
              )
            : React.createElement(
                'p',
                { className: 'muted' },
                'No file available for preview.'
              )
        )
      ),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-head' },
          React.createElement('h3', null, 'Actions')
        ),
        React.createElement(
          'div',
          { className: 'card-body' },
          React.createElement(
            'form',
            { action: deleteDocument },
            React.createElement(
              'input',
              {
                type: 'hidden',
                name: 'id',
                value: document.id,
              }
            ),
            React.createElement(
              'button',
              {
                type: 'submit',
                className: 'btn btn-outline',
              },
              'Delete Document'
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'mt-2' },
          React.createElement(
            Link,
            { href: `/applicant/documents`, className: 'btn btn-ghost' },
            'Back to Documents'
          )
        )
      )
    )
  );
}