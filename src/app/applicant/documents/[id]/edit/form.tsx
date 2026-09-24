'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

interface DocumentFormProps {
  document: {
    id: string;
    type: string;
    verificationStatus: string;
    fileUrl: string; // we need fileUrl to show current document? but not required for form
    application: {
      vacancy: {
        positionTitle: string;
      };
    };
  };
}

export default function DocumentForm({ document }: DocumentFormProps) {
  const router = useRouter();
  const [type, setType] = React.useState<string>(document.type);
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<boolean>(false);

  const DocumentTypeOptions = [
    { value: 'pds', label: 'Personal Data Sheet (PDS)' },
    { value: 'work_experience_sheet', label: 'Work Experience Sheet' },
    { value: 'transcript_of_records', label: 'Transcript of Records' },
    { value: 'certification', label: 'Certification' },
    { value: 'eligibility', label: 'Eligibility' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('type', type);

      if (file) {
        formData.append('file', file);
      }

      const res = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        body: formData,
        // Note: Don't set Content-Type header, let the browser set it for multipart/form-data
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update document');
      }

      setSuccess(true);
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Document Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="select select-bordered w-full"
          disabled={loading}
        >
          <option value="">Select document type</option>
          {DocumentTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Re-upload Document (Optional)</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setFile(e.target.files[0]);
            } else {
              setFile(null);
            }
          }}
          className="file-input file-input-bordered w-full"
          disabled={loading}
        />
        {file && (
          <p className="mt-2 text-sm text-muted-foreground">
            Selected file: {file.name}
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-700">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-700">
          Document updated successfully!
        </p>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-outline"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Updating...' : 'Update Document'}
        </button>
      </div>
    </form>
  );
}
