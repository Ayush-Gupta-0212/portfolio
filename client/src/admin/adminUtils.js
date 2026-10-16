/* Non-component helpers for the admin studio */

/* Resize to a sensible width and re-encode as WebP before uploading */
export const prepareImage = async (file, { maxWidth = 1800, quality = 0.84 } = {}) => {
  if (!file?.type?.startsWith('image/')) throw new Error('Please choose an image file.');
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image format can’t be read. Try PNG, JPEG or WebP.');
  }
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob) throw new Error('Could not process this image.');
  return { blob, width, height };
};

/* Same rule as the server: links must be http(s), mailto or site-relative */
export const urlProblem = (value) => {
  if (!value) return '';
  if (/^(https?:\/\/|mailto:)/i.test(value) || (value.startsWith('/') && !value.startsWith('//'))) return '';
  return 'Must start with https://, mailto: or /';
};

/* First thing the server would reject, with the view to jump to */
export const findProblem = ({ profile, projects, skills, certificates }) => {
  const checks = [
    ['about', 'Portrait image', profile.about.portrait],
    ['links', 'GitHub link', profile.links.github],
    ['links', 'LinkedIn link', profile.links.linkedin],
    ['links', 'Resume link', profile.links.resume],
  ];
  for (const [view, label, value] of checks) {
    if (urlProblem(value)) return { view, message: `${label}: ${urlProblem(value)}` };
  }
  for (const [i, p] of projects.entries()) {
    if (!p.title?.trim()) return { view: 'projects', id: p._id, message: `Project ${i + 1} needs a title.` };
    for (const key of ['image', 'github', 'live']) {
      if (urlProblem(p[key])) return { view: 'projects', id: p._id, message: `“${p.title}” ${key} link: ${urlProblem(p[key])}` };
    }
  }
  for (const s of skills) {
    if (!s.category?.trim()) return { view: 'skills', message: 'Every skill needs a category.' };
    if (!s.name?.trim()) return { view: 'skills', message: `A skill in “${s.category}” has no name.` };
  }
  for (const [i, c] of certificates.entries()) {
    if (!c.title?.trim()) return { view: 'certificates', id: c._id, message: `Certificate ${i + 1} needs a title.` };
    for (const key of ['image', 'link']) {
      if (urlProblem(c[key])) return { view: 'certificates', id: c._id, message: `“${c.title}” ${key}: ${urlProblem(c[key])}` };
    }
  }
  return null;
};

const HERO_KEYS = ['firstName', 'lastName', 'roles', 'heroIntro', 'available', 'availabilityLabel', 'location', 'heroStats'];
const pick = (obj, keys) => keys.map((k) => obj[k]);

/* Which nav sections differ between two content snapshots */
export const dirtySections = (a, b) => {
  if (!a || !b) return {};
  const pa = a.profile;
  const pb = b.profile;
  return {
    hero: !sameJSON(pick(pa, HERO_KEYS), pick(pb, HERO_KEYS)),
    about: !sameJSON(pa.about, pb.about),
    skills: !sameJSON(a.skills, b.skills) || !sameJSON(pick(pa, ['skillsIntro', 'skillsNote']), pick(pb, ['skillsIntro', 'skillsNote'])),
    projects: !sameJSON(a.projects, b.projects) || pa.projectsIntro !== pb.projectsIntro,
    certificates: !sameJSON(a.certificates, b.certificates),
    links: !sameJSON([pa.contact, pa.links], [pb.contact, pb.links]),
  };
};

let seq = 0;
export const tempId = () => `new-${Date.now().toString(36)}-${(seq += 1)}`;

export const formatBytes = (n = 0) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);

export const sameJSON = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* Download the current content as a JSON backup */
export const downloadJSON = (data, filename) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
