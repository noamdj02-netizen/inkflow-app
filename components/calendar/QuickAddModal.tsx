/**
 * QuickAdd : ajout client + RDV en 3 étapes max (client → créneau → confirmer).
 */
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Clock, CheckCircle, Loader2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SuggestedSlots } from './SuggestedSlots';
import { useExistingClients } from '../../hooks/useExistingClients';
import type { ExistingClient, SuggestedSlot } from '../../types/calendar';

export interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: string | undefined;
  defaultDateTime?: string; // datetime-local format
  onCreate: (payload: {
    client_name: string | null;
    client_email: string;
    client_phone: string | null;
    date_debut: string;
    duree_minutes: number;
  }) => Promise<void>;
  formRef?: React.RefObject<HTMLDivElement | null>;
}

const STEPS = [
  { id: 1, label: 'Client', icon: User },
  { id: 2, label: 'Créneau', icon: Clock },
  { id: 3, label: 'Confirmer', icon: CheckCircle },
];

export function QuickAddModal({
  isOpen,
  onClose,
  artistId,
  defaultDateTime = '',
  onCreate,
  formRef,
}: QuickAddModalProps) {
  const [step, setStep] = useState(1);
  const [clientChoice, setClientChoice] = useState<'existing' | 'new'>('new');
  const [selectedClient, setSelectedClient] = useState<ExistingClient | null>(null);
  const [newClient, setNewClient] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
  });
  const [duree_minutes, setDureeMinutes] = useState(60);
  const [date_debut, setDateDebut] = useState(defaultDateTime);
  const [saving, setSaving] = useState(false);

  const { clients, loading: loadingClients } = useExistingClients(artistId);

  const clientDisplay = (): { name: string; email: string; phone: string } => {
    if (clientChoice === 'existing' && selectedClient) {
      return {
        name: selectedClient.client_name || selectedClient.client_email,
        email: selectedClient.client_email,
        phone: selectedClient.client_phone || '',
      };
    }
    return {
      name: newClient.client_name.trim(),
      email: newClient.client_email.trim(),
      phone: newClient.client_phone.trim(),
    };
  };

  const canGoStep2 = () => {
    if (clientChoice === 'existing') return !!selectedClient?.client_email;
    return newClient.client_email.trim().length > 0;
  };

  const canGoStep3 = () => {
    return !!date_debut && duree_minutes > 0;
  };

  const handleSelectSlot = (slot: SuggestedSlot) => {
    setDateDebut(format(slot.start, "yyyy-MM-dd'T'HH:mm"));
    setDureeMinutes(Math.round((slot.end.getTime() - slot.start.getTime()) / 60000));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canGoStep2() || !canGoStep3()) return;
    setSaving(true);
    try {
      const { name, email, phone } = clientDisplay();
      await onCreate({
        client_name: name || null,
        client_email: email,
        client_phone: phone || null,
        date_debut,
        duree_minutes,
      });
      onClose();
      reset();
    } catch (_) {
      // Parent handles toast + shake
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep(1);
    setClientChoice('new');
    setSelectedClient(null);
    setNewClient({ client_name: '', client_email: '', client_phone: '' });
    setDureeMinutes(60);
    setDateDebut(defaultDateTime || '');
  };

  const handleClose = () => {
    if (!saving) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentIcon = STEPS.find((s) => s.id === step)?.icon ?? User;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 safe-area-inset-bottom"
      >
        <div
          ref={formRef as React.RefObject<HTMLDivElement>}
          className="bg-[#0a0a0a] border border-white/10 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-6 pb-[env(safe-area-inset-bottom,0)] sm:pb-6 relative max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 text-white">
                {React.createElement(currentIcon, { size: 18 })}
              </span>
              <div>
                <h2 className="text-lg font-display font-bold text-white">Nouveau RDV</h2>
                <p className="text-xs text-zinc-500">
                  Étape {step} / 3 · {STEPS[step - 1].label}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Fermer"
              onClick={handleClose}
              disabled={saving}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-zinc-500 hover:text-white transition-colors touch-manipulation disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex gap-2 mb-6">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s.id <= step ? 'bg-brand-mint' : 'bg-white/10'
                }`}
                aria-hidden
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <p className="text-sm text-zinc-400">Qui est le client ?</p>
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setClientChoice('existing')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      clientChoice === 'existing'
                        ? 'bg-white text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Client existant
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientChoice('new')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      clientChoice === 'new'
                        ? 'bg-white text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <UserPlus size={16} /> Nouveau
                  </button>
                </div>

                {clientChoice === 'existing' ? (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto">
                    {loadingClients ? (
                      <p className="text-sm text-zinc-500 py-4">Chargement des clients…</p>
                    ) : clients.length === 0 ? (
                      <p className="text-sm text-zinc-500 py-4">Aucun client précédent. Passez en « Nouveau ».</p>
                    ) : (
                      clients.map((c) => (
                        <button
                          key={c.client_email}
                          type="button"
                          onClick={() => setSelectedClient(c)}
                          className={`w-full text-left p-3 rounded-xl border transition-colors ${
                            selectedClient?.client_email === c.client_email
                              ? 'border-brand-mint bg-brand-mint/10 text-white'
                              : 'border-white/10 hover:border-white/20 text-zinc-300'
                          }`}
                        >
                          <p className="font-medium text-white">
                            {c.client_name || c.client_email}
                          </p>
                          <p className="text-xs text-zinc-500">{c.client_email}</p>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Nom</label>
                      <input
                        type="text"
                        autoComplete="name"
                        value={newClient.client_name}
                        onChange={(e) => setNewClient((p) => ({ ...p, client_name: e.target.value }))}
                        className="w-full min-h-[44px] bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                        placeholder="Jean Dupont"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        autoComplete="email"
                        value={newClient.client_email}
                        onChange={(e) => setNewClient((p) => ({ ...p, client_email: e.target.value }))}
                        className="w-full min-h-[44px] bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                        placeholder="jean@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        autoComplete="tel"
                        value={newClient.client_phone}
                        onChange={(e) => setNewClient((p) => ({ ...p, client_phone: e.target.value }))}
                        className="w-full min-h-[44px] bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canGoStep2()}
                  className="w-full min-h-[44px] py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuer · Créneau
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <p className="text-sm text-zinc-400">Quand ? Choisissez un créneau ou une date/heure.</p>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Durée</label>
                  <select
                    value={duree_minutes}
                    onChange={(e) => setDureeMinutes(Number(e.target.value))}
                    className="w-full min-h-[44px] bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>1 h</option>
                    <option value={90}>1 h 30</option>
                    <option value={120}>2 h</option>
                    <option value={180}>3 h</option>
                  </select>
                </div>
                <SuggestedSlots
                  durationMin={duree_minutes}
                  onSelect={handleSelectSlot}
                  className="mt-2"
                />
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Ou date et heure</label>
                  <input
                    type="datetime-local"
                    value={date_debut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full min-h-[44px] bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 min-h-[44px] py-3 rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!canGoStep3()}
                    className="flex-1 min-h-[44px] py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Récapitulatif
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <p className="text-sm text-zinc-400">Vérifiez et confirmez.</p>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-white font-medium">{clientDisplay().name || clientDisplay().email}</p>
                  <p className="text-sm text-zinc-500">{clientDisplay().email}</p>
                  {clientDisplay().phone && (
                    <p className="text-sm text-zinc-500">{clientDisplay().phone}</p>
                  )}
                  <p className="text-sm text-zinc-400 mt-2">
                    {date_debut
                      ? format(new Date(date_debut), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
                      : '—'}
                    {' · '}
                    {duree_minutes} min
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={saving}
                    className="flex-1 min-h-[44px] py-3 rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 min-h-[44px] py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    {saving ? 'Création…' : 'Créer le RDV'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
