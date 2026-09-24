import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get sort parameter from query string
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'date_desc';

    // Fetch applications for the upload form dropdown
    const applications = await prisma.application.findMany({
      where: { applicantId: user.id },
      select: {
        id: true,
        vacancy: {
          select: {
            positionTitle: true,
          },
        },
        submittedAt: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Build orderBy for documents based on sort
    let orderBy = {};
    switch (sort) {
      case 'date_desc':
        orderBy = { uploadedAt: 'desc' };
        break;
      case 'date_asc':
        orderBy = { uploadedAt: 'asc' };
        break;
      case 'type_asc':
        orderBy = { type: 'asc' };
        break;
      case 'type_desc':
        orderBy = { type: 'desc' };
        break;
      default:
        orderBy = { uploadedAt: 'desc' };
    }

    // Fetch documents for the applicant
    const documents = await prisma.document.findMany({
      where: {
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
      orderBy: orderBy,
    });

    return NextResponse.json({
      user,
      applications,
      documents,
    });
  } catch (error) {
    console.error('Error fetching applicant data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}