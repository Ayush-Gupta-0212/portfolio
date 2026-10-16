import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import './admin.css';
import { adminApi, clearSession, getSession, setSession } from './adminApi';
import { dirtySections, downloadJSON, findProblem, prepareImage, sameJSON } from './adminUtils';
import { mergeContent, writeCache } from '../content/store';
import { Button, Field, Icon, Mark, Spinner, Toasts } from './ui';
import {
  AboutEditor, CertificatesEditor, HeroEditor, InboxView, LinksEditor,
  MediaPicker, MediaView, Overview, ProjectsEditor, SkillsEditor,
} from './views';

const VIEWS = {
  overview: { label: 'Overview', icon: 'overview', blurb: 'Everything on your portfolio at a glance.' },
  hero: { label: 'Hero & Profile', icon: 'hero', blurb: 'Your name, roles, intro and availability.' },
  about: { label: 'About', icon: 'about', blurb: 'The line-by-line statement, story, portrait and stats.' },
  skills: { label: 'Skills', icon: 'skills', blurb: 'Categories, skills and proficiency — drag to reorder.' },
  projects: { label: 'Projects', icon: 'projects', blurb: 'The horizontal work track — drag to reorder.' },
  certificates: { label: 'Certificates', icon: 'certificates', blurb: 'Cards on the 3D spiral — drag to reorder.' },
  links: { label: 'Contact & Links', icon: 'links', blurb: 'Email, contact copy and social links.' },
  media: { label: 'Media', icon: 'media', blurb: 'Images stored in your database.' },
  inbox: { label: 'Inbox', icon: 'inbox', blurb: 'Messages sent through the contact form.' },
};

const NAV = [
  { label: 'GENERAL', items: ['overview'] },
  { label: 'CONTENT', items: ['hero', 'about', 'skills', 'projects', 'certificates', 'links'] },
  { label: 'LIBRARY', items: ['media', 'inbox'] },
];

const LISTS = ['projects', 'skills', 'certificates'];

