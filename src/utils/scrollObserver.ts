/**
 * Centralized High-Performance IntersectionObserver
 * One single observer instance for the entire app to eliminate observer memory overhead.
 */

type RevealCallback = (entry: IntersectionObserverEntry) => void;

const callbacks = new Map<Element, RevealCallback>();

let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cb = callbacks.get(entry.target);
            if (cb) {
              cb(entry);
              callbacks.delete(entry.target);
              if (sharedObserver) {
                sharedObserver.unobserve(entry.target);
              }
            }
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '120px 0px',
      }
    );
  }

  return sharedObserver;
}

/**
 * Register an element for one-time reveal animation via the shared observer.
 * Automatically unobserves after entering viewport.
 */
export function observeReveal(element: Element | null, callback: RevealCallback): () => void {
  if (!element) return () => {};

  const observer = getObserver();
  if (!observer) {
    // Fallback if IntersectionObserver not available
    callback({ isIntersecting: true } as IntersectionObserverEntry);
    return () => {};
  }

  callbacks.set(element, callback);
  observer.observe(element);

  return () => {
    callbacks.delete(element);
    observer.unobserve(element);
  };
}
