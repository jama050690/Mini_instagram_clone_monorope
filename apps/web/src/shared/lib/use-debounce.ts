import { useEffect, useState } from 'react';

/** Qiymatni `delay` ms kechiktirib qaytaradi (qidiruv input'i uchun). */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
