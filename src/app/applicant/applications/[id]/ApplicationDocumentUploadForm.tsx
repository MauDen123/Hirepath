// Client component for document upload (specific to this application)
"use client";
import * as React from 'react';
import { useRouter } from 'next/navigation';

interface ApplicationDocumentUploadFormProps {
  applicationId: string;
}

export default function ApplicationDocumentUploadForm({ applicationId }: ApplicationDocumentUploadFormProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = React.useState<string>('');
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedType || !file) {
      setError('Please select a document type and file.');
      return;
    }
    setUploading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', applicationId);
    formData.append('type', selectedType);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }
      setSuccess(true);
      // Reset form
      setSelectedType('');
      setFile(null);
      // Refresh the page to refetch data
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded">
      <h2 className="text-lg font-semibold mb-2">Upload Document for this Application</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Document Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="select w-full"
            disabled={uploading}
          >
            <option value="">Select document type</option>
            {/* Document types from enum in prisma schema */}
            <option value="pds">Personal Data Sheet (PDS)</option>
            <option value="work_experience_sheet">Work Experience Sheet</option>
            <option value="transcript_of_records">Transcript of Records</option>
            <option value="certification">Certification</option>
            <option value="eligibility">Eligibility</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">File</label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => {
              const target = e.target as HTMLInputElement;
              if (target.files && target.files[0]) {
                setFile(target.files[0]);
              }
            }}
            disabled={uploading}
            className="input w-full"
          />
          {file && (
            <p className="text-xs text-gray-500 mt-1">
              Selected file: {file.name}
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || !selectedType || !file}
            className={`btn btn-primary ${uploading ? 'opacity-50' : ''}`}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </form>
      {error && (
        <div className="mt-2 p-3 bg-red-50 rounded border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
          <p className="text-sm text-green-700">Document uploaded successfully!</p>
        </div>
      )}
    </div>
  );
}