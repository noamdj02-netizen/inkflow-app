/**
 * Widget Station : Timer – chronomètre simple (sessions facturées à l'heure).
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const TimerStationWidget: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now() - elapsedRef.current;
    const id = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3">
        <Timer size={16} className="text-zinc-400" />
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Chronomètre</h3>
      </div>
      <div className="text-center py-2">
        <span className="text-3xl font-mono font-bold tabular-nums text-white tracking-tight">
          {formatTime(elapsed)}
        </span>
      </div>
      <div className="flex items-center justify-center gap-2 mt-3">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setRunning(!running)}
          className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shrink-0 hover:bg-zinc-200 transition-colors"
          aria-label={running ? 'Pause' : 'Démarrer'}
        >
          {running ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleReset}
          className="w-10 h-10 rounded-full bg-white/10 text-zinc-300 flex items-center justify-center shrink-0 hover:bg-white/15 transition-colors"
          aria-label="Réinitialiser"
        >
          <RotateCcw size={18} />
        </motion.button>
      </div>
    </motion.article>
  );
};
