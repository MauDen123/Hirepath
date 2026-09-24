"use client";

import * as React from 'react';

interface KraSectionProps {
  title: string;
  subtitle: string;
  fields: Array<{
    label: string;
    name: keyof CrrcEvaluationFormData;
    maxPoints: number;
    description?: string;
  }>;
  data: CrrcEvaluationFormData;
  onChange: (name: keyof CrrcEvaluationFormData, value: number | null) => void;
}

interface CrrcEvaluationFormData {
  // KRA I - Instruction (max 100 points)
  kra1TeachingEffectiveness?: number | null; // max 60 (Student Evaluation 60% + Supervisor's Evaluation 40%)
  kra1CurriculumMaterials?: number | null; // max 30
  kra1SpecialProjects?: number | null; // max 10

  // KRA II - Research, Innovation, and/or Creative Work (max 100 points)
  kra2ResearchOutputs?: number | null; // max 100
  kra2Inventions?: number | null; // max 100
  kra2CreativeWorks?: number | null; // max 100

  // KRA III - Extension Services (max 100 points)
  kra3ServiceToInstitution?: number | null; // max 30
  kra3ServiceToCommunity?: number | null; // max 50
  kra3QualityOfService?: number | null; // max 20
  kra3Bonus?: number | null; // max 20, additive

  // KRA IV - Professional Development (max 100 points)
  kra4ProfessionalOrgs?: number | null; // max 20
  kra4ContinuingDevelopment?: number | null; // max 60
  kra4AwardsRecognition?: number | null; // max 20
  kra4NewHireBonus?: number | null; // max 20, newly hired faculty only
}

interface ScoreFormProps {
  applicationId: string;
  initialData: CrrcEvaluationFormData | null;
  onUpdate: (data: CrrcEvaluationFormData) => Promise<void>;
}

