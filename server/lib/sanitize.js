/*
 * Whitelist-style cleaning for everything the admin page can save.
 * Unknown fields are dropped, strings are trimmed and length-capped, and URLs
 * must be http(s), mailto or a site-relative path — so a saved link can never
 * become a `javascript:` URL on the public site.
 */
class ValidationError extends Error {}

const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const bool = (v) => v === true;

const url = (v, field) => {
  const s = str(v, 2000);
  if (!s) return '';
  if (/^(https?:\/\/|mailto:)/i.test(s) || (s.startsWith('/') && !s.startsWith('//'))) return s;
  throw new ValidationError(`${field} must start with https://, mailto: or /`);
};

const list = (v, max, mapFn) => (Array.isArray(v) ? v.slice(0, max).map(mapFn) : []);
const stats = (v) => list(v, 6, (s) => ({ value: str(s?.value, 12), label: str(s?.label, 40) })).filter((s) => s.value || s.label);

const profile = (p = {}) => ({
  firstName: str(p.firstName, 40),
  lastName: str(p.lastName, 40),
  roles: list(p.roles, 12, (r) => str(r, 60)).filter(Boolean),
  heroIntro: str(p.heroIntro, 400),
  available: bool(p.available),
  availabilityLabel: str(p.availabilityLabel, 40),
  location: str(p.location, 60),
  heroStats: stats(p.heroStats),
  about: {
    statement: str(p.about?.statement, 600),
    philosophy: str(p.about?.philosophy, 300),
    bio: str(p.about?.bio, 600),
    portrait: url(p.about?.portrait, 'Portrait'),
    stats: stats(p.about?.stats),
  },
  skillsIntro: str(p.skillsIntro, 300),
  skillsNote: str(p.skillsNote, 300),
  projectsIntro: str(p.projectsIntro, 300),
  contact: {
    email: str(p.contact?.email, 120),
    intro: str(p.contact?.intro, 400),
    status: str(p.contact?.status, 80),
  },
  links: {
    github: url(p.links?.github, 'GitHub link'),
    linkedin: url(p.links?.linkedin, 'LinkedIn link'),
    resume: url(p.links?.resume, 'Resume link'),
  },
});

const required = (value, field) => {
  if (!value) throw new ValidationError(`${field} is required`);
  return value;
};

const project = (p = {}) => {
  const year = Number.parseInt(p.year, 10);
  return {
    title: required(str(p.title, 140), 'Project title'),
    description: str(p.description, 1200),
    tags: list(p.tags, 12, (t) => str(t, 40)).filter(Boolean),
    image: url(p.image, 'Project image'),
    github: url(p.github, 'GitHub link'),
    live: url(p.live, 'Live link'),
    year: year >= 1990 && year <= 2100 ? year : null,
    featured: bool(p.featured),
  };
};

const skill = (s = {}) => ({
  name: required(str(s.name, 80), 'Skill name'),
  category: required(str(s.category, 60), 'Skill category'),
  level: Math.max(0, Math.min(100, Math.round(Number(s.level) || 0))),
});

const certificate = (c = {}) => ({
  title: required(str(c.title, 200), 'Certificate title'),
  issuer: str(c.issuer, 120),
  date: str(c.date, 60),
  link: url(c.link, 'Certificate link'),
  image: url(c.image, 'Certificate image'),
});

/* Detect real image type from magic bytes — never trust the client's header */
const sniffImage = (buf) => {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.toString('ascii', 0, 4) === 'GIF8') return 'image/gif';
  return null;
};

module.exports = { ValidationError, profile, project, skill, certificate, sniffImage, str };
