import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { info } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token de verificação inválido');
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
          setMessage(data.message || 'Email verificado com sucesso!');
          
          // Update user in context if logged in
          if (user) {
            const updatedUser = { ...user, emailVerified: true };
            updateUser(updatedUser);
          }
        } else {
          setStatus('error');
          setMessage(data.error || 'Erro ao verificar email');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Erro ao verificar email. Por favor, tente novamente.');
      }
    };

    verifyEmail();
  }, [token, user, updateUser]);

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
                A verificar email...
              </h1>
              <p className="text-gray-600">
                Por favor aguarde enquanto verificamos o seu email.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-primary-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Email Verificado com Sucesso!
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-primary-800">
                  A sua conta está agora ativa e pode aceder a todas as funcionalidades da Arte em Ponto.
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="mt-6 w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Ir para a página inicial
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Erro na Verificação
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 mb-3">
                  <strong>Possíveis causas:</strong>
                </p>
                <ul className="text-sm text-red-700 text-left space-y-2">
                  <li>• O link de verificação expirou (válido por 1 hora)</li>
                  <li>• O email já foi verificado anteriormente</li>
                  <li>• O link está incorreto ou foi alterado</li>
                </ul>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Voltar ao início
                </button>
                <button
                  onClick={() => {
                    // TODO: Implementar reenvio de email
                    info('Funcionalidade de reenvio em desenvolvimento');
                  }}
                  className="w-full border-2 border-primary-600 text-primary-600 py-3 px-6 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                >
                  <Mail className="inline-block h-5 w-5 mr-2" />
                  Reenviar email de verificação
                </button>
              </div>
            </>
          )}
        </div>

        {/* Help text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Precisa de ajuda?{' '}
            <a href="/contacto" className="text-primary-600 hover:text-primary-700 font-medium">
              Entre em contacto
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
