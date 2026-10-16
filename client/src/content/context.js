import { createContext, useContext } from 'react';
import { DEFAULT_CONTENT } from './defaults';

export const ContentContext = createContext({ content: DEFAULT_CONTENT, source: 'default' });

export const useContent = () => useContext(ContentContext);
