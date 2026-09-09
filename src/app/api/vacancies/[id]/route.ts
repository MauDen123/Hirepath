import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await context.params;
    const vacancy = await prisma.vacancy.findUnique({
      where: { id },
      include: {
        college: true,
        qsTemplate: true,
        createdBy: { select: { id: true, name: true, email: true } },
        hrReviewedBy: { select: { id: true, name: true } },
        vpaaEndorsedBy: { select: { id: true, name: true } },
        applications: { include: { applicant: true } },
      },
    });
    if (!vacancy) {
      return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });
    }
    return NextResponse.json(vacancy);
  } catch (error) {
    console.error('Error fetching vacancy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'hr' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: insufficient role' },
        { status: 403 }
      );
    }
    const { id } = await context.params;
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
      hrReviewNotes,
      hrReviewedById,
      vpaaEndorsedById,
      presidentApprovedAt,
      boardConfirmedAt,
      approvalDocumentRef,
    } = body;

    const data: any = {};
    if (positionTitle !== undefined) data.positionTitle = positionTitle;
    if (plantillaItemNo !== undefined) data.plantillaItemNo = plantillaItemNo;
    if (salaryGrade !== undefined) data.salaryGrade = salaryGrade;
    if (monthlySalary !== undefined) data.monthlySalary = monthlySalary;
    if (placeOfAssignment !== undefined) data.placeOfAssignment = placeOfAssignment;
    if (track !== undefined) data.track = track;
    if (appointmentType !== undefined) data.appointmentType = appointmentType;
    if (slots !== undefined) data.slots = slots;
    if (qsTemplateId !== undefined) data.qsTemplateId = qsTemplateId;
    if (collegeId !== undefined) data.collegeId = collegeId;
    if (status !== undefined) data.status = status;
    if (publicationChannels !== undefined) data.publicationChannels = publicationChannels;
    if (postingDate !== undefined) data.postingDate = postingDate;
    if (closingDate !== undefined) data.closingDate = closingDate;
    if (validityMonths !== undefined) data.validityMonths = validityMonths;
    if (hrReviewNotes !== undefined) data.hrReviewNotes = hrReviewNotes;
    if (hrReviewedById !== undefined) data.hrReviewedById = hrReviewedById;
    if (vpaaEndorsedById !== undefined) data.vpaaEndorsedById = vpaaEndorsedById;
    if (presidentApprovedAt !== undefined) data.presidentApprovedAt = presidentApprovedAt;
    if (boardConfirmedAt !== undefined) data.boardConfirmedAt = boardConfirmedAt;
    if (approvalDocumentRef !== undefined) data.approvalDocumentRef = approvalDocumentRef;
    data.updatedAt = new Date();

    const vacancy = await prisma.vacancy.update({
      where: { id },
      data,
      include: {
        college: true,
        qsTemplate: true,
        createdBy: { select: { id: true, name: true, email: true } },
        hrReviewedBy: { select: { id: true, name: true } },
        vpaaEndorsedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(vacancy);
  } catch (error) {
    console.error('Error updating vacancy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'hr' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: insufficient role' },
        { status: 403 }
      );
    }
    const { id } = await context.params;
    await prisma.vacancy.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vacancy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}