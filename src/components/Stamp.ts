'use client';

import { useEffect, useState } from 'react';
import React from 'react';

export type StampVariant = 'pending' | 'approved' | 'flagged';

export default function Stamp({
  variant,
  children,
}: {
  variant: StampVariant;
  children: React.ReactNode;
}) {
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLanded(true), 120);
    return () => clearTimeout(t);
  }, []);

  return React.createElement(
    'span',
    { className: `stamp ${variant}${landed ? ' stamp-in' : ''}` },
    children
  );
}
