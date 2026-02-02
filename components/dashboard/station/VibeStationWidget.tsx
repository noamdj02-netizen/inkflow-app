/**
 * Widget Station : Vibe – mini lecteur style Spotify/Apple Music.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Music2 } from 'lucide-react';

const FAKE_TRACK = {
  title: 'Ink & Needles',
  artist: 'Tattoo Sessions',
  duration: '2:34',
};

export const VibeStationWidget: React.FC = () => {
  const [playing, setPlaying] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 flex items-center justify-center">
          <Music2 size={20} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Vibe</div>
          <div className="text-sm font-medium text-white truncate">{FAKE_TRACK.title}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setPlaying(!playing)}
          className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shrink-0 hover:bg-zinc-200 transition-colors"
          aria-label={playing ? 'Pause' : 'Lecture'}
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </motion.button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{FAKE_TRACK.title}</div>
          <div className="text-xs text-zinc-400 truncate">{FAKE_TRACK.artist}</div>
        </div>
        <span className="text-xs text-zinc-500 tabular-nums">{FAKE_TRACK.duration}</span>
      </div>
      <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-emerald-400"
          initial={{ width: '0%' }}
          animate={{ width: playing ? '42%' : '0%' }}
          transition={{ duration: 0.3 }}
          style={{ maxWidth: '42%' }}
        />
      </div>
    </motion.article>
  );
};
