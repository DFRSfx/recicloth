import { useState, useEffect, useRef } from 'react';
import { useConfirmStore } from '../../hooks/useConfirm';
import {
  Send, Trash2, Edit2, Plus, Users,
  Loader2, AlertCircle, CheckCircle, ArrowLeft, Image,
  FileText, Code, X as XIcon,
} from 'lucide-react';
import { apiService } from '../../utils/api';

const API = (path: string) => `/api/newsletter${path}`;

interface Subscriber {
  id: number;
  email: string;
  user_name?: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at?: string;
}

interface Campaign {
  id: number;
  subject: string;
  status: 'draft' | 'sent';
  sent_at?: string;
  sent_count: number;
  created_at: string;
  updated_at: string;
}

type View = 'list' | 'subscribers' | 'create' | 'edit';

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = apiService.getToken();
  const isForm = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (!isForm) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    let err: any;
    try { err = JSON.parse(text); } catch { err = { error: text }; }
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
};

// ── Campaign form (create / edit) ─────────────────────────────────────────────
function CampaignForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Campaign & { content_html?: string };
  onSave: () => void;
  onCancel: () => void;
}) {
  const [subject, setSubject] = useState(initial?.subject || '');
  const [mode, setMode] = useState<'html' | 'image'>('html');
  const [rawHtml, setRawHtml] = useState(initial?.content_html || '');
  // For image mode: uploaded URL + preview
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Detect if existing campaign was image-based and restore preview
  useEffect(() => {
    if (initial?.content_html) {
      const match = initial.content_html.match(/src="([^"]+)"/);
      if (match && initial.content_html.includes('<img') && !initial.content_html.includes('<p>')) {
        setMode('image');
        setImageUrl(match[1]);
        setImagePreview(match[1]);
      }
    }
  }, []);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('image', file);
      const data = await authFetch(API('/admin/upload-image'), { method: 'POST', body: form });
      if (data?.url) {
        setImageUrl(data.url);
        setImagePreview(data.url);
      }
    } catch (e: any) {
      setError(`Erro ao fazer upload: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const getContent = (): string => {
    if (mode === 'html') return rawHtml.trim();
    if (!imageUrl) return '';
    return `<div style="text-align:center;padding:24px 0;">
  <img src="${imageUrl}" alt="Newsletter" style="max-width:100%;height:auto;display:inline-block;" />
</div>`;
  };

  const handleSave = async () => {
    if (!subject.trim()) { setError('Assunto obrigatório'); return; }
    const html = getContent();
    if (!html) { setError(mode === 'image' ? 'Carregue uma imagem' : 'Conteúdo HTML obrigatório'); return; }
    setSaving(true);
    setError('');
    try {
      if (initial?.id) {
        await authFetch(API(`/admin/campaigns/${initial.id}`), {
          method: 'PUT',
          body: JSON.stringify({ subject, content_html: html }),
        });
      } else {
        await authFetch(API('/admin/campaigns'), {
          method: 'POST',
          body: JSON.stringify({ subject, content_html: html }),
        });
      }
      onSave();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900">
          {initial ? 'Editar Campanha' : 'Nova Campanha'}
        </h2>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assunto *</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Ex: Novidades de abril — Recicloth"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          />
        </div>

        {/* Mode selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de conteúdo *</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('html')}
              className={`flex items-center gap-3 px-4 py-3 border-2 rounded-lg text-left transition-colors ${
                mode === 'html'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <Code className="h-5 w-5 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold">HTML</div>
                <div className="text-xs text-gray-400 mt-0.5">Colar código HTML</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode('image')}
              className={`flex items-center gap-3 px-4 py-3 border-2 rounded-lg text-left transition-colors ${
                mode === 'image'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <Image className="h-5 w-5 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold">Imagem</div>
                <div className="text-xs text-gray-400 mt-0.5">Enviar como imagem</div>
              </div>
            </button>
          </div>
        </div>

        {/* HTML mode */}
        {mode === 'html' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código HTML *</label>
            <textarea
              value={rawHtml}
              onChange={e => setRawHtml(e.target.value)}
              rows={16}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono text-xs resize-y"
              placeholder={'<div style="padding:32px;font-family:sans-serif;">\n  <h1>Olá!</h1>\n  <p>Novidades da Recicloth...</p>\n</div>'}
            />
            <p className="mt-1.5 text-xs text-gray-400">
              O HTML será inserido dentro do wrapper de email com cabeçalho Recicloth e rodapé de cancelamento.
            </p>
          </div>
        )}

        {/* Image mode */}
        {mode === 'image' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagem da newsletter *</label>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-80 object-contain"
                />
                <button
                  type="button"
                  onClick={() => { setImageUrl(''); setImagePreview(''); }}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow text-gray-500 hover:text-red-500 transition-colors"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-lg py-12 hover:border-primary-400 hover:bg-primary-50 transition-colors disabled:opacity-50"
              >
                {uploading
                  ? <Loader2 className="h-8 w-8 text-primary-400 animate-spin" />
                  : <Image className="h-8 w-8 text-gray-400" />}
                <span className="text-sm text-gray-500">
                  {uploading ? 'A fazer upload…' : 'Clique para carregar imagem'}
                </span>
                <span className="text-xs text-gray-400">PNG, JPG, WebP — máx. 10 MB</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f);
                e.target.value = '';
              }}
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium text-sm"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function NewsletterAdmin() {
  const [view, setView] = useState<View>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [editingCampaign, setEditingCampaign] = useState<(Campaign & { content_html?: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const { openConfirm } = useConfirmStore();
  const [error, setError] = useState('');
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sendResult, setSendResult] = useState<{ id: number; total: number } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (view === 'list') loadCampaigns();
    if (view === 'subscribers') loadSubscribers();
  }, [view]);

  const loadCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authFetch(API('/admin/campaigns'));
      setCampaigns(data.campaigns || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscribers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authFetch(API('/admin/subscribers'));
      setSubscribers(data.subscribers || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (campaign: Campaign) => {
    try {
      const full = await authFetch(API(`/admin/campaigns/${campaign.id}`));
      setEditingCampaign(full);
      setView('edit');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await authFetch(API(`/admin/campaigns/${id}`), { method: 'DELETE' });
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSend = (campaign: Campaign) => {
    openConfirm({
      title: 'Enviar campanha',
      message: `Enviar "${campaign.subject}" para todos os subscritores ativos? Esta ação não pode ser revertida.`,
      confirmText: 'Enviar',
      confirmButtonClass: 'bg-primary-600 hover:bg-primary-700',
      onConfirm: async () => {
        setSendingId(campaign.id);
        setSendResult(null);
        setError('');
        try {
          const data = await authFetch(API(`/admin/campaigns/${campaign.id}/send`), { method: 'POST' });
          setSendResult({ id: campaign.id, total: data.total });
          loadCampaigns();
        } catch (e: any) {
          setError(e.message);
        } finally {
          setSendingId(null);
        }
      },
    });
  };

  const activeCount = subscribers.filter(s => s.is_active).length;

  // ── Views ──────────────────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="p-6 max-w-3xl">
        <CampaignForm
          onSave={() => { setView('list'); }}
          onCancel={() => setView('list')}
        />
      </div>
    );
  }

  if (view === 'edit' && editingCampaign) {
    return (
      <div className="p-6 max-w-3xl">
        <CampaignForm
          initial={editingCampaign}
          onSave={() => { setEditingCampaign(null); setView('list'); }}
          onCancel={() => { setEditingCampaign(null); setView('list'); }}
        />
      </div>
    );
  }

  if (view === 'subscribers') {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            Subscritores — <span className="text-primary-600">{activeCount} ativos</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilizador</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {subscribers.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{s.email}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{s.user_name || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.is_active ? 'Ativo' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {new Date(s.subscribed_at).toLocaleDateString('pt-PT')}
                    </td>
                  </tr>
                ))}
                {subscribers.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">Sem subscritores ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── Campaign list ──────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
          <p className="text-sm text-gray-500 mt-1">Gerir campanhas e subscritores</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setView('subscribers')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            <Users className="h-4 w-4" />
            Subscritores
          </button>
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Nova Campanha
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          <button className="ml-auto text-red-500 hover:text-red-700" onClick={() => setError('')}>×</button>
        </div>
      )}

      {sendResult && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-md text-sm">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Campanha enviada para {sendResult.total} subscritores com sucesso.
          <button className="ml-auto text-green-600 hover:text-green-800" onClick={() => setSendResult(null)}>×</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Sem campanhas criadas.</p>
          <button
            onClick={() => setView('create')}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Criar primeira campanha
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assunto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enviados</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{c.subject}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {c.status === 'sent' ? 'Enviado' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {c.status === 'sent' ? c.sent_count : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {c.sent_at
                      ? new Date(c.sent_at).toLocaleDateString('pt-PT')
                      : new Date(c.created_at).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {c.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleSend(c)}
                            disabled={sendingId === c.id}
                            title="Enviar para todos"
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
                          >
                            {sendingId === c.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Send className="h-3 w-3" />}
                            Enviar
                          </button>
                          <button
                            onClick={() => handleEdit(c)}
                            title="Editar"
                            className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            title="Eliminar"
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            {deletingId === c.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
                          </button>
                        </>
                      )}
                      {c.status === 'sent' && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Enviado
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
