import { useMemo, useRef, useState } from 'react';
import {
  Button, Card, Collapse, Field, Icon, ImageField, SortableList, Spinner,
  StatsEditor, TagInput, TextArea, TextField, Toggle, UrlField,
} from './ui';
import { splitHighlights } from '../content/store';
import { formatBytes, tempId } from './adminUtils';

const formatDate = (value) =>
  value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

/* ═════════════ Overview ═════════════ */

export const Overview = ({ draft, meta, go, actions }) => {
  const fileRef = useRef(null);
  const p = draft.profile;
  const tiles = [
    ['projects', draft.projects.length, 'PROJECTS'],
    ['skills', draft.skills.length, 'SKILLS'],
    ['certificates', draft.certificates.length, 'CERTIFICATES'],
    ['media', meta.mediaCount ?? '—', 'UPLOADS'],
    ['inbox', meta.unread ?? '—', 'UNREAD MESSAGES'],
  ];

  return (
    <div className="adm-stack">
      {!meta.initialized && (
        <div className="adm-banner">
          <div>
            <strong>Your database is empty</strong>
            <p>The live site is running on the content bundled with the code. Import it once and everything becomes editable from here.</p>
          </div>
          <Button variant="primary" icon="upload" busy={meta.saving} onClick={actions.importDefaults}>Import site content</Button>
        </div>
      )}

      <div className="adm-tiles">
        {tiles.map(([id, n, label]) => (
          <button key={id} type="button" className="adm-tile" onClick={() => go(id)}>
            <b>{n}</b>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <Card title="Live snapshot" description="How your hero reads right now (including unsaved edits).">
        <div className="adm-snapshot">
          <span className={`adm-pill ${p.available ? 'ok' : ''}`}><i />{(p.availabilityLabel || 'Status').toUpperCase()}</span>
          <h3>{p.firstName} <em>{p.lastName}</em></h3>
          <p className="roles">{p.roles.join('  ·  ')}</p>
          <p>{p.heroIntro}</p>
        </div>
      </Card>

      <div className="adm-grid-2">
        <Card title="Status">
          <div className="adm-stack" style={{ gap: '0.6rem' }}>
            <span className="adm-pill ok"><i />SERVER ONLINE</span>
            <span className={`adm-pill ${meta.dbOk ? 'ok' : 'bad'}`}><i />{meta.dbOk ? 'DATABASE CONNECTED' : 'DATABASE UNAVAILABLE'}</span>
            <span className={`adm-pill ${meta.initialized ? 'ok' : 'warn'}`}>
              <i />{meta.initialized ? `PUBLISHED ${formatDate(meta.updatedAt).toUpperCase()}` : 'USING BUILT-IN CONTENT'}
            </span>
          </div>
        </Card>
        <Card title="Backups" description="Download everything as JSON, or load a backup into the editor — nothing goes live until you save.">
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Button icon="download" onClick={actions.exportBackup}>Download backup</Button>
            <Button icon="upload" onClick={() => fileRef.current?.click()}>Restore from file</Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) actions.restore(f); e.target.value = ''; }}
          />
        </Card>
      </div>
    </div>
  );
};

/* ═════════════ Hero & profile ═════════════ */

export const HeroEditor = ({ draft, setProfile }) => {
  const p = draft.profile;
  const set = (key) => (value) => setProfile((prev) => ({ ...prev, [key]: value }));
  return (
    <div className="adm-stack">
      <Card title="Name" description="Scrambles in huge type across the hero, and signs off the footer.">
        <div className="adm-grid-2">
          <TextField label="First name" value={p.firstName} onChange={set('firstName')} maxLength={40} />
          <TextField label="Last name" value={p.lastName} onChange={set('lastName')} maxLength={40} />
        </div>
      </Card>
      <Card title="Roles" description="Cycle through the hero ticker. The first one also goes into the page heading search engines read.">
        <TagInput label="Roles" value={p.roles} onChange={set('roles')} itemMax={60} placeholder="Add a role and press Enter" />
      </Card>
      <Card title="Intro">
        <TextArea label="Hero intro" value={p.heroIntro} onChange={set('heroIntro')} maxLength={400} rows={3} />
      </Card>
      <Card title="Availability" description="The pulsing pill in the hero.">
        <Toggle checked={p.available} onChange={set('available')} label={p.available ? 'Showing as available' : 'Showing as unavailable'} />
        <div className="adm-grid-2">
          <TextField label="Pill label" value={p.availabilityLabel} onChange={set('availabilityLabel')} maxLength={40} placeholder="Open to work" />
          <TextField label="Location" value={p.location} onChange={set('location')} maxLength={60} placeholder="India 🇮🇳" />
        </div>
      </Card>
      <Card title="Hero stats" description="Up to four numbers under the intro.">
        <StatsEditor value={p.heroStats} onChange={set('heroStats')} max={4} />
      </Card>
    </div>
  );
};

