import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

const Contact = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('All fields are required.');
      return;
    }

    setError('');
    setStatus('loading');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: "95dfe3c6-05f1-4464-9bcd-c656bef0c693",
          name: form.name,
          email: form.email,
          message: form.message,
          subject: `New Portfolio Contact from ${form.name}`
        })
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setForm({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
        setError(result.message || 'Failed to send. Please try again.');
      }
    } catch (err) {
      console.error(err);
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
      <motion.div
        initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '4rem' }}
      >
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: theme.muted, letterSpacing: '0.15em' }}>05</span>
        <span style={{ width: '3rem', height: '1px', background: theme.border }} />
        <span style={{ color: theme.muted, fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.15em' }}>CONTACT</span>
      </motion.div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? '3rem' : '6rem',
        alignItems: 'start',
      }}>
        {/* Left */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: isMobile ? 'clamp(2rem, 12vw, 3.5rem)' : 'clamp(2.5rem, 6vw, 5rem)',
              fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.95, color: theme.text,
              marginBottom: '2rem',
            }}
          >
            Let's build<br />something<br />
            <span style={{ color: theme.accent }}>great.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ color: theme.muted, lineHeight: 1.9, marginBottom: '2.5rem', fontSize: '0.95rem' }}
          >
            Whether you have a project in mind, a role to fill, or just want to talk shop —
            my inbox is always open.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            {[
              { label: 'Email', value: 'itsayush0212@gmail.com' },
              { label: 'Location', value: 'India 🇮🇳' },
              { label: 'Status', value: '🟢 Open to opportunities' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: theme.muted, width: '4.5rem', flexShrink: 0, paddingTop: '2px' }}>{label}</span>
                <span style={{ color: theme.textSub, fontSize: '0.9rem', wordBreak: 'break-word' }}>{value}</span>
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
        >
          {[{ name: 'name', placeholder: 'Your Name', type: 'text' },
          { name: 'email', placeholder: 'Your Email', type: 'email' }].map(({ name, placeholder, type }) => (
            <div key={name} style={{ marginBottom: '1.5rem' }}>
              <input
                style={inputStyle}
                type={type} name={name} value={form[name]}
                onChange={handleChange} placeholder={placeholder}
                autoComplete="off"
                onFocus={e => e.target.style.borderBottomColor = theme.accent}
                onBlur={e => e.target.style.borderBottomColor = theme.border}
              />
            </div>
          ))}

          <div style={{ marginBottom: '2rem' }}>
            <textarea
              style={{ ...inputStyle, resize: 'none' }}
              name="message" value={form.message}
              onChange={handleChange}
              placeholder="Tell me about your project..."
              rows={5}
              onFocus={e => e.target.style.borderBottomColor = theme.accent}
              onBlur={e => e.target.style.borderBottomColor = theme.border}
            />
          </div>

          {error && (
            <p style={{ color: '#ff4466', fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', marginBottom: '1rem' }}>
              {error}
            </p>
          )}

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div key="success"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '1.2rem',
                  border: `1px solid ${theme.accentBorder}`,
                  color: theme.accent,
                  fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', letterSpacing: '0.05em',
                }}
              >
                ✓ Message sent! Talk soon.
              </motion.div>
            ) : (
              <motion.button key="btn" type="submit"
                disabled={status === 'loading'}
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
                {status === 'loading' ? 'SENDING...' : 'SEND MESSAGE →'}
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
          © 2026 Ayush Gupta
        </span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['GitHub', 'LinkedIn', 'Twitter'].map(s => (
            <a key={s} href="#"
              style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: theme.muted, textDecoration: 'none', transition: 'color 0.3s' }}
              onMouseEnter={e => e.target.style.color = theme.accent}
              onMouseLeave={e => e.target.style.color = theme.muted}
            >
              {s}
            </a>
          ))}
        </div>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: theme.muted }}>
          Designed & Built with ❤️
        </span>
      </motion.div>
    </section>
  );
};

export default Contact;
