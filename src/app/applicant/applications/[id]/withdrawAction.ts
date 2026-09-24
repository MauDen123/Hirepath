"use server";
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const withdrawApplication = async (formData: FormData) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }
    const applicationId = formData.get('applicationId') as string;
    if (!applicationId) {
      throw new Error('Application ID is required');
    }
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!application || application.applicantId !== user.id) {
      throw new Error('Application not found or access denied');
    }
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'not_selected',
        pscOutcome: 'withdrew',
      },
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    throw new Error('Failed to withdraw application');
  }
};