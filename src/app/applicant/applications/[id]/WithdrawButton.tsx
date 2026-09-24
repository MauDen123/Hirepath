"use client";
import * as React from 'react';
import Link from 'next/link';
import { withdrawApplication } from './withdrawAction';

interface WithdrawButtonProps {
  applicationId: string;
  status: string;
  pscOutcome: string | null;
}

export default function WithdrawButton({ applicationId, status, pscOutcome }: WithdrawButtonProps) {
  const [withdrawing, setWithdrawing] = React.useState(false);
  const [withdrawError, setWithdrawError] = React.useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = React.useState(false);

  const handleWithdraw = async () => {
    if (window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      setWithdrawing(true);
      setWithdrawError(null);
      setWithdrawSuccess(false);
      try {
        const formData = new FormData();
        formData.append('applicationId', applicationId);
        await withdrawApplication(formData);
        setWithdrawSuccess(true);
      } catch (err: any) {
        setWithdrawError(err.message || 'Failed to withdraw application');
      } finally {
        setWithdrawing(false);
      }
    }
  };

  // If already withdrawn, show success message and hide button
  if (withdrawSuccess) {
    return <p className="text-sm text-green-700">Application withdrawn successfully.</p>;
  }

  // If already withdrawn via pscOutcome/status, hide button and show message
  if (status === 'not_selected' && pscOutcome === 'withdrew') {
    return <p className="text-sm text-green-700">Application withdrawn successfully.</p>;
  }

  return (
    <>
      {withdrawError && (
        <p className="text-sm text-red-700">{withdrawError}</p>
      )}
      <Link href="/applicant/applications" className="btn btn-ghost">
        Back to Applications
      </Link>
      {!withdrawing && (
        <button
          onClick={handleWithdraw}
          disabled={withdrawing}
          className={`btn btn-outline ${withdrawing ? 'opacity-50' : ''}`}
        >
          {withdrawing ? 'Withdrawing...' : 'Withdraw Application'}
        </button>
      )}
    </>
  );
}