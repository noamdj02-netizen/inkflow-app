import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Save, Trash2, ArrowLeft, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../ThemeToggle';
import type { Database } from '../../types/supabase';

type CareTemplate = Database['public']['Tables']['care_templates']['Row'];

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
};

export const DashboardCareSheets: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();

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
      const templatesData = data as any;
      setTemplates(templatesData || []);
      if (!selectedId && templatesData && templatesData.length > 0) setSelectedId(templatesData[0]?.id);
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
      const insertData: any = {
        artist_id: user.id,
        title: 'Nouveau template',
        content: `Après votre séance :\n\n- Gardez le pansement X heures\n- Lavez doucement à l'eau tiède + savon neutre\n- Appliquez une fine couche de crème\n- Évitez soleil/piscine 2 semaines\n`,
      };
      const { data, error } = await (supabase as any)
        .from('care_templates')
        .insert(insertData)
      const templateData = data as any;
      setTemplates(prev => [templateData, ...prev]);
      setSelectedId(templateData.id);
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
      const updateData: any = {
        title,
        content,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await (supabase as any)
        .from('care_templates')
        .update(updateData)
        .eq('id', selected.id)
        .eq('artist_id', user.id)
        .select('*')
        .single();

      if (error) throw error;
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
    <div className="flex-1 flex flex-col bg-background min-h-0 transition-colors duration-300">
      <header className="bg-card/95 backdrop-blur-md border-b border-border shadow-sm px-6 py-5 flex-shrink-0 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-background/50 border border-border hover:bg-background transition-colors"
                aria-label="Retour"
              >
                <ArrowLeft size={18} className="text-foreground-muted" />
              </button>
              <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 dark:bg-primary/20 border border-border">
                  <FileText className="text-primary" size={20} />
                </div>
                Care Sheets
              </h1>
              <ThemeToggle size="md" variant="outline" />
            </div>
            <p className="text-foreground-muted text-sm mt-2">
              Créez vos templates de soins post-tatouage, puis envoyez-les en 1 clic depuis un projet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={createTemplate}
              disabled={!user || saving}
              className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={16} /> Nouveau
            </motion.button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="lg:col-span-1">
            <div className="rounded-2xl p-4 bg-card border border-border shadow-sm">
              <div className="text-xs uppercase tracking-wider text-foreground-muted mb-3">Mes templates</div>

              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-background/50 border border-border" />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-background/50 border border-border">
                    <FileText className="text-foreground-muted" size={20} />
                  </div>
                  <div className="text-foreground font-medium mb-1">Aucun template</div>
                  <div className="text-foreground-muted text-sm">Créez un premier care sheet pour gagner du temps.</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        t.id === selectedId ? 'bg-background border-border shadow-sm' : 'bg-background/50 border-border hover:bg-background'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-foreground font-semibold truncate">{t.title}</div>
                          <div className="text-foreground-muted text-xs mt-1 truncate">{snippet(t.content)}</div>
                        </div>
                        <span className="text-[10px] text-foreground-muted font-mono shrink-0">
                          {format(new Date(t.updated_at), 'd MMM', { locale: fr })}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="lg:col-span-2">
            <div className="rounded-2xl p-5 bg-card border border-border shadow-sm">
              {!selected ? (
                <div className="p-10 text-center">
                  <div className="text-foreground font-semibold mb-1">Sélectionnez un template</div>
                  <div className="text-foreground-muted text-sm">Ou créez-en un nouveau pour commencer.</div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <label className="text-xs text-foreground-muted uppercase tracking-wider">Titre</label>
                      <input
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="mt-2 w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                        placeholder="Ex: Soins — Fine Line (standard)"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={saveTemplate}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Save size={16} />
                        {saving ? 'Sauvegarde…' : 'Enregistrer'}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => deleteTemplate(selected.id)}
                        disabled={deleting === selected.id}
                        className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-semibold hover:bg-red-500/15 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        {deleting === selected.id ? 'Suppression…' : 'Supprimer'}
                      </motion.button>
                    </div>
                  </div>

                  <label className="text-xs text-foreground-muted uppercase tracking-wider">Contenu (texte)</label>
                  <textarea
                    ref={contentRef}
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    className="mt-2 w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors resize-none"
                    placeholder={"Ex:\n- Retirez le film après 3h\n- Lavez 2x/jour\n- Appliquez une fine couche de crème\n- Évitez soleil et piscine 2 semaines"}
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-foreground-muted">
                    <span>Astuce: écrivez en listes “- …” pour une lecture claire dans l’email.</span>
                    <span className="font-mono">{draftContent.length} chars</span>
                  </div>

                  <AnimatePresence>
                    {draftContent.trim().length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="mt-5 p-4 rounded-xl bg-background/50 border border-border"
                      >
                        <div className="text-xs uppercase tracking-wider text-foreground-muted mb-2">Aperçu (email)</div>
                        <div className="text-sm text-foreground whitespace-pre-wrap">{draftContent}</div>
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

