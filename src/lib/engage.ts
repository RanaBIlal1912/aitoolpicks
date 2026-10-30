// Runs `start` the first time the visitor does something (moves the pointer, scrolls, touches, presses a key), or after `fallbackMs` if they are just
// reading. Heavy decoration such as WebGL waits for this so it never competes with loading the page. Returns a cleanup function.
export function whenEngaged(start: () => void, fallbackMs = 10000): () => void {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    start();
  };
  const events = ["pointermove", "scroll", "touchstart", "keydown", "pointerdown"] as const;
  const timer = window.setTimeout(run, fallbackMs);
  function cleanup() {
    clearTimeout(timer);
    for (const e of events) window.removeEventListener(e, run);
  }
  for (const e of events) window.addEventListener(e, run, { passive: true });
  return () => {
    done = true;
    cleanup();
  };
}