/* ═════════════ About ═════════════ */

export const AboutEditor = ({ draft, setProfile, tools }) => {
  const a = draft.profile.about;
  const textRef = useRef(null);
  const set = (key) => (value) => setProfile((prev) => ({ ...prev, about: { ...prev.about, [key]: value } }));
  const parts = useMemo(() => splitHighlights(a.statement), [a.statement]);

  // Wrap the selected words in [[ ]] so they render in the accent colour
  const highlight = () => {
    const el = textRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    if (start === end) {
      tools.toast('Select some words in the statement first.', 'bad');
      return;
    }
    const next = `${value.slice(0, start)}[[${value.slice(start, end)}]]${value.slice(end)}`;
    if (next.length > 600) {
      tools.toast('That would make the statement longer than 600 characters.', 'bad');
      return;
    }
    set('statement')(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(end + 4, end + 4); });
  };

  return (
    <div className="adm-stack">
      <Card
        title="Statement"
        description="The big paragraph that reveals line by line. Wrap words in [[double brackets]] to colour them."
        actions={<Button icon="star" onMouseDown={(e) => e.preventDefault()} onClick={highlight}>Highlight selection</Button>}
      >
        <Field label={<label htmlFor="adm-statement">Statement</label>} count={`${a.statement.length}/600`}>
          <textarea
            id="adm-statement"
            ref={textRef}
            className="adm-textarea"
            rows={4}
            maxLength={600}
            value={a.statement}
            onChange={(e) => set('statement')(e.target.value)}
          />
        </Field>
        <Field label="Preview">
          <div className="adm-preview">
            {parts.map((part, i) => <span key={i} className={part.hl ? 'hl' : undefined}>{part.text}</span>)}
          </div>
        </Field>
      </Card>
      <Card title="Story">
        <TextArea label="Philosophy (blur-in quote)" value={a.philosophy} onChange={set('philosophy')} maxLength={300} rows={2} />
        <TextArea label="Bio" value={a.bio} onChange={set('bio')} maxLength={600} rows={3} />
      </Card>
      <Card title="Portrait" description="Portrait orientation works best (about 4 : 5).">
        <ImageField
          value={a.portrait}
          onChange={set('portrait')}
          upload={(f) => tools.upload(f, { maxWidth: 1200 })}
          library={tools.pickMedia}
          aspect="4 / 5"
        />
      </Card>
      <Card title="Stats" description="Counters under the bio.">
        <StatsEditor value={a.stats} onChange={set('stats')} max={4} />
      </Card>
    </div>
  );
};

/* ═════════════ Skills ═════════════ */

const categoriesOf = (skills) => [...new Set(skills.map((s) => s.category))];

// Rebuild the flat list in category order, optionally swapping one category's items
const regroup = (list, order, replace = {}) =>
  order.flatMap((cat) => replace[cat] ?? list.filter((s) => s.category === cat));

// Renaming commits on blur/Enter so the card (keyed by name) doesn't remount mid-typing
const CategoryName = ({ value, onCommit }) => {
  const [text, setText] = useState(value);
  const commit = () => {
    const next = text.trim().slice(0, 60);
    if (next && next !== value) onCommit(next);
    else setText(value);
  };
  return (
    <input
      className="adm-cat-name"
      value={text}
      maxLength={60}
      aria-label="Category name"
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') setText(value);
      }}
    />
  );
};

