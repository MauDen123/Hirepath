
import { prisma } from '@/lib/prisma';
import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import DocumentEditForm from './form';
import Link from 'next/link';

export default async function DocumentEditPage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser(undefined);
  if (!user) {
    notFound();
  }

  // Only the applicant who owns the document can edit it
  const documentId = params.id;

  // Fetch document and verify ownership
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      application: {
        applicantId: user.id,
      },
    },
    include: {
      application: {
        include: {
          vacancy: true,
        },
      },
    },
  });

  if (!document) {
    notFound();
  }

  return (
    <div className="app-shell">
      <Sidebar
        wordmarkSub="Applicant"
        navItems={[
          { index: '01', label: 'Profile', href: '/applicant' },
          { index: '02', label: 'Applications', href: '/applicant/applications' },
          { index: '03', label: 'Documents', href: '/applicant/documents' },
          { index: '04', label: 'Career Path', href: '/career-path' },
        ]}
        roleChip="Applicant"
        userName={user.name}
        userSub={user.email}
      />
      <main className="main">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6">Edit Document</h1>
            <DocumentEditForm document={document} />
          </div>
          <div className="mt-6">
            <Link
              href={`/applicant/documents/${documentId}`}
              className="btn btn-outline"
            >
              Back to Document
            </Link>
            <Link
              href="/applicant/documents"
              className="btn btn-ghost ml-2"
            >
              Back to Documents List
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}