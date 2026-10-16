import { useId, useRef, useState } from 'react';
import { AnimatePresence, Reorder, motion, useDragControls } from 'framer-motion';
import { urlProblem } from './adminUtils';

/* ── Icons (1.5px stroke, 18px) ── */
const paths = {
  overview: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  hero: 'M12 2l3 6 6 .9-4.5 4.3 1 6.3L12 16.6 6.5 19.5l1-6.3L3 8.9 9 8z',
  about: 'M4 5h16M4 10h16M4 15h10M4 20h7',
  skills: 'M12 2l9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5',
  projects: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  certificates: 'M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM8.5 13.5L7 22l5-3 5 3-1.5-8.5',
  links: 'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1',
  media: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5a1.5 1.5 0 1 0 0-.01',
  external: 'M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
  check: 'M5 12l5 5 9-10',
  alert: 'M12 8v5M12 16.5v.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  chevron: 'M6 9l6 6 6-6',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  inbox: 'M3 13h5l1.5 2.5h5L16 13h5M5.5 5h13L21 13v6H3v-6z',
  refresh: 'M20 11a8 8 0 0 0-14.9-3M4 5v3h3M4 13a8 8 0 0 0 14.9 3M20 19v-3h-3',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
};

export const Icon = ({ name, size = 18, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={paths[name]} />
  </svg>
);

/* The AG_ mark, same geometry as the hero monogram */
export const Mark = ({ size = 44 }) => (
  <svg width={size * 1.6} height={size} viewBox="5 18 54 28" aria-hidden="true">
    <path fill="#c8ff00" fillRule="evenodd" d="M5.76 44.2L13.49 19.8L18.37 19.8L26.1 44.2L20.81 44.2L19.27 39.32L12.59 39.32L11.05 44.2ZM14.02 34.85L15.93 28.79L17.84 34.85ZM48.88 19.8L34.64 19.8L28.54 25.9L28.54 38.1L34.64 44.2L42.78 44.2L48.88 38.1L48.88 30.37L38.31 30.37L38.31 34.85L44 34.85L44 36.07L40.75 39.32L36.68 39.32L33.42 36.07L33.42 27.93L36.68 24.68L48.88 24.68ZM51.32 41.36L58.24 41.36L58.24 44.2L51.32 44.2Z" />
  </svg>
);

export const Spinner = () => <span className="adm-spin" aria-hidden="true" />;

export const Button = ({ variant = '', icon, busy, children, className = '', ...props }) => (
  <button type="button" {...props} className={`adm-btn ${variant} ${className}`} disabled={busy || props.disabled} aria-busy={busy || undefined}>
    {busy ? <Spinner /> : icon && <Icon name={icon} size={16} />}
    {children}
  </button>
);

export const Card = ({ title, description, actions, children }) => (
  <section className="adm-card">
    {(title || actions) && (
      <header className="adm-card-head">
        <div>
          {title && <h2>{title}</h2>}
          {description && <p>{description}</p>}
        </div>
        {actions}
      </header>
    )}
    <div className="adm-card-body">{children}</div>
  </section>
);

export const Field = ({ label, hint, error, count, children }) => (
  <div className="adm-field">
    {label && (
      <div className="adm-label">
        <span>{label}</span>
        {count && <span>{count}</span>}
      </div>
    )}
    {children}
    {error ? <p className="adm-error">{error}</p> : hint && <p className="adm-hint">{hint}</p>}
  </div>
);

export const TextField = ({ label, hint, value, onChange, maxLength, placeholder, type = 'text', small }) => {
  const id = useId();
  return (
    <Field label={label && <label htmlFor={id}>{label}</label>} hint={hint} count={maxLength ? `${(value || '').length}/${maxLength}` : null}>
      <input id={id} className={`adm-input${small ? ' sm' : ''}`} type={type} value={value ?? ''} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
};

export const TextArea = ({ label, hint, value, onChange, maxLength, rows = 3, placeholder }) => {
  const id = useId();
  return (
    <Field label={label && <label htmlFor={id}>{label}</label>} hint={hint} count={maxLength ? `${(value || '').length}/${maxLength}` : null}>
      <textarea id={id} className="adm-textarea" rows={rows} value={value ?? ''} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
};

export const UrlField = ({ label, value, onChange, placeholder = 'https://' }) => {
  const id = useId();
  const problem = urlProblem(value);
  return (
    <Field label={label && <label htmlFor={id}>{label}</label>} error={problem}>
      <input id={id} className="adm-input" type="url" inputMode="url" value={value ?? ''} placeholder={placeholder} aria-invalid={Boolean(problem)} onChange={(e) => onChange(e.target.value.trim())} />
    </Field>
  );
};

export const Toggle = ({ checked, onChange, label }) => (
  <label className="adm-toggle">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="track" aria-hidden="true" />
    {label}
  </label>
);

/* Chips: Enter or comma adds, Backspace on empty input removes the last one */
export const TagInput = ({ label, value = [], onChange, placeholder = 'Add a tag and press Enter', max = 12, itemMax = 40 }) => {
  const [draft, setDraft] = useState('');
  const id = useId();
  const add = () => {
    const t = draft.trim().replace(/,$/, '');
    if (t && !value.includes(t) && value.length < max) onChange([...value, t]);
    setDraft('');
  };
  return (
    <Field label={label && <label htmlFor={id}>{label}</label>} count={`${value.length}/${max}`}>
      <div className="adm-tags">
        {value.map((tag) => (
          <span key={tag} className="adm-chip">
            {tag}
            <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((t) => t !== tag))}>×</button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          maxLength={itemMax}
          placeholder={value.length ? '' : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
            if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={add}
        />
      </div>
    </Field>
  );
};

/* Value / label rows, e.g. "5+ · Projects" */
export const StatsEditor = ({ value = [], onChange, max = 4 }) => {
  const update = (i, key, v) => onChange(value.map((s, j) => (j === i ? { ...s, [key]: v } : s)));
  return (
    <div className="adm-stack" style={{ gap: '0.6rem' }}>
      {value.map((stat, i) => (
        <div key={i} className="adm-stat-row">
          <input className="adm-input sm" aria-label={`Stat ${i + 1} value`} value={stat.value} maxLength={12} placeholder="5+" onChange={(e) => update(i, 'value', e.target.value)} />
          <input className="adm-input sm" aria-label={`Stat ${i + 1} label`} value={stat.label} maxLength={40} placeholder="Projects" onChange={(e) => update(i, 'label', e.target.value)} />
          <Button variant="ghost icon danger" icon="trash" aria-label={`Remove stat ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      ))}
      {value.length < max && (
        <div><Button icon="plus" onClick={() => onChange([...value, { value: '', label: '' }])}>Add stat</Button></div>
      )}
    </div>
  );
};

/* Image: drop / click to upload (converted to WebP), or paste a URL */
export const ImageField = ({ label, value, onChange, upload, library, aspect = '16 / 10', hint }) => {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      onChange(await upload(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label={label} error={error} hint={hint || 'Drop an image or click to upload — it’s converted to WebP automatically.'}>
      <div className="adm-image">
        <div
          className={`adm-drop${over ? ' over' : ''}`}
          style={{ aspectRatio: aspect }}
          role="button"
          tabIndex={0}
          aria-label={value ? 'Replace image' : 'Upload image'}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); handleFile(e.dataTransfer.files?.[0]); }}
        >
          {value && <img src={value} alt="" />}
          {busy ? <span className="veil" style={{ opacity: 1 }}><Spinner /></span>
            : value ? <span className="veil"><Icon name="upload" /></span>
              : <span style={{ padding: '0.8rem' }}><Icon name="upload" /><br />Upload</span>}
        </div>
        <div className="adm-stack" style={{ gap: '0.6rem' }}>
          <UrlField value={value} onChange={onChange} placeholder="/image.webp or https://…" />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {library && (
              <Button icon="media" onClick={async () => { const url = await library(); if (url) onChange(url); }}>From library</Button>
            )}
            {value && <Button variant="ghost danger" icon="trash" onClick={() => onChange('')}>Remove</Button>}
          </div>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
    </Field>
  );
};

/* Drag-sortable list; items drag only from their grip so inputs stay usable */
export const SortableList = ({ items, onReorder, getKey, children, as = 'row' }) => (
  <Reorder.Group axis="y" values={items} onReorder={onReorder} className="adm-list" as="ul">
    {items.map((item, index) => (
      <SortableItem key={getKey(item)} value={item} as={as}>
        {(grip) => children(item, index, grip)}
      </SortableItem>
    ))}
  </Reorder.Group>
);

const SortableItem = ({ value, children, as }) => {
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);
  const grip = (
    <span className="adm-grip" aria-hidden="true" title="Drag to reorder" onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}>
      <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor">
        {[3, 9, 15].flatMap((y) => [4, 10].map((x) => <circle key={x * 100 + y} cx={x} cy={y} r="1.6" />))}
      </svg>
    </span>
  );
  return (
    <Reorder.Item
      value={value}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
      className={as === 'row' ? `adm-row${dragging ? ' dragging' : ''}` : ''}
      style={{ position: 'relative', listStyle: 'none' }}
    >
      {children(grip)}
    </Reorder.Item>
  );
};

/* Collapsible panel body with a smooth height animation */
export const Collapse = ({ open, children }) => (
  <AnimatePresence initial={false}>
    {open && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ overflow: 'hidden' }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export const Toasts = ({ toasts }) => (
  <div className="adm-toasts" role="status" aria-live="polite">
    <AnimatePresence>
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          className={`adm-toast ${t.tone}`}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.25 }}
        >
          <Icon name={t.tone === 'bad' ? 'alert' : 'check'} />
          {t.message}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);
