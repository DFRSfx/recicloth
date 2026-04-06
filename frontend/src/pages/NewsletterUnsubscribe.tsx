import { useState } from 'react';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

type Step = 'email' | 'otp' | 'done';

export default function NewsletterUnsubscribe() {
  const { state } = useLocation() as { state?: { email?: string } };
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(state?.email || '');
  const [emailError, setEmailError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Introduza um email válido.');
      return;
    }
    setEmailError('');
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/unsubscribe/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.message || 'Erro ao enviar código.');
        return;
      }
      setStep('otp');
    } catch {
      setEmailError('Erro de ligação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) { setOtpError('O código deve ter 6 dígitos.'); return; }
    setOtpError('');
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/unsubscribe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.message || 'Código inválido.');
        return;
      }
      setStep('done');
    } catch {
      setOtpError('Erro de ligação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {step === 'done' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscrição cancelada</h1>
            <p className="text-gray-500 text-sm mb-8">
              O email <strong>{email}</strong> foi removido da newsletter da Recicloth. Não receberá mais comunicações nossas.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar à loja
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary-50 rounded-full">
                <Mail className="h-5 w-5 text-primary-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Cancelar subscrição</h1>
            </div>

            {step === 'email' && (
              <>
                <p className="text-sm text-gray-500 mb-7 mt-2">
                  Introduza o email com que subscreveu. Enviaremos um código de confirmação para verificar que é o titular.
                </p>
                <form onSubmit={handleSendOtp} noValidate className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                      placeholder="o-seu@email.com"
                      className={`w-full px-4 py-2.5 border rounded-md outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow text-sm ${emailError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    />
                    {emailError && (
                      <p className="mt-1.5 text-xs text-red-500">{emailError}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm"
                  >
                    {loading ? 'A enviar…' : 'Enviar código de confirmação'}
                  </button>
                </form>
              </>
            )}

            {step === 'otp' && (
              <>
                <p className="text-sm text-gray-500 mb-7 mt-2">
                  Enviámos um código de 6 dígitos para <strong>{email}</strong>. Introduza-o abaixo para confirmar o cancelamento.
                </p>
                <form onSubmit={handleVerify} noValidate className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código de confirmação
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                      placeholder="000000"
                      className={`w-full px-4 py-3 border rounded-md outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-2xl tracking-[0.4em] font-mono transition-shadow ${otpError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    />
                    {otpError && (
                      <p className="mt-1.5 text-xs text-red-500">{otpError}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                  >
                    {loading ? 'A verificar…' : 'Confirmar cancelamento'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setOtpCode(''); setOtpError(''); }}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                  >
                    Usar outro email
                  </button>
                </form>
              </>
            )}

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Voltar à loja
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
