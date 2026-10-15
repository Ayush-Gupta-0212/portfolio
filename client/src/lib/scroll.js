/*
 * In-page scrolling that cooperates with Lenis. Native smooth scrolling
 * (scrollIntoView / scrollTo with behavior:'smooth') can fight Lenis's own
 * animation, so everything that jumps around the page goes through here.
 */
let lenis = null;

export const setLenis = (instance) => { lenis = instance; };

/**
 * @param {string|HTMLElement|number} target  CSS selector, element, or y position
 */
export const scrollToTarget = (target, { immediate = false } = {}) => {
  if (lenis) {
    lenis.scrollTo(target, { immediate, duration: 1.4 });
    return;
  }
  const behavior = immediate ? 'auto' : 'smooth';
  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior });
    return;
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  el?.scrollIntoView({ behavior });
};
