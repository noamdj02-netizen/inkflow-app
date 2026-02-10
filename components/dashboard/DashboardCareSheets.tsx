import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Save, Trash2, ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Database } from '../../types/supabase';

type CareTemplate = Database['public']['Tables']['care_templates']['Row'];

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
};

export const DashboardCareSheets: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<CareTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => templates.find(t => t.id === selectedId) || null, [templates, selectedId]);

  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const autosize = () => {
    const el = contentRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(520, Math.max(140, el.scrollHeight))}px`;
  };

  useEffect(() => {
    autosize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftContent]);

  const loadTemplates = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('care_templates')
        .select('*')
        .eq('artist_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
      if (!selectedId && data && data.length > 0) setSelectedId(data[0].id);
    } catch (e) {
      toast.error('Impossible de charger les templates', {
        description: e instanceof Error ? e.message : 'Erreur inconnue',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (selected) {
      setDraftTitle(selected.title || '');
      setDraftContent(selected.content || '');
      queueMicrotask(() => autosize());
    } else {
      setDraftTitle('');
      setDraftContent('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const createTemplate = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('care_templates')
        .insert({
          artist_id: user.id,
          title: 'Nouveau template',
          content: `Après votre séance :\n\n- Gardez le pansement X heures\n- Lavez doucement à l’eau tiède + savon neutre\n- Appliquez une fine couche de crème\n- Évitez soleil/piscine 2 semaines\n`,
        })
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Erreur lors de la création du template');
      setTemplates(prev => [data, ...prev]);
      setSelectedId(data.id);
      toast.success('Template créé');
    } catch (e) {
      toast.error('Création impossible', { description: e instanceof Error ? e.message : 'Erreur inconnue' });
    } finally {
      setSaving(false);
    }
  };

  const saveTemplate = async () => {
    if (!user || !selected) return;
    const title = draftTitle.trim();
    const content = draftContent.trim();
    if (!title) return toast.error('Titre requis');
    if (!content) return toast.error('Contenu requis');

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('care_templates')
        .update({
          title,
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selected.id)
        .eq('artist_id', user.id)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Template introuvable');
      setTemplates(prev => prev.map(t => (t.id === data.id ? data : t)));
      toast.success('Template enregistré');
    } catch (e) {
      toast.error('Enregistrement impossible', { description: e instanceof Error ? e.message : 'Erreur inconnue' });
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!user) return;
    const ok = window.confirm('Supprimer ce template ?');
    if (!ok) return;

    setDeleting(id);
    try {
      const { error } = await supabase.from('care_templates').delete().eq('id', id).eq('artist_id', user.id);
      if (error) throw error;
      setTemplates(prev => prev.filter(t => t.id !== id));
      if (selectedId === id) setSelectedId(null);
      toast.success('Template supprimé');
    } catch (e) {
      toast.error('Suppression impossible', { description: e instanceof Error ? e.message : 'Erreur inconnue' });
    } finally {
      setDeleting(null);
    }
  };

  const snippet = (s: string) => (s || '').replace(/\s+/g, ' ').trim().slice(0, 90);

  return (
    <div className="flex-1 flex flex-col bg-[#050505] min-h-0">
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-6 py-5 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard/settings')}
                className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Retour"
              >
                <ArrowLeft size={18} className="text-zinc-300" />
              </button>
              <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                  <FileText className="text-brand-yellow" size={20} />
                </div>
                Care Sheets
              </h1>
            </div>
            <p className="text-zinc-500 text-sm mt-2">
              Créez vos templates de soins post-tatouage, puis envoyez-les en 1 clic depuis un projet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={createTemplate}
              disabled={!user || saving}
              className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-zinc-100 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={16} /> Nouveau
            </motion.button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="lg:col-span-1">
            <div className="glass rounded-2xl p-4">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Mes templates</div>

              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-white/5 border border-white/5" />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="text-zinc-500" size={20} />
                  </div>
                  <div className="text-white font-medium mb-1">Aucun template</div>
                  <div className="text-zinc-500 text-sm">Créez un premier care sheet pour gagner du temps.</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        t.id === selectedId ? 'bg-white/10 border-white/15' : 'bg-white/5 border-white/5 hover:bg-white/8'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{t.title}</div>
                          <div className="text-zinc-500 text-xs mt-1 truncate">{snippet(t.content)}</div>
                        </div>
                        <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                          {new Date(t.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="lg:col-span-2">
            <div className="glass rounded-2xl p-5">
              {!selected ? (
                <div className="p-10 text-center">
                  <div className="text-white font-semibold mb-1">Sélectionnez un template</div>
                  <div className="text-zinc-500 text-sm">Ou créez-en un nouveau pour commencer.</div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500 uppercase tracking-wider">Titre</label>
                      <input
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="mt-2 w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="Ex: Soins — Fine Line (standard)"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={saveTemplate}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-zinc-100 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Save size={16} />
                        {saving ? 'Sauvegarde…' : 'Enregistrer'}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => deleteTemplate(selected.id)}
                        disabled={deleting === selected.id}
                        className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 font-semibold hover:bg-red-500/15 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        {deleting === selected.id ? 'Suppression…' : 'Supprimer'}
                      </motion.button>
                    </div>
                  </div>

                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Contenu (texte)</label>
                  <textarea
                    ref={contentRef}
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    className="mt-2 w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors resize-none"
                    placeholder={"Ex:\n- Retirez le film après 3h\n- Lavez 2x/jour\n- Appliquez une fine couche de crème\n- Évitez soleil et piscine 2 semaines"}
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-600">
                    <span>Astuce: écrivez en listes “- …” pour une lecture claire dans l’email.</span>
                    <span className="font-mono">{draftContent.length} chars</span>
                  </div>

                  <AnimatePresence>
                    {draftContent.trim().length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Aperçu (email)</div>
                        <div className="text-sm text-zinc-300 whitespace-pre-wrap">{draftContent}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCareSheets;

