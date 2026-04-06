import { useState, useEffect, useRef } from 'react';
import {
  Send, Trash2, Edit2, Plus, Users,
  Loader2, AlertCircle, CheckCircle, ArrowLeft, Image,
  FileText,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
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

// ── Simple toolbar for the HTML editor ───────────────────────────────────────
function EditorToolbar({ editor, onImageUpload }: { editor: any; onImageUpload: () => void }) {
  if (!editor) return null;
  const btn = (action: () => void, label: string, active?: boolean) => (
    <button
      type="button"
      onClick={action}
      title={label}
      className={`px-2 py-1 text-sm rounded transition-colors ${active ? 'bg-primary-100 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-md">
      {btn(() => editor.chain().focus().toggleBold().run(), 'B', editor.isActive('bold'))}
      {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', editor.isActive('heading', { level: 3 }))}
      {btn(() => editor.chain().focus().toggleBulletList().run(), '• List', editor.isActive('bulletList'))}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. List', editor.isActive('orderedList'))}
      {btn(() => editor.chain().focus().setParagraph().run(), '¶')}
      <div className="w-px bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={onImageUpload}
        className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
        title="Inserir imagem"
      >
        <Image className="h-4 w-4" /> Imagem
      </button>
    </div>
  );
}

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
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [rawHtml, setRawHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initial?.content_html || '',
    onUpdate({ editor }) {
      setRawHtml(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && initial?.content_html) {
      setRawHtml(initial.content_html);
    }
  }, [editor, initial?.content_html]);

  const getContent = () => {
    if (mode === 'html') return rawHtml;
    return editor?.getHTML() || '';
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const data = await authFetch(API('/admin/upload-image'), { method: 'POST', body: form });
      if (data?.url && editor) {
        editor.chain().focus().insertContent(`<img src="${data.url}" alt="newsletter image" style="max-width:100%;height:auto;" />`).run();
      }
    } catch (e: any) {
      setError(`Erro ao fazer upload: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!subject.trim()) { setError('Assunto obrigatório'); return; }
    const html = getContent();
    if (!html || html === '<p></p>') { setError('Conteúdo obrigatório'); return; }
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assunto *</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Ex: Novidades de abril — Recicloth"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Conteúdo *</label>
            <div className="flex border border-gray-200 rounded overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => {
                  if (mode === 'html') {
                    editor?.commands.setContent(rawHtml);
                  }
                  setMode('visual');
                }}
                className={`px-3 py-1 transition-colors ${mode === 'visual' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Visual
              </button>
              <button
                type="button"
                onClick={() => {
                  setRawHtml(editor?.getHTML() || rawHtml);
                  setMode('html');
                }}
                className={`px-3 py-1 transition-colors ${mode === 'html' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                HTML
              </button>
            </div>
          </div>

          {mode === 'visual' ? (
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <EditorToolbar
                editor={editor}
                onImageUpload={() => fileRef.current?.click()}
              />
              <EditorContent
                editor={editor}
                className="prose max-w-none p-4 min-h-[240px] focus:outline-none text-sm"
              />
            </div>
          ) : (
            <textarea
              value={rawHtml}
              onChange={e => setRawHtml(e.target.value)}
              rows={14}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono text-xs resize-y"
              placeholder="<p>Conteúdo HTML da newsletter...</p>"
            />
          )}
        </div>

        {/* Hidden file input for image upload */}
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

        {uploading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> A fazer upload da imagem…
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
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

  const handleSend = async (campaign: Campaign) => {
    if (!confirm(`Enviar "${campaign.subject}" para todos os subscritores ativos?`)) return;
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
