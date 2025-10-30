export function trackEvent(eventName: string, props?: Record<string, any>) {
  try {
    // Example: integrate with real analytics later
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event: eventName, ...props });
    // eslint-disable-next-line no-console
    console.debug('[track]', eventName, props || {});
  } catch {}
}


