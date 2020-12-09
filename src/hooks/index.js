import { useEffect, useState } from 'react';

const importScript = (resourceUrl) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = resourceUrl;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [resourceUrl]);
};

const useMediaQuery = (query) => {
  const mediaMatch = window.matchMedia(query);
  const [matches, setMatches] = useState(mediaMatch.matches);

  useEffect(() => {
    const handler = (e) => setMatches(e.matches);
    mediaMatch.addEventListener('change', handler);
    return () => mediaMatch.removeEventListener('change', handler);
  });
  return matches;
};

export { importScript, useMediaQuery };
