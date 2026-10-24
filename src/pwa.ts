export * from './hooks/usePWAInstall';

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const host = window.location.hostname || '';
  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true;
  }

  const isPreviewEnv =
    isInIframe ||
    host.includes('ais-dev-') ||
    host.includes('ais-pre-') ||
    host === 'localhost' ||
    host === '127.0.0.1';

  if (isPreviewEnv) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {});
        }
      })
      .catch(() => {});

    if ('caches' in window) {
      caches
        .keys()
        .then((names) => {
          for (const name of names) {
            caches.delete(name).catch(() => {});
          }
        })
        .catch(() => {});
    }
    return;
  }

  // Production registration is handled in index.html for PWABuilder compliance
}
