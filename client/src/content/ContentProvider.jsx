import { useEffect, useState } from 'react';
import { getContent } from '../api';
import { DEFAULT_CONTENT } from './defaults';
import { ContentContext } from './context';
import { mergeContent, readCache, writeCache } from './store';

/*
 * Renders instantly from the last content this browser saw (or the bundled
 * defaults), then swaps in the live content once the API answers.
 */
export const ContentProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    const cached = readCache();
    return cached ? { content: cached, source: 'cache' } : { content: DEFAULT_CONTENT, source: 'default' };
  });

  useEffect(() => {
    let alive = true;
    getContent()
      .then(({ data }) => {
        if (!alive || !data?.initialized) return;
        const next = mergeContent(data);
        writeCache(next);
        setState((prev) => (JSON.stringify(prev.content) === JSON.stringify(next)
          ? { ...prev, source: 'live' }
          : { content: next, source: 'live' }));
      })
      .catch(() => { /* keep cached/default content */ });
    return () => { alive = false; };
  }, []);

  return <ContentContext.Provider value={state}>{children}</ContentContext.Provider>;
};