export const SkillsEditor = ({ draft, setProfile, setList }) => {
  const { skills, profile } = draft;
  const cats = categoriesOf(skills);
  const [focusId, setFocusId] = useState(null);
  const write = (fn) => setList('skills', fn);
  const set = (key) => (value) => setProfile((prev) => ({ ...prev, [key]: value }));

  const update = (id, patch) => write((list) => list.map((s) => (s._id === id ? { ...s, ...patch } : s)));
  const remove = (id) => write((list) => list.filter((s) => s._id !== id));
  const reorder = (cat, items) => write((list) => regroup(list, categoriesOf(list), { [cat]: items }));
  const rename = (from, to) => write((list) => list.map((s) => (s.category === from ? { ...s, category: to } : s)));

  const add = (cat) => {
    const id = tempId();
    write((list) => regroup(list, categoriesOf(list), {
      [cat]: [...list.filter((s) => s.category === cat), { _id: id, name: '', category: cat, level: 70 }],
    }));
    setFocusId(id);
  };

  const move = (cat, dir) => write((list) => {
    const order = categoriesOf(list);
    const i = order.indexOf(cat);
    const j = i + dir;
    if (j < 0 || j >= order.length) return list;
    const swapped = order.map((c, k) => (k === i ? order[j] : k === j ? order[i] : c));
    return regroup(list, swapped);
  });

  const removeCategory = (cat) => {
    const n = skills.filter((s) => s.category === cat).length;
    if (n > 1 && !window.confirm(`Remove “${cat}” and its ${n} skills?`)) return;
    write((list) => list.filter((s) => s.category !== cat));
  };

  const addCategory = () => {
    let name = 'New category';
    for (let k = 2; cats.includes(name); k += 1) name = `New category ${k}`;
    const id = tempId();
    write((list) => [...list, { _id: id, name: '', category: name, level: 70 }]);
    setFocusId(id);
  };

  return (
    <div className="adm-stack">
      <Card title="Section copy">
        <TextArea label="Intro" value={profile.skillsIntro} onChange={set('skillsIntro')} maxLength={300} rows={2} />
        <TextArea label="Footnote" value={profile.skillsNote} onChange={set('skillsNote')} maxLength={300} rows={2} />
      </Card>

      {cats.map((cat, ci) => {
        const items = skills.filter((s) => s.category === cat);
        return (
          <Card
            key={cat}
            title={<CategoryName value={cat} onCommit={(name) => rename(cat, name)} />}
            description={`${items.length} skill${items.length === 1 ? '' : 's'} · tab on the site`}
            actions={(
              <div style={{ display: 'flex', gap: '0.2rem' }}>
                <Button variant="ghost icon" icon="up" aria-label={`Move ${cat} up`} disabled={ci === 0} onClick={() => move(cat, -1)} />
                <Button variant="ghost icon" icon="down" aria-label={`Move ${cat} down`} disabled={ci === cats.length - 1} onClick={() => move(cat, 1)} />
                <Button variant="ghost icon danger" icon="trash" aria-label={`Remove ${cat}`} onClick={() => removeCategory(cat)} />
              </div>
            )}
          >
            <SortableList items={items} getKey={(s) => s._id} onReorder={(next) => reorder(cat, next)}>
              {(s, i, grip) => (
                <>
                  {grip}
                  <input
                    className="adm-input sm"
                    style={{ flex: 1, minWidth: 0 }}
                    value={s.name}
                    placeholder="Skill name"
                    aria-label={`Skill ${i + 1} name`}
                    maxLength={80}
                    autoFocus={s._id === focusId}
                    onFocus={() => { if (focusId) setFocusId(null); }}
                    onChange={(e) => update(s._id, { name: e.target.value })}
                  />
                  <input
                    type="range"
                    className="adm-range adm-level-range"
                    min="0"
                    max="100"
                    value={s.level}
                    style={{ '--pct': `${s.level}%` }}
                    aria-label={`${s.name || 'Skill'} level`}
                    onChange={(e) => update(s._id, { level: Number(e.target.value) })}
                  />
                  <span className="adm-level">{s.level}%</span>
                  <Button variant="ghost icon danger" icon="trash" aria-label={`Remove ${s.name || 'skill'}`} onClick={() => remove(s._id)} />
                </>
              )}
            </SortableList>
            <div><Button icon="plus" onClick={() => add(cat)}>Add skill</Button></div>
          </Card>
        );
      })}

      <div><Button variant="primary" icon="plus" onClick={addCategory}>Add category</Button></div>
    </div>
  );
};

/* ═════════════ Projects & certificates (collapsible, sortable) ═════════════ */

