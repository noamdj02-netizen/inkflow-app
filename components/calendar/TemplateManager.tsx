/**
 * Gestion des templates de disponibilités : sauvegarder la semaine courante, appliquer un template.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTemplates, getTemplateTotalHours } from '../../hooks/useTemplates';
import type { DisponibilitesState } from '../../types/calendar';

export interface TemplateManagerProps {
  /** Récupère le planning actuel (ex. copyWeek depuis useDisponibilites) */
  getCurrentSchedule: () => DisponibilitesState;
  /** Applique un planning (ex. pasteWeek depuis useDisponibilites) */
  applySchedule: (schedule: DisponibilitesState) => void;
  className?: string;
}

export function TemplateManager({
  getCurrentSchedule,
  applySchedule,
  className = '',
}: TemplateManagerProps) {
  const { templates, createTemplate, deleteTemplate } = useTemplates();
  const [saving, setSaving] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const saveAsTemplate = async () => {
    setSaving(true);
    try {
      const schedule = getCurrentSchedule();
      createTemplate({
        name: 'Semaine type',
        schedule,
        recurrence: 'weekly',
      });
      toast.success('Template sauvegardé !');
    } catch (e) {
      toast.error('Impossible de sauvegarder le template');
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setApplyingId(templateId);
    try {
      applySchedule(template.schedule);
      toast.success('Template appliqué !');
    } catch (e) {
      toast.error('Impossible d\'appliquer le template');
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={saveAsTemplate}
          disabled={saving}
          className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-white border border-white/10 hover:bg-white/15 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={16} />
          Sauvegarder comme template
        </button>
      </div>

      {templates.length > 0 && (
        <div className="grid gap-2">
          <p className="text-sm font-medium text-zinc-400">Mes templates</p>
          {templates.map((template) => {
            const totalHours = getTemplateTotalHours(template.schedule);
            const isApplying = applyingId === template.id;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium text-white">{template.name}</p>
                    <p className="text-sm text-zinc-500">{totalHours}h / semaine</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                      disabled={!!applyingId}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-400/30 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                    >
                      {isApplying ? 'Application…' : 'Appliquer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteTemplate(template.id);
                        toast('Template supprimé');
                      }}
                      aria-label="Supprimer le template"
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
