import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import VacancyForm from './form';

export default async function VacancyEditPage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = await getCurrentUser(undefined);
  if (!user) {
    return notFound();
  }
  if (user.role !== 'hr' && user.role !== 'admin') {
    return notFound();
  }

  const vacancyId = params.id;

  // Fetch vacancy and reference data
  const [vacancyRaw, colleges, qsTemplates] = await Promise.all([
    prisma.vacancy.findUnique({
      where: { id: vacancyId },
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
        qsTemplateId: true,
        collegeId: true,
        status: true,
        publicationChannels: true,
        postingDate: true,
        closingDate: true,
        validityMonths: true,
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.college.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.qSTemplate.findMany({
      select: { id: true, positionTitle: true, salaryGrade: true },
      orderBy: { positionTitle: 'asc' },
    }),
  ]);

  if (!vacancyRaw) {
    return notFound();
  }

  // Convert the Prisma vacancy object to the form-friendly shape
  // where numbers are converted to strings (or null) for the form inputs.
  const vacancy = {
    id: vacancyRaw.id,
    positionTitle: vacancyRaw.positionTitle,
    plantillaItemNo: vacancyRaw.plantillaItemNo,
    salaryGrade: vacancyRaw.salaryGrade !== null ? vacancyRaw.salaryGrade.toString() : null,
    monthlySalary: vacancyRaw.monthlySalary ? vacancyRaw.monthlySalary.toString() : null,
    placeOfAssignment: vacancyRaw.placeOfAssignment,
    track: vacancyRaw.track,
    appointmentType: vacancyRaw.appointmentType,
    slots: vacancyRaw.slots !== null ? vacancyRaw.slots.toString() : null,
    qsTemplateId: vacancyRaw.qsTemplateId,
    collegeId: vacancyRaw.collegeId,
    status: vacancyRaw.status,
    publicationChannels: vacancyRaw.publicationChannels,
    postingDate: vacancyRaw.postingDate
      ? vacancyRaw.postingDate.toISOString().split('T')[0]
      : null,
    closingDate: vacancyRaw.closingDate
      ? vacancyRaw.closingDate.toISOString().split('T')[0]
      : null,
    validityMonths: vacancyRaw.validityMonths !== null ? vacancyRaw.validityMonths.toString() : null,
    createdBy: vacancyRaw.createdBy
      ? { id: vacancyRaw.createdBy.id, name: vacancyRaw.createdBy.name }
      : null,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Edit Vacancy</h1>
        <Link href={`/vacancies/${vacancyId}`} className="btn btn-ghost">
          ← Back to Vacancy
        </Link>
      </div>

      <VacancyForm
        vacancy={vacancy}
        colleges={colleges}
        qsTemplates={qsTemplates}
      />
    </div>
  );
}