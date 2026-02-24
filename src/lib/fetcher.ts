/**
 * Shared SWR fetcher — imported by all data hooks to avoid duplication.
 */
export const fetcher = (url: string) => fetch(url).then((r) => r.json());
