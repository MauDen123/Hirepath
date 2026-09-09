import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function VacanciesCreatePage() {
  const user = await getCurrentUser(undefined);
  if (!user) {
    return notFound();
  }
  if (user.role !== 'hr' && user.role !== 'admin') {
    return notFound();
  }

  // Fetch reference data for dropdowns
  const colleges = await prisma.college.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  const qsTemplates = await prisma.qSTemplate.findMany({
    select: { id: true, positionTitle: true, salaryGrade: true },
    orderBy: { positionTitle: 'asc' },
  });

  // Server action to handle form submission
  async function createVacancy(formData: FormData) {
    "use server";
    // Parse form data
    const positionTitle = formData.get('positionTitle') as string;
    const plantillaItemNo = formData.get('plantillaItemNo') as string || null;
    const salaryGradeString = formData.get('salaryGrade') as string;
    const salaryGrade = parseInt(salaryGradeString, 10); // required field (may be NaN if invalid)
    const monthlySalaryString = formData.get('monthlySalary') as string;
    const monthlySalary = parseFloat(monthlySalaryString); // may be NaN if invalid
    const placeOfAssignment = formData.get('placeOfAssignment') as string;
    const track = (formData.get('track') as 'faculty' | 'administrative') ?? 'faculty';
    const appointmentType = (formData.get('appointmentType') as
      | 'permanent'
      | 'temporary'
      | 'cos') ?? 'permanent';
    const slotsString = formData.get('slots') as string;
    const slots = slotsString ? parseInt(slotsString, 10) : 1;
    const qsTemplateId = formData.get('qsTemplateId') as string || null;
    const collegeId = formData.get('collegeId') as string || null;
    const status = (formData.get('status') as
      | 'draft'
      | 'pending_hr_review'
      | 'returned'
      | 'awaiting_vpaa_endorsement'
      | 'awaiting_president_approval'
      | 'awaiting_board_confirmation'
      | 'published'
      | 'closed') ?? 'draft';
    const publicationChannels = formData.getAll('publicationChannels') as string[];
    const postingDate = formData.get('postingDate')
      ? new Date(formData.get('postingDate') as string)
      : undefined;
    const closingDate = formData.get('closingDate')
      ? new Date(formData.get('closingDate') as string)
      : undefined;
    const validityMonths = formData.get('validityMonths')
      ? parseInt(formData.get('validityMonths') as string, 10)
      : undefined;

    // Basic validation
    if (!positionTitle || !placeOfAssignment) {
      // We'll just return and let the form reload; in a real app we'd show an error.
      return;
    }
    // We expect salaryGrade to be provided because the input is required.
    // If it's not a valid number, we'll let Prisma handle the validation error.

    try {
      await prisma.vacancy.create({
        data: {
          positionTitle,
          plantillaItemNo,
          salaryGrade: salaryGrade, // required field, parsed as number
          monthlySalary,
          placeOfAssignment,
          track,
          appointmentType,
          slots,
          qsTemplateId: qsTemplateId ?? undefined,
          collegeId: collegeId ?? undefined,
          status,
          createdByRole: user!.role,
          createdById: user!.id,
          publicationChannels,
          postingDate,
          closingDate,
          validityMonths,
        },
      });
    } catch (error) {
      console.error('Error creating vacancy:', error);
      // In a real app, we'd surface error; for now, just redirect.
    }

    // Redirect to vacancies list after creation
    redirect('/vacancies');
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Create Vacancy</h1>
        <Link href="/vacancies" className="btn btn-ghost">
          ← Back to Vacancies
        </Link>
      </div>

      <form action={createVacancy} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-1">Position Title *</label>
            <input
              type="text"
              name="positionTitle"
              className="input input-bordered w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Plantilla Item No.</label>
            <input
              type="text"
              name="plantillaItemNo"
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Salary Grade *</label>
            <input
              type="number"
              name="salaryGrade"
              className="input input-bordered w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Monthly Salary</label>
            <input
              type="number"
              step="0.01"
              name="monthlySalary"
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Place of Assignment *</label>
            <input
              type="text"
              name="placeOfAssignment"
              className="input input-bordered w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Track *</label>
            <select
              name="track"
              className="select select-bordered w-full"
            >
              <option value="faculty">Faculty</option>
              <option value="administrative">Administrative</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Appointment Type</label>
            <select
              name="appointmentType"
              className="select select-bordered w-full"
            >
              <option value="permanent">Permanent</option>
              <option value="temporary">Temporary</option>
              <option value="cos">Contract of Service</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Number of Slots</label>
            <input
              type="number"
              name="slots"
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Qualification Standard (Optional)</label>
            <select
              name="qsTemplateId"
              className="select select-bordered w-full"
            >
              <option value="">None</option>
              {qsTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.positionTitle} (SG {t.salaryGrade})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">College (Optional, for faculty)</label>
            <select
              name="collegeId"
              className="select select-bordered w-full"
            >
              <option value="">None</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              className="select select-bordered w-full"
            >
              <option value="draft">Draft</option>
              <option value="pending_hr_review">Pending HR Review</option>
              <option value="returned">Returned</option>
              <option value="awaiting_vpaa_endorsement">
                Awaiting VPAA Endorsement
              </option>
              <option value="awaiting_president_approval">
                Awaiting President Approval
              </option>
              <option value="awaiting_board_confirmation">
                Awaiting Board Confirmation
              </option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="col-span-full">
            <label className="block text-sm font-medium mb-1">
              Publication Channels (check all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="publicationChannels"
                  value="website"
                  className="checkbox checkbox-primary"
                />
                Website
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="publicationChannels"
                  value="csc"
                  className="checkbox checkbox-primary"
                />
                CSC Bulletin
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="publicationChannels"
                  value="bulletin"
                  className="checkbox checkbox-primary"
                />
                Physical Bulletin Board
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Posting Date</label>
            <input
              type="date"
              name="postingDate"
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Closing Date</label>
            <input
              type="date"
              name="closingDate"
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Validity Months</label>
            <input
              type="number"
              name="validityMonths"
              className="input input-bordered w-full"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create Vacancy
          </button>
        </div>
      </form>
    </div>
  );
}