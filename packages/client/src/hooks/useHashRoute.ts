import { useCallback, useEffect, useState } from 'react';

/** Minimal hash router: no dependency, and shareable invite links keep working. */
export function useHashRoute(): [string, (path: string) => void] {
  const [path, setPath] = useState(() => currentPath());

  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: string) => {
    window.location.hash = next.startsWith('/') ? next : `/${next}`;
  }, []);

  return [path, navigate];
}

const currentPath = (): string => {
  const hash = window.location.hash.replace(/^#/, '');
  return hash.length > 0 ? hash : '/';
};
