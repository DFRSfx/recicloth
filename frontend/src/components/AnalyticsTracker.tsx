import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';

const CONSENT_KEY = 'recicloth_cookie_consent';
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const initGa = () => {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (consent === 'true') {
        ReactGA.initialize(MEASUREMENT_ID);
      }
    };

    initGa();
    window.addEventListener('recicloth:cookie-consent-changed', initGa);
    return () => window.removeEventListener('recicloth:cookie-consent-changed', initGa);
  }, []);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent !== 'true') return;

    ReactGA.send({
      hitType: 'pageview',
      page: `${location.pathname}${location.search}`,
    });
  }, [location]);

  return null;
};

export default AnalyticsTracker;
