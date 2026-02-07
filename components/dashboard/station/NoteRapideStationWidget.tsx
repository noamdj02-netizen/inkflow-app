/**
 * Widget Station : Note Rapide – bloc-notes persistant (localStorage).
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

const STORAGE_KEY = 'widget_station_note_rapide';
const DEBOUNCE_MS = 400;

export const NoteRapideStationWidget: React.FC = () => {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored != null) setText(stored);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, text);
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 1500);
      return () => clearTimeout(t);
    }, DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-100 dark:border-[#262626] bg-white dark:bg-[#121212] p-4 overflow-hidden flex flex-col min-h-[140px] shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-slate-500 dark:text-neutral-400" />
          <h3 className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Note rapide</h3>
        </div>
        {saved && (
          <span className="text-[10px] text-dash-success font-medium">Enregistré</span>
        )}
      </div>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Idées, rappels, notes…"
        className="flex-1 min-h-[80px] w-full resize-none rounded-lg border border-slate-100 dark:border-[#262626] bg-[#eff6f3] dark:bg-[#0a0a0a] px-3 py-2 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-dash-primary/30 focus:border-dash-primary transition-colors"
        rows={3}
      />
    </motion.article>
  );
};
