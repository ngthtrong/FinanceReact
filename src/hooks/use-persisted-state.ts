"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(defaultValue);
  const canPersist = useRef(false);

  // Restore persisted value after hydration
  useEffect(() => {
    canPersist.current = false;
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        setState(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, [key]);

  // Persist state changes (skip the first run to avoid overwriting with default value)
  useEffect(() => {
    if (!canPersist.current) {
      canPersist.current = true;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [key, state]);

  const setPersistedState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(value);
    },
    []
  );

  return [state, setPersistedState];
}
