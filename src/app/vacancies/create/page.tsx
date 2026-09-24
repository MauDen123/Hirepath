import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function VacanciesCreatePage() {
  const user = await getCurrentUser(undefined);
  if (!user) {
    notFound();
  }
  if (user.role !== 'hr' && user.role !== 'admin' && user.role !== 'dean') {
    notFound();
  }

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
    let track = (formData.get('track') as 'faculty' | 'administrative') ?? 'faculty';
    const appointmentType = (formData.get('appointmentType') as
      | 'permanent'
      | 'temporary'
      | 'cos') ?? 'permanent';
    const slotsString = formData.get('slots') as string;
    const slots = slotsString ? parseInt(slotsString, 10) : 1;
    const qsTemplateId = formData.get('qsTemplateId') as string || null;
    let collegeId = formData.get('collegeId') as string || null;

    // SILENT FAILURE FIX: Validate numeric fields before proceeding
    if (isNaN(salaryGrade)) {
      redirect('/vacancies/create?error=Invalid+salary+grade');
      return;
    }
    // monthlySalary is optional, but if provided, should be valid
    if (monthlySalaryString && isNaN(monthlySalary)) {
      redirect('/vacancies/create?error=Invalid+monthly+salary');
      return;
    }

    // FUNCTIONAL GAP FIX: Enforce Dean → HR → VPAA workflow
    let status: 'pending_hr_review' | 'draft';
    if (user.role === 'dean') {
      // Dean creates → status: 'pending_hr_review', track: 'faculty', collegeId forced to Dean's own college
      status = 'pending_hr_review';
      track = 'faculty';
      collegeId = user.collegeId; // Force to Dean's own college
    } else {
      // HR/Admin creates → status: 'draft'
      status = 'draft';
      // Note: HR/Admin can still select track and collegeId from form (for administrative vacancies)
    }

    const publicationChannels = formData.getAll('publicationChannels') as string[];
    const postingDate = formData.get('postingDate')
      ? new Date(formData.get('postingDate') as string)
      : undefined;
    const closingDate = formData.get('closingDate')
      ? new Date(formData.get('closingDate') as string)
      : undefined;
    const validityMonthsString = formData.get('validityMonths') as string;
    const validityMonths = validityMonthsString
      ? parseInt(validityMonthsString, 10)
      : undefined;

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
          createdByRole: user.role,
          createdById: user.id,
          publicationChannels,
          postingDate,
          closingDate,
          validityMonths,
        },
      });
    } catch (error) {
      console.error('Error creating vacancy:', error);
      // Redirect back to form with error message
      redirect('/vacancies/create?error=Failed+to+create+vacancy');
      return;
    }

    // Redirect to vacancies list after successful creation
    redirect('/vacancies?success=Vacancy+created+successfully');
  }

  return (
    <div className="app-shell">
      {/* TODO: Implement proper sidebar for vacancies create page */}
      <main className="main p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold">Create New Vacancy</h1>
            <Link href="/vacancies" className="btn btn-outline">
              Vacancies List
            </Link>
          </div>

          <form action={createVacancy} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <label className="block text-sm font-medium mb-1">Position Title *</label>
                <input
                  type="text"
                  name="positionTitle"
                  className="input w-full"
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium mb-1">Plantilla Item No.</label>
                <input
                  type="text"
                  name="plantillaItemNo"
                  className="input w-full"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium mb-1">Salary Grade *</label>
                <input
                  type="number"
                  name="salaryGrade"
                  className="input w-full"
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium mb-1">Monthly Salary (PHP)</label>
                <input
                  type="number"
                  name="monthlySalary"
                  className="input w-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">Place of Assignment *</label>
              <input
                type="text"
                name="placeOfAssignment"
                className="input w-full"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <label className="block text-sm font-medium mb-1">Track *</label>
                <select
                  name="track"
                  className="select w-full"
                >
                  <option value="faculty">Faculty</option>
                  <option value="administrative">Administrative</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium mb-1">Appointment Type</label>
                <select
                  name="appointmentType"
                  className="select w-full"
                >
                  <option value="permanent">Permanent</option>
                  <option value="temporary">Temporary</option>
                  <option value="cos">Contract of Service</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">Number of Slots *</label>
              <input
                type="number"
                name="slots"
                className="input w-full"
                value="1"
                min="1"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">Qualification Standard (Optional)</label>
              <select
                name="qsTemplateId"
                className="select w-full"
              >
                <option value="">None</option>
                {/* These would be populated from actual data in a real implementation */}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">College (Optional, for faculty)</label>
              <select
                name="collegeId"
                className="select w-full"
              >
                <option value="">None</option>
                {/* These would be populated from actual data in a real implementation */}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">PublicationChannels (Optional)</label>
              <div className="space-y-2">
                {/* These would be checkboxes populated from actual data in a real implementation */}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <label className="block text-sm font-medium mb-1">Posting Date</label>
                <input
                  type="date"
                  name="postingDate"
                  className="input w-full"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium mb-1">Closing Date</label>
                <input
                  type="date"
                  name="closingDate"
                  className="input w-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">Validity Months</label>
              <input
                type="number"
                name="validityMonths"
                className="input w-full"
              />
            </div>

            {/* STATUS FIELD REMOVED PER FIX #6 - Status is now set automatically based on user role */}
            {/* Dean → pending_hr_review, HR/Admin → draft */}

            <div className="flex justify-end space-x-3">
              <Link href="/vacancies" className="btn btn-outline">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary">
                Create Vacancy
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}