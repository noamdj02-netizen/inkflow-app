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
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 overflow-hidden flex flex-col min-h-[140px]"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-zinc-400" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Note rapide</h3>
        </div>
        {saved && (
          <span className="text-[10px] text-emerald-400 font-medium">Enregistré</span>
        )}
      </div>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Idées, rappels, notes…"
        className="flex-1 min-h-[80px] w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-colors"
        rows={3}
      />
    </motion.article>
  );
};
