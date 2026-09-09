"use client";
import { useRouter } from 'next/navigation';
import {
  ChangeEvent,
  FormEvent,
  useState,
  useEffect,
  useRef,
} from 'react';

interface CollegeOption {
  id: string;
  name: string;
}
interface QSTemplateOption {
  id: string;
  positionTitle: string;
  salaryGrade: number;
}
// This is the shape of the vacancy as we will use in the form (all numbers as strings for input)
interface FormVacancy {
  id: string;
  positionTitle: string;
  plantillaItemNo: string | null;
  salaryGrade: string | null; // string representation of the number or null
  monthlySalary: string | null; // string representation of the number or null
  placeOfAssignment: string;
  track: string;
  appointmentType: string;
  slots: string | null; // string representation of the number or null
  qsTemplateId: string | null;
  collegeId: string | null;
  status: string;
  publicationChannels: string[];
  postingDate: string | null; // YYYY-MM-DD string or null
  closingDate: string | null; // YYYY-MM-DD string or null
  validityMonths: string | null; // string representation of the number or null
  createdBy: { id: string; name: string } | null;
}

interface VacancyFormProps {
  vacancy: FormVacancy;
  colleges: CollegeOption[];
  qsTemplates: QSTemplateOption[];
}

function VacancyForm({
  vacancy,
  colleges,
  qsTemplates,
}: VacancyFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    positionTitle: vacancy.positionTitle,
    plantillaItemNo: vacancy.plantillaItemNo ?? '',
    salaryGrade: vacancy.salaryGrade ?? '',
    monthlySalary: vacancy.monthlySalary ?? '',
    placeOfAssignment: vacancy.placeOfAssignment,
    track: vacancy.track,
    appointmentType: vacancy.appointmentType,
    slots: vacancy.slots ?? '',
    qsTemplateId: vacancy.qsTemplateId ?? '',
    collegeId: vacancy.collegeId ?? '',
    status: vacancy.status,
    publicationChannels: vacancy.publicationChannels,
    postingDate: vacancy.postingDate ?? '',
    closingDate: vacancy.closingDate ?? '',
    validityMonths: vacancy.validityMonths ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const vacancyIdRef = useRef<string>(vacancy.id);

  useEffect(() => {
    // If vacancy id changes (shouldn't), but just in case
    vacancyIdRef.current = vacancy.id;
  }, [vacancy]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
          ? [...prev.publicationChannels, value]
          : prev.publicationChannels.filter(c => c !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/vacancies/${vacancyIdRef.current}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Convert string values to numbers or null for number fields
          salaryGrade: formData.salaryGrade === '' ? null : parseInt(formData.salaryGrade, 10),
          monthlySalary: formData.monthlySalary === '' ? null : parseFloat(formData.monthlySalary),
          slots: formData.slots === '' ? null : parseInt(formData.slots, 10),
          validityMonths: formData.validityMonths === '' ? null : parseInt(formData.validityMonths, 10),
          publicationChannels: formData.publicationChannels,
          postingDate: formData.postingDate
            ? new Date(formData.postingDate)
            : undefined,
          closingDate: formData.closingDate
            ? new Date(formData.closingDate)
            : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to update vacancy');
      }
      setSuccess(true);
      setError(null);
      // Optionally redirect after delay
      setTimeout(() => {
        router.refresh(); // or router.push(`/vacancies/${vacancyIdRef.current}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message ?? 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="block text-sm font-medium mb-1">Position Title *</label>
          <input
            type="text"
            name="positionTitle"
            value={formData.positionTitle}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Plantilla Item No.</label>
          <input
            type="text"
            name="plantillaItemNo"
            value={formData.plantillaItemNo}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Salary Grade *</label>
          <input
            type="number"
            name="salaryGrade"
            value={formData.salaryGrade}
            onChange={handleChange}
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
            value={formData.monthlySalary}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Place of Assignment *</label>
          <input
            type="text"
            name="placeOfAssignment"
            value={formData.placeOfAssignment}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Track *</label>
          <select
            name="track"
            value={formData.track}
            onChange={handleChange}
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
            value={formData.appointmentType}
            onChange={handleChange}
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
            value={formData.slots}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Qualification Standard (Optional)</label>
          <select
            name="qsTemplateId"
            value={formData.qsTemplateId}
            onChange={handleChange}
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
            value={formData.collegeId}
            onChange={handleChange}
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
            value={formData.status}
            onChange={handleChange}
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
                checked={formData.publicationChannels.includes('website')}
                onChange={handleChange}
                className="checkbox checkbox-primary"
              />
              Website
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="publicationChannels"
                value="csc"
                checked={formData.publicationChannels.includes('csc')}
                onChange={handleChange}
                className="checkbox checkbox-primary"
              />
              CSC Bulletin
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="publicationChannels"
                value="bulletin"
                checked={formData.publicationChannels.includes('bulletin')}
                onChange={handleChange}
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
            value={formData.postingDate}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Closing Date</label>
          <input
            type="date"
            name="closingDate"
            value={formData.closingDate}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Validity Months</label>
          <input
            type="number"
            name="validityMonths"
            value={formData.validityMonths}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
      {success && (
        <p className="text-sm text-success">
          Vacancy updated successfully! Refreshing...
        </p>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-ghost"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Updating...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

export default VacancyForm;