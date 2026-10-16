import { DEFAULT_CONTENT } from './defaults';

const CACHE_KEY = 'ag-content-v1';

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/* API values win; anything missing (undefined/null) falls back to the default */
const mergeDeep = (base, over) => {
  if (!isPlainObject(over)) return base;
  const out = { ...base };
  Object.keys(base).forEach((key) => {
    const b = base[key];
    const o = over[key];
    if (o === undefined || o === null) return;
    if (isPlainObject(b)) out[key] = mergeDeep(b, o);
    else if (Array.isArray(b)) out[key] = Array.isArray(o) ? o : b;
    else if (typeof o === typeof b) out[key] = o;
  });
  return out;
};

/* Turn an /api/content response into complete site content */
export const mergeContent = (api) => {
  if (!api?.initialized) return DEFAULT_CONTENT;
  return {
    profile: mergeDeep(DEFAULT_CONTENT.profile, api.profile),
    projects: Array.isArray(api.projects) ? api.projects : DEFAULT_CONTENT.projects,
    skills: Array.isArray(api.skills) ? api.skills : DEFAULT_CONTENT.skills,
    certificates: Array.isArray(api.certificates) ? api.certificates : DEFAULT_CONTENT.certificates,
  };
};

// Storage can throw (private mode, blocked site data) — caching is best-effort
export const readCache = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (raw?.v !== 1 || !isPlainObject(raw.content?.profile)) return null;
    return mergeContent({ initialized: true, ...raw.content });
  } catch {
    return null;
  }
};

export const writeCache = (content) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ v: 1, savedAt: Date.now(), content }));
  } catch { /* not cached */ }
};

/* Skills list → { category: [skills] }, categories in first-seen order */
export const groupSkills = (skills = []) =>
  skills.reduce((acc, skill) => {
    (acc[skill.category] ||= []).push(skill);
    return acc;
  }, {});

/* "Hi [[there]]" → [{ text: 'Hi ', hl: false }, { text: 'there', hl: true }] */
export const splitHighlights = (text = '') =>
  text
    .split(/\[\[(.+?)\]\]/g)
    .map((part, i) => ({ text: part, hl: i % 2 === 1 }))
    .filter((part) => part.text);

export const fullName = (profile) => [profile.firstName, profile.lastName].filter(Boolean).join(' ');

/* Profile links → [{ label, href }], skipping empty ones */
export const socialLinks = (profile) =>
  [['GitHub', profile.links.github], ['LinkedIn', profile.links.linkedin], ['Resume', profile.links.resume]]
    .filter(([, href]) => href)
    .map(([label, href]) => ({ label, href }));