const ItemShell = ({ open, onToggle, grip, thumb, title, meta, badge, onRemove, children }) => (
  <div className={`adm-item${open ? ' open' : ''}`}>
    <div className="adm-item-head">
      {grip}
      {thumb ? <img className="adm-thumb" src={thumb} alt="" /> : <span className="adm-thumb" aria-hidden="true" />}
      <button type="button" className="adm-item-title" onClick={onToggle} aria-expanded={open}>
        <strong>{title}</strong>
        <span>{meta}</span>
      </button>
      {badge}
      <Button variant="ghost icon danger" icon="trash" aria-label={`Delete ${title}`} onClick={onRemove} />
      <Button variant="ghost icon" className="adm-chevron" icon="chevron" aria-label={open ? 'Collapse' : 'Expand'} onClick={onToggle} />
    </div>
    <Collapse open={open}>
      <div className="adm-item-body">{children}</div>
    </Collapse>
  </div>
);

const listHelpers = (key, setList) => ({
  update: (id, patch) => setList(key, (list) => list.map((x) => (x._id === id ? { ...x, ...patch } : x))),
  remove: (id) => setList(key, (list) => list.filter((x) => x._id !== id)),
  reorder: (items) => setList(key, items),
});

export const ProjectsEditor = ({ draft, setProfile, setList, tools, openId, setOpenId }) => {
  const { update, remove, reorder } = listHelpers('projects', setList);
  const add = () => {
    const id = tempId();
    setList('projects', (list) => [...list, {
      _id: id, title: '', description: '', tags: [], image: '', github: '', live: '', year: new Date().getFullYear(), featured: true,
    }]);
    setOpenId(id);
  };

  return (
    <div className="adm-stack">
      <Card title="Section copy">
        <TextArea label="Intro" value={draft.profile.projectsIntro} onChange={(v) => setProfile((p) => ({ ...p, projectsIntro: v }))} maxLength={300} rows={2} />
      </Card>

      <SortableList items={draft.projects} getKey={(p) => p._id} onReorder={reorder} as="item">
        {(p, i, grip) => (
          <ItemShell
            open={openId === p._id}
            onToggle={() => setOpenId(openId === p._id ? null : p._id)}
            grip={grip}
            thumb={p.image}
            title={p.title || 'Untitled project'}
            meta={`${String(i + 1).padStart(2, '0')} · ${p.year ?? '—'} · ${p.tags.length} tags`}
            onRemove={() => remove(p._id)}
          >
            <div className="adm-grid-wide">
              <TextField label="Title" hint="“Name — subtitle” splits into a big name and a smaller line." value={p.title} onChange={(v) => update(p._id, { title: v })} maxLength={140} />
              <TextField label="Year" type="number" value={p.year ?? ''} onChange={(v) => update(p._id, { year: v === '' ? null : Number(v) })} placeholder="2026" />
            </div>
            <TextArea label="Description" value={p.description} onChange={(v) => update(p._id, { description: v })} maxLength={1200} rows={4} />
            <TagInput label="Tech tags" value={p.tags} onChange={(v) => update(p._id, { tags: v })} />
            <ImageField
              label="Cover image"
              value={p.image}
              onChange={(v) => update(p._id, { image: v })}
              upload={(f) => tools.upload(f, { maxWidth: 1800 })}
              library={tools.pickMedia}
            />
            <div className="adm-grid-2">
              <UrlField label="GitHub" value={p.github} onChange={(v) => update(p._id, { github: v })} />
              <UrlField label="Live site" value={p.live} onChange={(v) => update(p._id, { live: v })} />
            </div>
          </ItemShell>
        )}
      </SortableList>

      <div><Button variant="primary" icon="plus" onClick={add}>Add project</Button></div>
    </div>
  );
};

