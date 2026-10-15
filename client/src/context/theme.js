import { createContext, useContext } from 'react';
import { themes } from './themes';

export const ThemeContext = createContext({ mode: 'dark', theme: themes.dark, toggle: () => {} });

export const useTheme = () => useContext(ThemeContext);
