'use client';

import { useCallback, useRef } from 'react';
import { Reserve } from '@cavos/reserve';

export function useReserve(): () => Promise<Reserve> {
  const reserveRef = useRef<Promise<Reserve> | null>(null);
  return useCallback(() => {
    reserveRef.current ??= Reserve.connect('testnet');
    return reserveRef.current;
  }, []);
}