export const CertificatesEditor = ({ draft, setList, tools, openId, setOpenId }) => {
  const { update, remove, reorder } = listHelpers('certificates', setList);
  const add = () => {
    const id = tempId();
    setList('certificates', (list) => [...list, { _id: id, title: '', issuer: '', date: '', link: '', image: '' }]);
    setOpenId(id);
  };

  return (
    <div className="adm-stack">
      <SortableList items={draft.certificates} getKey={(c) => c._id} onReorder={reorder} as="item">
        {(c, i, grip) => (
          <ItemShell
            open={openId === c._id}
            onToggle={() => setOpenId(openId === c._id ? null : c._id)}
            grip={grip}
            thumb={c.image}
            title={c.title || 'Untitled certificate'}
            meta={`${String(i + 1).padStart(2, '0')} · ${c.issuer || 'No issuer'}${c.date ? ` · ${c.date}` : ''}`}
            onRemove={() => remove(c._id)}
          >
            <TextField label="Title" value={c.title} onChange={(v) => update(c._id, { title: v })} maxLength={200} />
            <div className="adm-grid-2">
              <TextField label="Issuer" value={c.issuer} onChange={(v) => update(c._id, { issuer: v })} maxLength={120} placeholder="Google · Coursera" />
              <TextField label="Date" value={c.date} onChange={(v) => update(c._id, { date: v })} maxLength={60} placeholder="Sep 2024" />
            </div>
            <UrlField label="Verification link" value={c.link} onChange={(v) => update(c._id, { link: v })} />
            <ImageField
              label="Certificate image"
              value={c.image}
              onChange={(v) => update(c._id, { image: v })}
              upload={(f) => tools.upload(f, { maxWidth: 1600 })}
              library={tools.pickMedia}
              aspect="1.414 / 1"
            />
          </ItemShell>
        )}
      </SortableList>

      <div><Button variant="primary" icon="plus" onClick={add}>Add certificate</Button></div>
    </div>
  );
};

/* ═════════════ Contact & links ═════════════ */

export const LinksEditor = ({ draft, setProfile }) => {
  const { contact, links } = draft.profile;
  const setIn = (group, key) => (value) => setProfile((p) => ({ ...p, [group]: { ...p[group], [key]: value } }));
  return (
    <div className="adm-stack">
      <Card title="Contact" description="The contact section and the footer.">
        <div className="adm-grid-2">
          <TextField label="Email" type="email" value={contact.email} onChange={setIn('contact', 'email')} maxLength={120} />
          <TextField label="Status line" value={contact.status} onChange={setIn('contact', 'status')} maxLength={80} placeholder="Open to opportunities" />
        </div>
        <TextArea label="Intro" value={contact.intro} onChange={setIn('contact', 'intro')} maxLength={400} rows={3} />
      </Card>
      <Card title="Links" description="Used in the About and Contact sections. Leave one empty to hide it everywhere.">
        <UrlField label="GitHub" value={links.github} onChange={setIn('links', 'github')} />
        <UrlField label="LinkedIn" value={links.linkedin} onChange={setIn('links', 'linkedin')} />
        <UrlField label="Resume" value={links.resume} onChange={setIn('links', 'resume')} />
      </Card>
    </div>
  );
};

/* ═════════════ Media library ═════════════ */

