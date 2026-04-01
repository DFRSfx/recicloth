import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { getRoutePath } from '../utils/routes';

const CheckoutFail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const { t, lang } = useLanguage();
  const homePath = getRoutePath('home', lang);
  const cartPath = getRoutePath('cart', lang);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SEO
          title={t('checkout.fail.title')}
          description={t('checkout.fail.desc')}
          canonical={getRoutePath('checkoutFail', lang)}
          ogType="website"
        />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('checkout.fail.title')}
          </h1>

          <p className="text-gray-600 mb-8">
            {t('checkout.fail.desc')}
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• {t('checkout.fail.reason.cancelled')}</li>
              <li>• {t('checkout.fail.reason.invalidCard')}</li>
              <li>• {t('checkout.fail.reason.insufficient')}</li>
              <li>• {t('checkout.fail.reason.creditLimit')}</li>
              <li>• {t('checkout.fail.reason.bankError')}</li>
            </ul>
          </div>

          {orderId && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left">
              <p className="text-sm text-yellow-800">
                <strong>{t('checkout.fail.note')}</strong> {t('checkout.fail.orderNote')}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={homePath}
              className="flex-1 px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
            >
              {t('common.backToHome')}
            </Link>
            <Link
              to={cartPath}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              {t('checkout.fail.retry')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFail;
