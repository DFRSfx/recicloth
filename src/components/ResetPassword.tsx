import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Lock, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const token = searchParams.get('token');

  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  useEffect(() => {
    if (!token) {
      showError('Token de redefinição inválido');
      navigate('/');
    }
  }, [token, navigate, showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errors: Record<string, string> = {};
    if (!password) errors.password = 'Campo obrigatório';
    if (!confirmPassword) errors.confirmPassword = 'Campo obrigatório';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {
        password: passwordRef,
        confirmPassword: confirmPasswordRef,
      };
      const firstKey = Object.keys(errors)[0];
      refs[firstKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      refs[firstKey]?.current?.focus();
      return;
    }

    if (password.length < 6) {
      setFieldErrors({ password: 'A senha deve ter pelo menos 6 caracteres' });
      passwordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      passwordRef.current?.focus();
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'As senhas não coincidem' });
      confirmPasswordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      confirmPasswordRef.current?.focus();
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const response = await fetch('/api/password-reset/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha');
      }

      success('Senha redefinida com sucesso! Pode agora iniciar sessão.');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha. Tente novamente.');
      showError(err.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-primary-600" size={32} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Redefinir Senha
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Digite a sua nova senha
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha
              </label>
              <input
                ref={passwordRef}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Mínimo 6 caracteres"
              />
              {fieldErrors.password && (
                <p className="mt-1.5 text-sm text-red-500">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha
              </label>
              <input
                ref={confirmPasswordRef}
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError('confirmPassword');
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Repita a senha"
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-500">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'A redefinir...' : 'Redefinir Senha'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Já tem conta?{' '}
            <button
              onClick={() => navigate('/')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Iniciar Sessão
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
