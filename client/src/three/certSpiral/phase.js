// Scroll phases (fractions of the pinned scroll), shared by the spiral and the React timeline.
// Kept separate so the section can build its timeline before the WebGL chunk arrives.
export const PHASE = {
  spiralEnd: 0.62,
  gridStart: 0.5,
  gridEnd: 0.84,
  swapStart: 0.84,
  swapEnd: 0.9,
};