export const MediaView = ({ media, state, draft, tools, onDelete, onRefresh }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const usedIn = useMemo(() => JSON.stringify(draft), [draft]);
  const total = (media || []).reduce((n, m) => n + (m.size || 0), 0);

  const uploadFiles = async (files) => {
    const list = [...files].filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setBusy(true);
    let ok = 0;
    for (const file of list) {
      try {
        await tools.upload(file);
        ok += 1;
      } catch (err) {
        tools.toast(`${file.name}: ${err.message}`, 'bad');
      }
    }
    setBusy(false);
    if (ok) tools.toast(`Uploaded ${ok} image${ok === 1 ? '' : 's'}`);
  };

  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      tools.toast('Link copied');
    } catch {
      tools.toast('Copy failed — your browser blocked the clipboard.', 'bad');
    }
  };

  const remove = (m) => {
    const inUse = usedIn.includes(m.url);
    const msg = inUse
      ? 'This image is used on your site. Delete it anyway? It will show as broken until you replace it.'
      : 'Delete this image permanently?';
    if (window.confirm(msg)) onDelete(m._id);
  };

  return (
    <div className="adm-stack">
      <div
        className={`adm-dropzone${over ? ' over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); uploadFiles(e.dataTransfer.files); }}
      >
        <Icon name="upload" size={22} />
        <div>
          <strong>Drop images here</strong>
          <p>They’re resized and converted to WebP, then stored in your database.</p>
        </div>
        <Button variant="primary" icon="plus" busy={busy} onClick={() => inputRef.current?.click()}>Upload</Button>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { uploadFiles(e.target.files); e.target.value = ''; }} />
      </div>

      <div className="adm-toolbar">
        <span>{media ? `${media.length} image${media.length === 1 ? '' : 's'} · ${formatBytes(total)}` : ''}</span>
        <Button variant="ghost" icon="refresh" busy={state === 'loading'} onClick={onRefresh}>Refresh</Button>
      </div>

      {state === 'error' && <p className="adm-error">Couldn’t load the library. Try Refresh.</p>}
      {!media && state === 'loading' && <div className="adm-empty"><Spinner /> Loading…</div>}
      {media?.length === 0 && <div className="adm-empty">No uploads yet. Images you upload anywhere in the studio land here.</div>}

      {media?.length > 0 && (
        <div className="adm-media">
          {media.map((m) => (
            <figure key={m._id}>
              <img src={m.url} alt={m.name || ''} loading="lazy" />
              <figcaption>
                <span title={m.name}>
                  {usedIn.includes(m.url) && <span className="adm-badge" style={{ marginRight: '0.4rem' }}>IN USE</span>}
                  {formatBytes(m.size)}
                </span>
                <span style={{ display: 'flex' }}>
                  <Button variant="ghost icon" icon="copy" aria-label="Copy link" onClick={() => copy(m.url)} />
                  <Button variant="ghost icon danger" icon="trash" aria-label="Delete image" onClick={() => remove(m)} />
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
};

/* Modal used by image fields: pick something already uploaded */
export const MediaPicker = ({ media, state, onPick, onClose }) => (
  <div className="adm-modal" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="adm-modal-card" role="dialog" aria-modal="true" aria-label="Choose an image">
      <header className="adm-card-head" style={{ paddingBottom: '1rem' }}>
        <div>
          <h2>Media library</h2>
          <p>Click an image to use it.</p>
        </div>
        <Button variant="ghost" onClick={onClose} autoFocus>Close</Button>
      </header>
      <div className="adm-modal-body">
        {!media && state === 'loading' && <div className="adm-empty"><Spinner /> Loading…</div>}
        {state === 'error' && <p className="adm-error">Couldn’t load the library.</p>}
        {media?.length === 0 && <div className="adm-empty">Nothing uploaded yet — use Upload on the image field instead.</div>}
        {media?.length > 0 && (
          <div className="adm-media">
            {media.map((m) => (
              <button key={m._id} type="button" className="adm-pick" onClick={() => onPick(m.url)}>
                <img src={m.url} alt={m.name || 'Uploaded image'} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

/* ═════════════ Inbox ═════════════ */

export const InboxView = ({ messages, state, onRefresh, onToggleRead, onDelete }) => {
  const [filter, setFilter] = useState('all');
  const shown = (messages || []).filter((m) => filter === 'all' || !m.read);

  return (
    <div className="adm-stack">
      <div className="adm-toolbar">
        <div className="adm-seg" role="group" aria-label="Filter messages">
          {[['all', 'All'], ['unread', 'Unread']].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>
        <Button variant="ghost" icon="refresh" busy={state === 'loading'} onClick={onRefresh}>Refresh</Button>
      </div>

      {state === 'error' && <p className="adm-error">Couldn’t load messages. Try Refresh.</p>}
      {!messages && state === 'loading' && <div className="adm-empty"><Spinner /> Loading…</div>}
      {messages && shown.length === 0 && (
        <div className="adm-empty">{filter === 'unread' ? 'You’re all caught up.' : 'No messages yet. Anything sent through the contact form shows up here.'}</div>
      )}

      {shown.map((m) => (
        <article key={m._id} className={`adm-msg${m.read ? '' : ' unread'}`}>
          <header>
            <div>
              <strong>{m.name}</strong>
              <a href={`mailto:${m.email}`}>{m.email}</a>
            </div>
            <time dateTime={m.createdAt}>{formatDate(m.createdAt)}</time>
          </header>
          <p>{m.message}</p>
          <footer>
            <a className="adm-btn" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message')}`}>
              <Icon name="mail" size={16} />Reply
            </a>
            <Button variant="ghost" icon="check" onClick={() => onToggleRead(m)}>{m.read ? 'Mark unread' : 'Mark read'}</Button>
            <Button variant="ghost danger" icon="trash" onClick={() => { if (window.confirm(`Delete the message from ${m.name}?`)) onDelete(m._id); }}>Delete</Button>
          </footer>
        </article>
      ))}
    </div>
  );
};
