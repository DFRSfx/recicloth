import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string;
const CONSENT_KEY = 'recicloth_cookie_consent';

declare function gtag(...args: unknown[]): void;

const AnalyticsTracker = () => {
  const location = useLocation();
  const consentGranted = useRef(false);

  useEffect(() => {
    if (!MEASUREMENT_ID || typeof gtag === 'undefined') return;
    if (localStorage.getItem(CONSENT_KEY) !== 'true') return;

    // Grant consent once per session
    if (!consentGranted.current) {
      gtag('consent', 'update', { analytics_storage: 'granted' });
      consentGranted.current = true;
    }

    // Defer one tick so page-level title effects (SEO/helmet) run first
    const id = setTimeout(() => {
      gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }, 0);
    return () => clearTimeout(id);
  }, [location]);

  return null;
};

export default AnalyticsTracker;
