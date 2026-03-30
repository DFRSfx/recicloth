import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string;
const CONSENT_KEY = 'recicloth_cookie_consent';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (!MEASUREMENT_ID) return;
    if (localStorage.getItem(CONSENT_KEY) !== 'true') return;

    if (!ReactGA.isInitialized) {
      ReactGA.initialize(MEASUREMENT_ID);
    }

    ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search, title: document.title });
  }, [location]);

  return null;
};

export default AnalyticsTracker;
