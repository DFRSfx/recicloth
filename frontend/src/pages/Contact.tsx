import React, { useState, useRef, useEffect } from 'react';
import {
  Mail, Phone, Instagram, Send, ChevronDown,
  ShoppingBag, Package, Sparkles, MessageCircle, FileText,
} from 'lucide-react';
import SEO from '../components/SEO';
import { getLocalBusinessSchema, getFAQSchema } from '../utils/schemas';
import { useLanguage } from '../context/LanguageContext';
import { getRoutePath } from '../utils/routes';

type FormData = { name: string; email: string; subject: string; message: string };
type FormErrors = Partial<FormData>;

const Contact: React.FC = () => {
  const { t, lang } = useLanguage();

  // Move subjectOptions inside the component to access t()
  const subjectOptions = [
    { value: 'produto', label: t('contact.form.subjects.product'), icon: ShoppingBag },
    { value: 'pedido', label: t('contact.form.subjects.order'), icon: Package },
    { value: 'tamanhos', label: t('contact.form.subjects.sizing'), icon: Sparkles },
    { value: 'geral', label: t('contact.form.subjects.general'), icon: MessageCircle },
    { value: 'outro', label: t('contact.form.subjects.other'), icon: FileText },
  ];

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const subjectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (subjectRef.current && !subjectRef.current.contains(e.target as Node)) {
        setSubjectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!formData.name.trim()) errs.name = t('contact.form.errors.name');
    if (!formData.email.trim()) {
      errs.email = t('contact.form.errors.email');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = t('contact.form.errors.emailInvalid');
    }
    if (!formData.subject) errs.subject = t('contact.form.errors.subject');
    if (!formData.message.trim()) errs.message = t('contact.form.errors.message');
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('send failed');
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      setErrors({ message: t('contact.form.errors.sendFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubjectSelect = (value: string) => {
    setFormData(prev => ({ ...prev, subject: value }));
    setErrors(prev => ({ ...prev, subject: undefined }));
    setSubjectOpen(false);
  };

  const selectedSubject = subjectOptions.find(o => o.value === formData.subject);

  const inputClass = (field: keyof FormErrors) =>
    `w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  // SEO setup with FAQ schema
  const faqs = [
    {
      question: t('contact.faq.q1'),
      answer: t('contact.faq.a1'),
    },
    {
      question: t('contact.faq.q2'),
      answer: t('contact.faq.a2'),
    },
    {
      question: t('contact.faq.q3'),
      answer: t('contact.faq.a3'),
    },
  ];

  const schemas = {
    '@context': 'https://schema.org',
    '@graph': [getLocalBusinessSchema(lang), getFAQSchema(faqs)],
  };

  return (
    <div className="min-h-screen bg-gray-50">
        <SEO
          title="Contacto"
          description="Entre em contacto com a Recicloth. Estamos disponíveis para esclarecer dúvidas sobre moda sustentável, roupas recicladas e entregas. Apoio personalizado para cada cliente."
          canonical={getRoutePath('contact', lang)}
          ogType="website"
          schema={schemas}
        />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('contact.title')}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Information */}
          <div className="flex flex-col h-full">
            <div className="bg-white rounded-lg shadow-sm p-8 h-full">
              <h2 className="text-2xl font-semibold mb-8">{t('contact.info.title')}</h2>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="p-3 bg-primary-50 rounded-full mr-4 flex-shrink-0">
                    <Phone className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{t('contact.info.phone')}</h3>
                    <p className="text-gray-600 mt-1">{t('contact.info.phoneValue')}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('contact.info.hours')}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="p-3 bg-primary-50 rounded-full mr-4 flex-shrink-0">
                    <Mail className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{t('form.email')}</h3>
                    <a
                      href="mailto:general@recicloth.com"
                      className="text-gray-600 hover:text-primary-600 transition-colors mt-1 block"
                    >
                      general@recicloth.com
                    </a>
                    <p className="text-sm text-gray-400 mt-1">{t('contact.info.emailResponse')}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="p-3 bg-primary-50 rounded-full mr-4 flex-shrink-0">
                    <Instagram className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{t('contact.info.instagram')}</h3>
                    <a
                      href="https://www.instagram.com/recicloth/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-primary-600 transition-colors mt-1 block"
                    >
                      {t('contact.info.instagramHandle')}
                    </a>
                    <p className="text-sm text-gray-400 mt-1">{t('contact.info.instagramDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="flex flex-col h-full">
            <div className="bg-white rounded-lg shadow-sm p-8 h-full">
              <h2 className="text-2xl font-semibold mb-6">{t('contact.form.title')}</h2>
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <Send className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {t('contact.form.success.title')}
                  </h3>
                  <p className="text-gray-600 text-center max-w-xs mb-8">
                    {t('contact.form.success.desc')}
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-4"
                  >
                    {t('contact.form.success.newMessage')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('form.name')} <span className="text-primary-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={inputClass('name')}
                        placeholder={t('contact.form.namePlaceholder')}
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('form.email')} <span className="text-primary-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={inputClass('email')}
                        placeholder={t('contact.form.emailPlaceholder')}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Custom subject dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('contact.form.subject')} <span className="text-primary-500">*</span>
                    </label>
                    <div ref={subjectRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setSubjectOpen(prev => !prev)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-md bg-white text-left outline-none transition-shadow focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.subject ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <span className={`flex items-center gap-2 ${!selectedSubject ? 'text-gray-400' : 'text-gray-900'}`}>
                          {selectedSubject ? (
                            <>
                              <selectedSubject.icon className="h-4 w-4 text-primary-500 flex-shrink-0" />
                              {selectedSubject.label}
                            </>
                          ) : (
                            t('contact.form.subjectPlaceholder')
                          )}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${subjectOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {subjectOpen && (
                        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                          {subjectOptions.map(opt => {
                            const Icon = opt.icon;
                            const isSelected = formData.subject === opt.value;
                            return (
                              <li key={opt.value}>
                                <button
                                  type="button"
                                  onClick={() => handleSubjectSelect(opt.value)}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-primary-50 hover:text-primary-700 ${
                                    isSelected ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                                  }`}
                                >
                                  <Icon className="h-4 w-4 flex-shrink-0" />
                                  {opt.label}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                    {errors.subject && (
                      <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('contact.form.message')} <span className="text-primary-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleInputChange}
                      className={`${inputClass('message')} resize-y`}
                      placeholder={t('contact.form.messagePlaceholder')}
                      style={{ minHeight: '120px' }}
                    />
                    {errors.message && (
                      <p className="mt-1 text-xs text-red-500">{errors.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-6 rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow active:scale-[0.99] font-semibold"
                  >
                    {isSubmitting ? (
                      t('contact.form.sending')
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        {t('contact.form.submit')}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('common.faqTitle')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('contact.faq.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
