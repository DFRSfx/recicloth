import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string;
const CONSENT_KEY = 'recicloth_cookie_consent';

declare function gtag(...args: unknown[]): void;

const AnalyticsTracker = () => {
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  const sendPageView = useCallback(() => {
    if (!MEASUREMENT_ID || typeof gtag === 'undefined') return;
    if (localStorage.getItem(CONSENT_KEY) !== 'true') return;

    gtag('consent', 'update', { analytics_storage: 'granted' });

    // Defer one tick so page-level title effects (SEO/helmet) run first
    setTimeout(() => {
      gtag('event', 'page_view', {
        page_path: locationRef.current.pathname + locationRef.current.search,
        page_title: document.title,
      });
    }, 0);
  }, []);

  // Track on every route change
  useEffect(() => {
    sendPageView();
  }, [location, sendPageView]);

  // Track immediately when user accepts cookies mid-session
  useEffect(() => {
    const handler = () => sendPageView();
    window.addEventListener('recicloth:cookie-consent-changed', handler);
    return () => window.removeEventListener('recicloth:cookie-consent-changed', handler);
  }, [sendPageView]);

  return null;
};

export default AnalyticsTracker;
