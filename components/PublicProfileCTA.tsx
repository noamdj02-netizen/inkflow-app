import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronRight, MessageSquare, Zap } from 'lucide-react';

type PublicProfileCTATheme = {
  primary: string;
  primaryHover: string;
  primaryText: string;
  primaryBg: string;
};

type TabKey = 'flashs' | 'project';

export interface PublicProfileCTAProps {
  theme: PublicProfileCTATheme;
  themeColor: string;
  accentHex?: string | null;
  secondaryHex?: string | null;
  artistEmail?: string | null;
  artistName: string;
  profileUrl?: string;
  isHidden?: boolean;
  onSelectTab: (tab: TabKey) => void;
  onScrollToTabs?: () => void;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toDateTimeLocalValue(d: Date) {
  // Format for <input type="datetime-local">: YYYY-MM-DDTHH:mm
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function roundToNext30Min(date: Date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const minutes = d.getMinutes();
  const remainder = minutes % 30;
  if (remainder !== 0) d.setMinutes(minutes + (30 - remainder));
  return d;
}

export const PublicProfileCTA: React.FC<PublicProfileCTAProps> = ({
  theme,
  themeColor,
  accentHex,
  secondaryHex,
  artistEmail,
  artistName,
  profileUrl,
  isHidden,
  onSelectTab,
  onScrollToTabs,
}) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'choices' | 'consultation'>('choices');

  const isAmberTheme = themeColor === 'amber';
  const hasCustom = Boolean(accentHex);
  const ctaButtonClass = hasCustom
    ? 'text-white hover:brightness-110'
    : isAmberTheme
      ? 'bg-white text-black hover:bg-zinc-100'
      : `${theme.primary} ${theme.primaryHover} text-white`;

  const defaultConsultDate = useMemo(() => roundToNext30Min(new Date()), []);
  const [consultDateTime, setConsultDateTime] = useState<string>(() => toDateTimeLocalValue(defaultConsultDate));
  const [consultError, setConsultError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setTimeout(() => setView('choices'), 200);
    setConsultError(null);
  };

  const goToTab = (tab: TabKey) => {
    onSelectTab(tab);
    close();
    // Laisser l'animation se terminer avant le scroll
    setTimeout(() => onScrollToTabs?.(), 220);
  };

  const sendConsultationRequest = () => {
    setConsultError(null);

    if (!artistEmail) {
      setConsultError('Contact indisponible pour le moment.');
      return;
    }

    const when = consultDateTime ? consultDateTime.replace('T', ' ') : '';
    const subject = encodeURIComponent(`Demande de consultation (30min) — ${artistName}`);
    const body = encodeURIComponent(
      [
        `Bonjour ${artistName},`,
        '',
        `Je souhaite réserver une consultation / discussion de 30 minutes.`,
        `Créneau souhaité: ${when}`,
        profileUrl ? `Lien du profil: ${profileUrl}` : '',
        '',
        'Merci !',
      ]
        .filter(Boolean)
        .join('\n')
    );

    if (typeof window !== 'undefined') {
      window.location.href = `mailto:${artistEmail}?subject=${subject}&body=${body}`;
    }

    close();
  };

  if (isHidden) return null;

  return (
    <>
      {/* Sticky Bottom Bar (Mobile only) */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 pointer-events-none">
        <div className="pointer-events-auto glass shadow-xl rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">Agenda ouvert</div>
              <div className="text-xs text-zinc-400">Réponse rapide • Réservation simple</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            style={hasCustom ? { background: `linear-gradient(135deg, ${accentHex}, ${secondaryHex || accentHex})` } : undefined}
            className={`ml-3 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-[0.98] ${ctaButtonClass}`}
          >
            Prendre RDV
          </button>
        </div>
      </div>

      {/* Sheet / Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-[60]"
            >
              <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl px-4 pt-4 pb-6">
                {/* Handle */}
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-1.5 bg-white/10 rounded-full" />
                </div>

                {view === 'choices' ? (
                  <div className="space-y-3">
                    <div className="px-1">
                      <div className="text-lg font-black text-white">Prendre rendez-vous</div>
                      <div className="text-sm text-slate-400">Choisissez le type de demande</div>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => goToTab('flashs')}
                        className="w-full text-left bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.primaryBg}`}>
                            <Zap className={theme.primaryText} size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-white">⚡ Réserver un Flash</div>
                            <div className="text-sm text-zinc-400">Voir les flashs disponibles</div>
                          </div>
                        </div>
                        <ChevronRight className="text-zinc-500" size={20} />
                      </button>

                      <button
                        type="button"
                        onClick={() => goToTab('project')}
                        className="w-full text-left bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <MessageSquare className="text-white" size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-white">🎨 Projet Perso</div>
                            <div className="text-sm text-zinc-400">Décrire votre idée & disponibilités</div>
                          </div>
                        </div>
                        <ChevronRight className="text-zinc-500" size={20} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setView('consultation')}
                        className="w-full text-left bg-slate-900/60 border border-slate-700 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                            <Calendar className="text-slate-200" size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-white">📅 Consultation / Discussion</div>
                            <div className="text-sm text-slate-400">Choisir un créneau de 30 min</div>
                          </div>
                        </div>
                        <ChevronRight className="text-slate-500" size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="px-1">
                      <div className="text-lg font-black text-white">Consultation (30 min)</div>
                      <div className="text-sm text-slate-400">Choisissez un créneau, on prépare le message.</div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-4">
                      <label className="block text-sm font-semibold text-slate-200 mb-2">
                        Date & heure
                      </label>
                      <input
                        type="datetime-local"
                        step={1800}
                        value={consultDateTime}
                        onChange={(e) => setConsultDateTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-slate-500"
                      />
                      <p className="text-xs text-slate-400 mt-2">
                        Durée: <span className="font-semibold text-slate-200">30 min</span>
                      </p>
                      {consultError && (
                        <p className="text-xs text-red-300 mt-2">{consultError}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setView('choices')}
                        className="flex-1 bg-slate-900/60 border border-slate-700 text-slate-200 rounded-xl py-3 font-semibold hover:bg-slate-900 transition-colors"
                      >
                        Retour
                      </button>
                      <button
                        type="button"
                        onClick={sendConsultationRequest}
                        className={`flex-1 rounded-xl py-3 font-bold shadow-lg transition-all active:scale-[0.98] ${ctaButtonClass}`}
                      >
                        Envoyer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

