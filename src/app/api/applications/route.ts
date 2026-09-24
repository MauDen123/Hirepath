import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Only applicants can create applications
    if (user.role !== 'applicant') {
      return NextResponse.json(
        { error: 'Forbidden: only applicants can apply' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { vacancyId } = body;

    if (!vacancyId) {
      return NextResponse.json(
        { error: 'Vacancy ID is required' },
        { status: 400 }
      );
    }

    // Verify vacancy exists and is published
    const vacancy = await prisma.vacancy.findUnique({
      where: { id: vacancyId },
      select: { id: true, status: true },
    });

    if (!vacancy) {
      return NextResponse.json(
        { error: 'Vacancy not found' },
        { status: 404 }
      );
    }
    if (vacancy.status !== 'published') {
      return NextResponse.json(
        { error: 'Cannot apply to vacancy that is not published' },
        { status: 400 }
      );
    }

    // Create application (unique constraint on applicantId + vacancyId will prevent duplicates)
    const application = await prisma.application.create({
      data: {
        applicantId: user.id,
        vacancyId,
        status: 'submitted',
      },
      include: {
        vacancy: {
          select: {
            id: true,
            positionTitle: true,
            college: { select: { name: true } },
          },
        },
      },
    });

    // Automatically copy existing documents from applicant's other applications to the new application
    const existingDocuments = await prisma.document.findMany({
      where: {
        application: {
          applicantId: user.id,
          id: {
            not: application.id
          }
        }
      },
      select: {
        type: true,
        fileUrl: true,
        // Note: verificationStatus defaults to 'pending' in the schema
        // parsedData and parsingConfidence are optional
      }
    });

    // Copy each document to the new application
    if (existingDocuments.length > 0) {
      await prisma.document.createMany({
        data: existingDocuments.map(doc => ({
          type: doc.type,
          fileUrl: doc.fileUrl,
          applicationId: application.id,
          // verificationStatus will default to 'pending' as per schema
          // parsedData and parsingConfidence will be null/undefined
        }))
      });

      // Refetch the application with documents to return updated data
      const updatedApplication = await prisma.application.findUnique({
        where: { id: application.id },
        include: {
          vacancy: {
            select: {
              id: true,
              positionTitle: true,
              college: { select: { name: true } },
            },
          },
          documents: true,
        },
      });

      return NextResponse.json(updatedApplication, { status: 201 });
    }

    return NextResponse.json(application, { status: 201 });
  } catch (error: any) {
    // Handle unique constraint error (duplicate application)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already applied to this vacancy' },
        { status: 409 }
      );
    }
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}