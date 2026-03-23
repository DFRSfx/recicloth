import React, { useState, useRef, useEffect } from 'react';
import {
  Mail, Phone, Instagram, Send, ChevronDown,
  ShoppingBag, Package, Sparkles, MessageCircle, FileText,
} from 'lucide-react';
import SEO from '../components/SEO';
import { getLocalBusinessSchema, getFAQSchema } from '../utils/schemas';

const subjectOptions = [
  { value: 'produto', label: 'Dúvida sobre produto', icon: ShoppingBag },
  { value: 'pedido', label: 'Estado do pedido', icon: Package },
  { value: 'personalizado', label: 'Pedido personalizado', icon: Sparkles },
  { value: 'geral', label: 'Informação geral', icon: MessageCircle },
  { value: 'outro', label: 'Outro', icon: FileText },
];

type FormData = { name: string; email: string; subject: string; message: string };
type FormErrors = Partial<FormData>;

const Contact: React.FC = () => {
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
    if (!formData.name.trim()) errs.name = 'Por favor introduza o seu nome.';
    if (!formData.email.trim()) {
      errs.email = 'Por favor introduza o seu email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Email inválido.';
    }
    if (!formData.subject) errs.subject = 'Por favor selecione um assunto.';
    if (!formData.message.trim()) errs.message = 'Por favor escreva a sua mensagem.';
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
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1000);
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
      question: 'Quanto tempo demora um pedido personalizado?',
      answer: 'Os pedidos personalizados levam entre 2 a 4 semanas, dependendo da complexidade do projeto.',
    },
    {
      question: 'Fazem entregas em todo o país?',
      answer: 'Sim! Fazemos entregas em todo Portugal continental e ilhas.',
    },
    {
      question: 'Que materiais utilizam?',
      answer: 'Utilizamos apenas linhas de alta qualidade, preferencialmente 100% algodão, adequadas para cada tipo de produto.',
    },
  ];

  const schemas = {
    '@context': 'https://schema.org',
    '@graph': [getLocalBusinessSchema(), getFAQSchema(faqs)],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Contacto"
        description="Entre em contacto com Arte em Ponto. Estamos disponíveis para esclarecer dúvidas, fazer encomendas personalizadas e ajudar com qualquer questão sobre os nossos produtos em crochê."
        canonical="/contacto"
        ogType="website"
        schema={schemas}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Entre em Contacto</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tem alguma dúvida sobre os nossos produtos ou gostaria de fazer um pedido personalizado?
            Estamos aqui para ajudar!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Information */}
          <div className="flex flex-col h-full">
            <div className="bg-white rounded-lg shadow-sm p-8 h-full">
              <h2 className="text-2xl font-semibold mb-8">Informações de Contacto</h2>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="p-3 bg-primary-50 rounded-full mr-4 flex-shrink-0">
                    <Phone className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Telefone</h3>
                    <p className="text-gray-600 mt-1">+351 919 626 697</p>
                    <p className="text-sm text-gray-400 mt-1">Segunda a Sexta, 9h às 18h</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="p-3 bg-primary-50 rounded-full mr-4 flex-shrink-0">
                    <Mail className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Email</h3>
                    <a
                      href="mailto:arteemponto1972@gmail.com"
                      className="text-gray-600 hover:text-primary-600 transition-colors mt-1 block"
                    >
                      arteemponto1972@gmail.com
                    </a>
                    <p className="text-sm text-gray-400 mt-1">Respondemos em 24h</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="p-3 bg-primary-50 rounded-full mr-4 flex-shrink-0">
                    <Instagram className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Instagram</h3>
                    <a
                      href="https://www.instagram.com/arteemponto.croche/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-primary-600 transition-colors mt-1 block"
                    >
                      @arteemponto.croche
                    </a>
                    <p className="text-sm text-gray-400 mt-1">Veja o nosso processo criativo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="flex flex-col h-full">
            <div className="bg-white rounded-lg shadow-sm p-8 h-full">
              <h2 className="text-2xl font-semibold mb-6">Envie-nos uma Mensagem</h2>
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <Send className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Mensagem Enviada!
                  </h3>
                  <p className="text-gray-600 text-center max-w-xs mb-8">
                    Obrigado pelo seu contacto. Responderemos o mais breve possível.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-4"
                  >
                    Enviar Nova Mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome <span className="text-primary-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={inputClass('name')}
                        placeholder="O seu nome"
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-primary-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={inputClass('email')}
                        placeholder="email@exemplo.pt"
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Custom subject dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assunto <span className="text-primary-500">*</span>
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
                            'Selecione um assunto'
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
                      Mensagem <span className="text-primary-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleInputChange}
                      className={`${inputClass('message')} resize-y`}
                      placeholder="Como podemos ajudar?"
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
                      'A Enviar...'
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Enviar Mensagem
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
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-gray-600">
              Respostas às dúvidas mais comuns dos nossos clientes
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
