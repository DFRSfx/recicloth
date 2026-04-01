import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { getRoutePath } from '../utils/routes';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { info } = useToast();
  const { t, lang } = useLanguage();
  const homePath = getRoutePath('home', lang);
  const contactPath = getRoutePath('contact', lang);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage(t('verifyEmail.error.title'));
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || t('verifyEmail.success.title'));
          
          // Update user in context if logged in
          if (user) {
            const updatedUser = { ...user, emailVerified: true };
            updateUser(updatedUser);
          }
        } else {
          setStatus('error');
          setMessage(data.error || t('verifyEmail.error.title'));
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage(t('verifyEmail.error.title'));
      }
    };

    verifyEmail();
  }, [token, user, updateUser, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-primary-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {t('verifyEmail.loading.title')}
              </h1>
              <p className="text-gray-600">
                {t('verifyEmail.loading.desc')}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-primary-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {t('verifyEmail.success.title')}
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-primary-800">
                  {t('verifyEmail.success.desc')}
                </p>
              </div>
              <button
                onClick={() => navigate(homePath)}
                className="mt-6 w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
              >
                {t('verifyEmail.success.goHome')}
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {t('verifyEmail.error.title')}
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 mb-3">
                  <strong>{t('verifyEmail.error.causesLabel')}</strong>
                </p>
                <ul className="text-sm text-red-700 text-left space-y-2">
                  <li>• {t('verifyEmail.error.cause1')}</li>
                  <li>• {t('verifyEmail.error.cause2')}</li>
                  <li>• {t('verifyEmail.error.cause3')}</li>
                </ul>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(homePath)}
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  {t('common.backToHome')}
                </button>
                <button
                  onClick={() => {
                    // TODO: Implementar reenvio de email
                    info('Funcionalidade de reenvio em desenvolvimento');
                  }}
                  className="w-full border-2 border-primary-600 text-primary-600 py-3 px-6 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                >
                  <Mail className="inline-block h-5 w-5 mr-2" />
                  {t('verifyEmail.error.resend')}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Help text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('verifyEmail.help')}{' '}
            <a href={contactPath} className="text-primary-600 hover:text-primary-700 font-medium">
              {t('verifyEmail.contactUs')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
