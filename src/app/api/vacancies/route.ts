import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Allow HR and admin to view vacancies; applicants can view published ones?
    // For simplicity, let authenticated users see all vacancies (they can see status anyway).
    const vacancies = await prisma.vacancy.findMany({
      include: {
        college: true,
        qsTemplate: true,
        createdBy: { select: { id: true, name: true, email: true } },
        hrReviewedBy: { select: { id: true, name: true } },
        vpaaEndorsedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(vacancies);
  } catch (error) {
    console.error('Error fetching vacancies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Only HR and admin can create vacancies
    if (user.role !== 'hr' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: insufficient role' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      positionTitle,
      plantillaItemNo,
      salaryGrade,
      monthlySalary,
      placeOfAssignment,
      track,
      appointmentType,
      slots,
      qsTemplateId,
      collegeId,
      status,
      publicationChannels,
      postingDate,
      closingDate,
      validityMonths,
    } = body;

    // Basic validation
    if (!positionTitle || !placeOfAssignment || !track) {
      return NextResponse.json(
        { error: 'Position title, place of assignment, and track are required' },
        { status: 400 }
      );
    }

    const vacancy = await prisma.vacancy.create({
      data: {
        positionTitle,
        plantillaItemNo,
        salaryGrade: salaryGrade ?? undefined,
        monthlySalary: monthlySalary ?? undefined,
        placeOfAssignment,
        track,
        appointmentType: appointmentType ?? 'permanent',
        slots: slots ?? 1,
        qsTemplateId: qsTemplateId ?? undefined,
        collegeId: collegeId ?? undefined,
        status: status ?? 'draft',
        createdByRole: user.role,
        createdById: user.id,
        publicationChannels: publicationChannels ?? [],
        postingDate: postingDate ?? undefined,
        closingDate: closingDate ?? undefined,
        validityMonths: validityMonths ?? undefined,
      },
      include: {
        college: true,
        qsTemplate: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(vacancy, { status: 201 });
  } catch (error) {
    console.error('Error creating vacancy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}