export default function ScoreForm({ applicationId, initialData, onUpdate }: ScoreFormProps) {
  const [formData, setFormData] = React.useState<CrrcEvaluationFormData>(initialData ?? {});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<boolean>(false);

  // Calculate KRA totals
  const kra1Total = React.useMemo(() => {
    return ((formData.kra1TeachingEffectiveness ?? 0) +
            (formData.kra1CurriculumMaterials ?? 0) +
            (formData.kra1SpecialProjects ?? 0));
  }, [formData]);

  const kra2Total = React.useMemo(() => {
    // For v1, using simple sum (to be updated with proper Annex I rules)
    return (formData.kra2ResearchOutputs ?? 0) +
           (formData.kra2Inventions ?? 0) +
           (formData.kra2CreativeWorks ?? 0);
  }, [formData]);

  const kra3Total = React.useMemo(() => {
    return (formData.kra3ServiceToInstitution ?? 0) +
           (formData.kra3ServiceToCommunity ?? 0) +
           (formData.kra3QualityOfService ?? 0) +
           (formData.kra3Bonus ?? 0);
  }, [formData]);

  const kra4Total = React.useMemo(() => {
    return (formData.kra4ProfessionalOrgs ?? 0) +
           (formData.kra4ContinuingDevelopment ?? 0) +
           (formData.kra4AwardsRecognition ?? 0) +
           (formData.kra4NewHireBonus ?? 0);
  }, [formData]);

  const finalScore = React.useMemo(() => {
    // For v1, using simple average of KRA totals
    // This should be updated with proper rank-based weighting when available
    return (kra1Total + kra2Total + kra3Total + kra4Total) / 4;
  }, [kra1Total, kra2Total, kra3Total, kra4Total]);

  const handleFieldChange = (name: keyof CrrcEvaluationFormData, value: number | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onUpdate(formData);
      setSuccess(true);
      // Optionally reset form or show success message
    } catch (err) {
      setError('Failed to save CRRC evaluation. Please try again.');
      console.error('Error saving CRRC evaluation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Header */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">CRRC Evaluation Form</h2>
        <p className="text-xs text-gray-500">
          CRRC (College Retention and Recruitment) evaluation for faculty track positions.
          Scores are calculated across four Key Result Areas (KRAs), each worth up to 100 points.
        </p>

        {/* Current Scores Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">KRA I: Instruction</p>
            <p className="text-2xl font-bold">{kra1Total.toFixed(1)} / 100</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">KRA II: Research</p>
            <p className="text-2xl font-bold">{kra2Total.toFixed(1)} / 100</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">KRA III: Extension</p>
            <p className="text-2xl font-bold">{kra3Total.toFixed(1)} / 100</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">KRA IV: Prof. Dev.</p>
            <p className="text-2xl font-bold">{kra4Total.toFixed(1)} / 100</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-gray-500">Final Score</p>
          <p className="text-3xl font-bold text-blue-600">{finalScore.toFixed(1)} / 100</p>
        </div>
      </div>

      {/* KRA Sections */}
      <div className="space-y-6">
        {/* KRA I - Instruction */}
        <KraSection
          title="KRA I - Instruction (Max: 100 points)"
          subtitle="Teaching effectiveness, curriculum materials, and special projects"
          fields=[
            {
              label: "Teaching Effectiveness",
              name: "kra1TeachingEffectiveness",
              maxPoints: 60,
              description: "Student Evaluation (60%) + Supervisor's Evaluation (40%)"
            },
            {
              label: "Curriculum and Instructional Materials Developed",
              name: "kra1CurriculumMaterials",
              maxPoints: 30,
              description: "Sole author of textbook: 30 pts / co-author: % contribution"
            },
            {
              label: "Special Projects/Capstone/Thesis Supervision",
              name: "kra1SpecialProjects",
              maxPoints: 10,
              description: "Special projects, capstone projects, thesis/dissertation supervision"
            }
          ]
          data={formData}
          onChange={handleFieldChange}
        />

        {/* KRA II - Research, Innovation, and/or Creative Work */}
        <KraSection
          title="KRA II - Research, Innovation, and/or Creative Work (Max: 100 points)"
          subtitle="Research outputs, inventions, and creative works"
          fields=[
            {
              label: "Research Outputs Published",
              name: "kra2ResearchOutputs",
              maxPoints: 100,
              description: "Detailed breakdown per publication tier (see Annex I)"
            },
            {
              label: "Inventions",
              name: "kra2Inventions",
              maxPoints: 100,
              description: "Patents, utility models, industrial designs"
            },
            {
              label: "Creative Works",
              name: "kra2CreativeWorks",
              maxPoints: 100,
              description: "Artistic, literary, musical, dramatic works"
            }
          ]
          data={formData}
          onChange={handleFieldChange}
        />

        {/* KRA III - Extension Services */}
        <KraSection
          title="KRA III - Extension Services (Max: 100 points)"
          subtitle="Service to institution, community, quality, and bonus"
          fields=[
            {
              label: "Service to the Institution",
              name: "kra3ServiceToInstitution",
              maxPoints: 30,
              description: "Committee work, administrative roles, institutional service"
            },
            {
              label: "Service to the Community",
              name: "kra3ServiceToCommunity",
              maxPoints: 50,
              description: "Community outreach, public service, volunteer work"
            },
            {
              label: "Quality of Extension Services",
              name: "kra3QualityOfService",
              maxPoints: 20,
              description: "Impact, sustainability, innovation of extension work"
            },
            {
              label: "Bonus Criterion",
              name: "kra3Bonus",
              maxPoints: 20,
              description: "Additional points for exceptional extension work (additive)"
            }
          ]
          data={formData}
          onChange={handleFieldChange}
        />

        {/* KRA IV - Professional Development */}
        <KraSection
          title="KRA IV - Professional Development (Max: 100 points)"
          subtitle="Professional organizations, continuing development, awards"
          fields=[
            {
              label: "Involvement in Professional Organizations",
              name: "kra4ProfessionalOrgs",
              maxPoints: 20,
              description: "Membership, leadership, participation in professional orgs"
            },
            {
              label: "Continuing Development",
              name: "kra4ContinuingDevelopment",
              maxPoints: 60,
              description: "Advanced degrees, training, seminars, conferences"
            },
            {
              label: "Awards and Recognition",
              name: "kra4AwardsRecognition",
              maxPoints: 20,
              description: "Local, national, international awards and honors"
            },
            {
              label: "Bonus Indicators for Newly Hired Faculty",
              name: "kra4NewHireBonus",
              maxPoints: 20,
              description: "Prior academic/service experience (only for newly hired faculty)"
            }
          ]
          data={formData}
          onChange={handleFieldChange}
        />
      </div>

      {/* Form Footer */}
      <div className="space-y-4">
        {initialData !== null && (
          <div className="bg-blue-50 p-4 rounded">
            <p className="font-medium">Last Updated:</p>
            <p className="text-sm text-gray-500">{new Date().toLocaleString()}</p>
          </div>
        )}

        {error && (
          <div className="mt-2 p-3 bg-red-50 rounded border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
            <p className="text-sm text-green-700">Evaluation saved successfully!</p>
          </div>
        )}

        <div className="mt-4">
          <button
            type="submit"
            className={`btn btn-primary w-full ${isSubmitting ? 'opacity-50' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving Evaluation...' : 'Save CRRC Evaluation'}
          </button>
        </div>
      </div>
    </form>
  );
}

// Helper component for KRA sections
function KraSection({
  title,
  subtitle,
  fields,
  data,
  onChange
}: KraSectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      <div className="px-4 py-4 space-y-3">
        {fields.map((field, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <label className="block text-sm font-medium mb-1">{field.label}</label>
                {field.description && (
                  <p className="text-xs text-gray-500">{field.description}</p>
                )}
              </div>
              <div className="w-20">
                <input
                  type="number"
                  min="0"
                  max={field.maxPoints}
                  step="0.01"
                  value={data[field.name] ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseFloat(e.target.value);
                    onChange(field.name, value);
                  }}
                  className="input input-bordered w-full"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <span className="mr-2">Max:</span>
              <span className="font-medium">{field.maxPoints} points</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}