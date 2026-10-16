import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/theme';
import { useMediaQuery } from '../hooks/useMediaQuery';
import SectionLabel from '../components/reveal/SectionLabel';
import LineReveal from '../components/reveal/LineReveal';
import BlurReveal from '../components/reveal/BlurReveal';
import RollText from '../components/reveal/RollText';
import Wordmark from '../components/reveal/Wordmark';
import { useContent } from '../content/context';
import { fullName, socialLinks } from '../content/store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


const Contact = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { theme } = useTheme();
  const { profile } = useContent().content;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [form, setForm] = useState({ name: '', email: '', message: '', botcheck: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    if (!name || !email || !message) {
      setError('All fields are required.');
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Honeypot: real people never see this field, bots fill it in.
    if (form.botcheck) {
      setError('');
      setStatus('success');
      setForm({ name: '', email: '', message: '', botcheck: '' });
      return;
    }

    setError('');
    setStatus('loading');

    // Copy for the admin inbox. keepalive lets it finish even if the visitor leaves,
    // and it counts as "sent" if the email service is down.
    const savedToInbox = fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
      keepalive: true,
    }).then((res) => res.ok, () => false);
    // don't keep the visitor waiting on a sleeping server (the request itself carries on)
    const inboxOk = () => Promise.race([savedToInbox, new Promise((resolve) => setTimeout(resolve, 15000, false))]);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: "95dfe3c6-05f1-4464-9bcd-c656bef0c693",
          name,
          email,
          message,
          subject: `New Portfolio Contact from ${name}`,
          botcheck: false,
        })
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setForm({ name: '', email: '', message: '', botcheck: '' });
      } else if (await inboxOk()) {
        setStatus('success');
        setForm({ name: '', email: '', message: '', botcheck: '' });
      } else {
        setStatus('error');
        setError(result.message || 'Failed to send. Please try again.');
      }
    } catch (err) {
      console.error(err);
      if (await inboxOk()) {
        setStatus('success');
        setForm({ name: '', email: '', message: '', botcheck: '' });
        return;
      }
      setStatus('error');
      setError('Something went wrong. Please check your connection.');
    }
  };

  const inputStyle = {
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${theme.border}`,
    color: theme.text,
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1rem',
    padding: '1rem 0',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.3s ease',
  };

  return (
    <section id="contact" ref={ref} style={{
      minHeight: '100vh',
      padding: isMobile ? '5rem 1.5rem' : '8rem 2rem',
      maxWidth: '1400px', margin: '0 auto', transition: 'color 0.5s ease',
    }}>
      {/* Section header */}
      <SectionLabel number="05" label="CONTACT" theme={theme} style={{ marginBottom: '4rem' }} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? '3rem' : '6rem',
        alignItems: 'start',
      }}>
        {/* Left */}
        <div>
          <LineReveal
            stagger={0.12}
            style={{
              fontSize: isMobile ? 'clamp(2rem, 12vw, 3.5rem)' : 'clamp(2.5rem, 6vw, 5rem)',
              fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: theme.text,
              marginBottom: '2rem',
            }}
          >
            Let&apos;s build<br />something<br />
            <span className="hl">great.</span>
          </LineReveal>

          <BlurReveal key={profile.contact.intro} style={{ color: theme.muted, lineHeight: 1.9, marginBottom: '2.5rem', fontSize: '0.95rem' }}>
            {profile.contact.intro}
          </BlurReveal>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            {[
              { label: 'Email', value: profile.contact.email, href: `mailto:${profile.contact.email}` },
              { label: 'Location', value: profile.location },
              { label: 'Status', value: profile.contact.status && `🟢 ${profile.contact.status}` },
            ].filter(({ value }) => value).map(({ label, value, href }) => (
              <div key={label} style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: theme.muted, width: '4.5rem', flexShrink: 0, paddingTop: '2px' }}>{label}</span>
                {href ? (
                  <a href={href} className="footer-link" style={{ color: theme.textSub, fontSize: '0.9rem', wordBreak: 'break-word', textDecoration: 'none' }}>{value}</a>
                ) : (
                  <span style={{ color: theme.textSub, fontSize: '0.9rem', wordBreak: 'break-word' }}>{value}</span>
                )}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: isMobile ? 0 : 40, y: isMobile ? 20 : 0 }}
          animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          noValidate
          aria-describedby={error ? 'contact-error' : undefined}
        >
          {[{ name: 'name', label: 'Your name', placeholder: 'Your Name', type: 'text', autoComplete: 'name' },
          { name: 'email', label: 'Your email', placeholder: 'Your Email', type: 'email', autoComplete: 'email' }].map(({ name, label, placeholder, type, autoComplete }) => (
            <div key={name} style={{ marginBottom: '1.5rem' }}>
              <label htmlFor={`contact-${name}`} className="sr-only">{label}</label>
              <input
                id={`contact-${name}`}
                style={inputStyle}
                type={type} name={name} value={form[name]}
                onChange={handleChange} placeholder={placeholder}
                autoComplete={autoComplete}
                required
                aria-invalid={Boolean(error) && !form[name].trim()}
                onFocus={e => e.target.style.borderBottomColor = theme.accent}
                onBlur={e => e.target.style.borderBottomColor = theme.border}
              />
            </div>
          ))}

          <div style={{ marginBottom: '2rem' }}>
            <label htmlFor="contact-message" className="sr-only">Your message</label>
            <textarea
              id="contact-message"
              style={{ ...inputStyle, resize: 'none' }}
              name="message" value={form.message}
              onChange={handleChange}
              placeholder="Tell me about your project..."
              rows={5}
              required
              aria-invalid={Boolean(error) && !form.message.trim()}
              onFocus={e => e.target.style.borderBottomColor = theme.accent}
              onBlur={e => e.target.style.borderBottomColor = theme.border}
            />
          </div>

          {/* Honeypot — hidden from people and assistive tech, tempting to bots */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
            <label htmlFor="contact-botcheck">Leave this field empty</label>
            <input id="contact-botcheck" type="text" name="botcheck" tabIndex={-1} autoComplete="off" value={form.botcheck} onChange={handleChange} />
          </div>

          {error && (
            <p id="contact-error" role="alert" style={{ color: theme.danger, fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', marginBottom: '1rem' }}>
              {error}
            </p>
          )}

          <span className="sr-only" role="status" aria-live="polite">
            {status === 'loading' ? 'Sending your message…' : status === 'success' ? 'Message sent. Talk soon.' : ''}
          </span>

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div key="success"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '1.2rem',
                  border: `1px solid ${theme.accentBorder}`,
                  color: theme.accentInk,
                  fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', letterSpacing: '0.05em',
                }}
              >
                ✓ Message sent! Talk soon.
              </motion.div>
            ) : (
              <motion.button key="btn" type="submit" className="roll-link"
                disabled={status === 'loading'}
                aria-busy={status === 'loading'}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                style={{
                  padding: '1.1rem', background: theme.accent,
                  color: theme.accentText, border: 'none',
                  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                  fontSize: '0.9rem', letterSpacing: '0.1em', cursor: 'pointer',
                  opacity: status === 'loading' ? 0.6 : 1,
                  transition: 'opacity 0.3s ease, background 0.5s ease',
                  textTransform: 'uppercase',
                }}
              >
                <RollText text={status === 'loading' ? 'SENDING...' : 'SEND MESSAGE →'} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.form>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.8 }}
        style={{
          marginTop: isMobile ? '4rem' : '8rem',
          paddingTop: '2rem',
          borderTop: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: theme.muted }}>
          © {new Date().getFullYear()} {fullName(profile)}
        </span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {socialLinks(profile).map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="roll-link footer-link"
              style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: theme.muted, textDecoration: 'none' }}
            >
              <RollText text={label} />
            </a>
          ))}
        </div>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: theme.muted }}>
          Designed & Built with ❤️
        </span>
      </motion.div>

      {/* Signature wordmark */}
      <Wordmark theme={theme} isMobile={isMobile} />
    </section>
  );
};

export default Contact;