const readView = () => {
  const id = window.location.hash.replace(/^#\/?/, '');
  return VIEWS[id] ? id : 'overview';
};

const go = (id) => {
  if (window.location.hash !== `#/${id}`) window.location.hash = `/${id}`;
};

const isBackup = (json) =>
  json && typeof json.profile === 'object' && LISTS.every((key) => Array.isArray(json[key]));

/* ── Screens before the studio ── */

const BootScreen = ({ elapsed = 0, error, title = 'Can’t reach the server', onRetry }) => (
  <div className="adm-boot">
    <div className="adm-boot-inner">
      <div className="adm-login-mark"><Mark size={40} /></div>
      {error ? (
        <>
          <h1>{title}</h1>
          <p>{error} If the API runs on Render’s free tier it may still be waking up — give it a minute and retry.</p>
          <Button variant="primary" icon="refresh" onClick={onRetry}>Try again</Button>
        </>
      ) : (
        <>
          <Spinner />
          <p aria-live="polite">
            {elapsed < 4
              ? 'Connecting…'
              : `Waking up the server · ${elapsed}s. Render’s free tier sleeps when idle — this can take up to a minute.`}
          </p>
        </>
      )}
    </div>
  </div>
);

const Login = ({ configured, onLogin }) => {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError('');
    try {
      await onLogin(password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="adm-login">
      <motion.div
        className="adm-login-card"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="adm-login-mark"><Mark size={44} /></div>
        <h1>Studio</h1>
        <p className="sub">Sign in to manage your portfolio.</p>
        {configured ? (
          <form onSubmit={submit}>
            <Field label={<label htmlFor="adm-pass">Password</label>} error={error}>
              <div className="adm-pass">
                <input
                  id="adm-pass"
                  className="adm-input"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoFocus
                  value={password}
                  aria-invalid={Boolean(error)}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="adm-btn ghost" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </Field>
            <Button type="submit" variant="primary block" busy={busy} disabled={!password}>Sign in</Button>
          </form>
        ) : (
          <div className="adm-banner" style={{ display: 'block' }}>
            <strong>Admin isn’t set up yet</strong>
            <p>Add an <code>ADMIN_PASSWORD</code> environment variable to the server, redeploy, then reload this page.</p>
          </div>
        )}
        <p className="note">Sessions last 12 hours and end when you close the tab.</p>
      </motion.div>
    </div>
  );
};

/* ── Studio ── */

export default function AdminApp() {
  const [phase, setPhase] = useState('booting'); // booting | error | ready
  const [attempt, setAttempt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [bootError, setBootError] = useState('');
  const [configured, setConfigured] = useState(true);
  const [health, setHealth] = useState(null);
  const [authed, setAuthed] = useState(false);

  const [saved, setSaved] = useState(null); // what's live
  const [draft, setDraft] = useState(null); // what's being edited
  const [initialized, setInitialized] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [contentError, setContentError] = useState('');
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState(readView);
  const [openItem, setOpenItem] = useState(null);
  const [toasts, setToasts] = useState([]);

  const [media, setMedia] = useState(null);
  const [mediaState, setMediaState] = useState('idle');
  const [messages, setMessages] = useState(null);
  const [messagesState, setMessagesState] = useState('idle');
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerResolve = useRef(null);
  const saveRef = useRef(null);

  const toast = useCallback((message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list.slice(-3), { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), tone === 'bad' ? 6000 : 3500);
  }, []);

  // A 401 anywhere means the token expired: back to the login card, edits stay in memory
  const guard = useCallback((err) => {
    if (err?.status !== 401) return false;
    clearSession();
    setAuthed(false);
    toast('Your session expired — sign in again. Unsaved edits are kept.', 'bad');
    return true;
  }, [toast]);

  const loadContent = useCallback(async () => {
    try {
      const api = await adminApi.content();
      const merged = mergeContent(api);
      setInitialized(Boolean(api.initialized));
      setUpdatedAt(api.updatedAt);
      setSaved(merged);
      setDraft(merged);
      setContentError('');
    } catch (err) {
      setContentError(err.message);
    }
  }, []);

  const loadMedia = useCallback(async () => {
    setMediaState('loading');
    try {
      const { items } = await adminApi.listMedia();
      setMedia(items);
      setMediaState('idle');
    } catch (err) {
      setMediaState(guard(err) ? 'idle' : 'error');
    }
  }, [guard]);

  const loadMessages = useCallback(async () => {
    setMessagesState('loading');
    try {
      setMessages(await adminApi.messages());
      setMessagesState('idle');
    } catch (err) {
      setMessagesState(guard(err) ? 'idle' : 'error');
    }
  }, [guard]);

  /* Boot: wake the API, check config, resume an existing session */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [status, h] = await Promise.all([adminApi.status(), adminApi.health().catch(() => null)]);
        if (!alive) return;
        setConfigured(Boolean(status?.configured));
        setHealth(h);
        if (getSession()) {
          try {
            await adminApi.session();
            if (!alive) return;
            await loadContent();
            setAuthed(true);
            loadMedia();
            loadMessages();
          } catch (err) {
            if (err.status !== 401) throw err;
            clearSession();
          }
        }
        if (alive) setPhase('ready');
      } catch (err) {
        if (alive) {
          setBootError(err.message);
          setPhase('error');
        }
      }
    })();
    return () => { alive = false; };
  }, [attempt, loadContent, loadMedia, loadMessages]);

  useEffect(() => {
    if (phase !== 'booting') return undefined;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  /* Page chrome: own cursor/background, not indexed, its own title */
  useEffect(() => {
    document.body.classList.add('adm-body');
    const prevTitle = document.title;
    document.title = 'Studio · AG.DEV';
    const robots = Object.assign(document.createElement('meta'), { name: 'robots', content: 'noindex, nofollow' });
    document.head.appendChild(robots);
    return () => {
      document.body.classList.remove('adm-body');
      document.title = prevTitle;
      robots.remove();
    };
  }, []);

  useEffect(() => {
    const onHash = () => {
      setView(readView());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const dirty = useMemo(() => Boolean(draft && saved && !sameJSON(draft, saved)), [draft, saved]);
  const sections = useMemo(() => dirtySections(draft, saved), [draft, saved]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  /* ── Editing ── */

  const setProfile = useCallback((fn) => setDraft((d) => ({ ...d, profile: fn(d.profile) })), []);
  const setList = useCallback(
    (key, next) => setDraft((d) => ({ ...d, [key]: typeof next === 'function' ? next(d[key]) : next })),
    [],
  );

  const upload = useCallback(async (file, opts) => {
    const { blob } = await prepareImage(file, opts);
    const name = `${(file.name || 'image').replace(/\.[^.]+$/, '')}.webp`;
    try {
      const res = await adminApi.uploadMedia(blob, name);
      setMedia((list) => (list ? [{ _id: res._id, url: res.url, size: res.size, contentType: res.contentType, name }, ...list] : list));
      return res.url;
    } catch (err) {
      if (guard(err)) throw new Error('Session expired — sign in again.');
      throw err;
    }
  }, [guard]);

  const closePicker = useCallback((url = null) => {
    pickerResolve.current?.(url);
    pickerResolve.current = null;
    setPickerOpen(false);
  }, []);

  const pickMedia = useCallback(() => {
    if (!media && mediaState !== 'loading') loadMedia();
    return new Promise((resolve) => {
      pickerResolve.current = resolve;
      setPickerOpen(true);
    });
  }, [media, mediaState, loadMedia]);

  useEffect(() => {
    if (!pickerOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closePicker(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pickerOpen, closePicker]);

  /* ── Saving: only what changed (or everything on first import) ── */

  const save = async ({ all = false } = {}) => {
    if (saving || !draft) return;
    const problem = findProblem(draft);
    if (problem) {
      toast(problem.message, 'bad');
      go(problem.view);
      if (problem.id) setOpenItem(problem.id);
      return;
    }

    const sent = draft;
    const everything = all || !initialized;
    const done = {};
    let failure = null;
    setSaving(true);
    try {
      if (everything || !sameJSON(sent.profile, saved.profile)) {
        const res = await adminApi.saveProfile(sent.profile);
        done.profile = mergeContent({ initialized: true, profile: res.profile }).profile;
        setUpdatedAt(res.updatedAt);
        setInitialized(true);
      }
      for (const key of LISTS) {
        if (everything || !sameJSON(sent[key], saved[key])) {
          done[key] = (await adminApi.saveList(key, sent[key])).items;
        }
      }
    } catch (err) {
      failure = err;
    }
    setSaving(false);

    // Adopt server copies (real ids, cleaned values) unless the user kept typing meanwhile
    const nextSaved = { ...saved, ...done };
    setSaved(nextSaved);
    setDraft((current) => (sameJSON(current, sent) ? { ...sent, ...done } : current));
    if (Object.keys(done).length) writeCache(mergeContent({ initialized: true, ...nextSaved }));

    if (failure) {
      if (!guard(failure)) toast(`Save failed: ${failure.message}`, 'bad');
    } else {
      toast(initialized ? 'Saved — your site is updated.' : 'Imported — your site now loads from the database.');
    }
  };

  useEffect(() => { saveRef.current = save; });

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const discard = () => {
    if (window.confirm('Discard all unsaved changes?')) setDraft(saved);
  };

  /* ── Session ── */

  const login = async (password) => {
    setSession(await adminApi.login(password));
    if (!draft) await loadContent(); // after an expiry, keep the in-memory edits
    setAuthed(true);
    if (!media) loadMedia();
    if (!messages) loadMessages();
  };

  const logout = () => {
    if (dirty && !window.confirm('You have unsaved changes. Sign out and discard them?')) return;
    clearSession();
    setAuthed(false);
    setSaved(null);
    setDraft(null);
    setMedia(null);
    setMessages(null);
  };

  /* ── Backups, media, inbox ── */

  const exportBackup = () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadJSON({ exportedAt: new Date().toISOString(), ...saved }, `portfolio-backup-${date}.json`);
  };

  const restore = async (file) => {
    try {
      const json = JSON.parse(await file.text());
      if (!isBackup(json)) throw new Error('That file isn’t a portfolio backup.');
      setDraft(mergeContent({ initialized: true, ...json }));
      toast('Backup loaded into the editor — review it, then save to publish.');
    } catch (err) {
      toast(err instanceof SyntaxError ? 'Couldn’t read that file as JSON.' : err.message, 'bad');
    }
  };

  const deleteMedia = async (id) => {
    try {
      await adminApi.deleteMedia(id);
      setMedia((list) => list.filter((m) => m._id !== id));
      toast('Image deleted');
    } catch (err) {
      if (!guard(err)) toast(err.message, 'bad');
    }
  };

  const toggleRead = async (message) => {
    const flip = (read) => setMessages((list) => list.map((m) => (m._id === message._id ? { ...m, read } : m)));
    flip(!message.read);
    try {
      await adminApi.markMessage(message._id, !message.read);
    } catch (err) {
      flip(message.read);
      if (!guard(err)) toast(err.message, 'bad');
    }
  };

  const deleteMessage = async (id) => {
    try {
      await adminApi.deleteMessage(id);
      setMessages((list) => list.filter((m) => m._id !== id));
      toast('Message deleted');
    } catch (err) {
      if (!guard(err)) toast(err.message, 'bad');
    }
  };

  const retryBoot = () => {
    setElapsed(0);
    setBootError('');
    setPhase('booting');
    setAttempt((n) => n + 1);
  };

  /* ── Render ── */

  let screen;
  if (phase !== 'ready') {
    screen = <BootScreen elapsed={elapsed} error={phase === 'error' ? bootError : ''} onRetry={retryBoot} />;
  } else if (!authed) {
    screen = <Login configured={configured} onLogin={login} />;
  } else if (!draft) {
    screen = (
      <BootScreen
        title="Couldn’t load your content"
        error={contentError}
        onRetry={() => { setContentError(''); loadContent(); }}
      />
    );
  } else {
    const unread = messages ? messages.filter((m) => !m.read).length : null;
    const dbOk = health ? health.database === 'connected' : true;
    const tools = { upload, pickMedia, toast };
    const editor = { draft, setProfile, setList, tools };
    const items = { openId: openItem, setOpenId: setOpenItem };

    const views = {
      overview: () => (
        <Overview
          draft={draft}
          go={go}
          meta={{ initialized, updatedAt, dbOk, saving, mediaCount: media?.length ?? null, unread }}
          actions={{ importDefaults: () => save({ all: true }), exportBackup, restore }}
        />
      ),
      hero: () => <HeroEditor {...editor} />,
      about: () => <AboutEditor {...editor} />,
      skills: () => <SkillsEditor {...editor} />,
      projects: () => <ProjectsEditor {...editor} {...items} />,
      certificates: () => <CertificatesEditor {...editor} {...items} />,
      links: () => <LinksEditor {...editor} />,
      media: () => <MediaView media={media} state={mediaState} draft={draft} tools={tools} onDelete={deleteMedia} onRefresh={loadMedia} />,
      inbox: () => <InboxView messages={messages} state={messagesState} onRefresh={loadMessages} onToggleRead={toggleRead} onDelete={deleteMessage} />,
    };

    screen = (
      <div className="adm-shell">
        <aside className="adm-side">
          <a className="adm-brand" href="#/overview">
            <Mark size={20} />
            <span>
              <strong>Studio</strong>
              <small>PORTFOLIO ADMIN</small>
            </span>
          </a>
          <nav className="adm-nav" aria-label="Sections">
            {NAV.map((group) => (
              <Fragment key={group.label}>
                <div className="adm-nav-label">{group.label}</div>
                {group.items.map((id) => (
                  <button key={id} type="button" aria-current={view === id ? 'page' : undefined} onClick={() => go(id)}>
                    <Icon name={VIEWS[id].icon} />
                    {VIEWS[id].label}
                    {sections[id] && <span className="adm-dot" title="Unsaved changes" />}
                    {id === 'inbox' && unread > 0 && <span className="adm-count" aria-label={`${unread} unread`}>{unread}</span>}
                  </button>
                ))}
              </Fragment>
            ))}
          </nav>
          <div className="adm-side-foot">
            <span className={`adm-pill ${dbOk ? 'ok' : 'bad'}`}><i />{dbOk ? 'DATABASE ONLINE' : 'DATABASE OFFLINE'}</span>
            <a className="adm-btn ghost" href="/" target="_blank" rel="noopener noreferrer"><Icon name="external" size={16} />View site</a>
            <Button variant="ghost" icon="logout" onClick={logout}>Sign out</Button>
          </div>
        </aside>

        <main className="adm-main">
          <header className="adm-top">
            <div>
              <h1>{view === 'overview' ? `Hey ${draft.profile.firstName || 'there'} 👋` : VIEWS[view].label}</h1>
              <p>{VIEWS[view].blurb}</p>
            </div>
            <div className="adm-top-actions">
              {dirty && (
                <>
                  <span className="adm-unsaved"><span className="adm-dot" style={{ marginLeft: 0 }} />UNSAVED</span>
                  <Button variant="ghost" onClick={discard} disabled={saving}>Discard</Button>
                </>
              )}
              <Button
                variant="primary"
                icon="check"
                busy={saving}
                disabled={initialized && !dirty}
                title="Save (Ctrl+S)"
                onClick={() => save()}
              >
                {initialized ? 'Save & publish' : 'Publish all'}
              </Button>
            </div>
          </header>

          <div className="adm-body-wrap">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {views[view]()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {pickerOpen && <MediaPicker media={media} state={mediaState} onPick={closePicker} onClose={() => closePicker()} />}
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="adm">
        {screen}
        <Toasts toasts={toasts} />
      </div>
    </MotionConfig>
  );
}
