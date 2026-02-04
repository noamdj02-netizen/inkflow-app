/**
 * Exemple d'utilisation du système de réservation avec gestion d'erreurs explicite
 * Composant React montrant comment utiliser creerReservation avec try/catch
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { creerReservation } from '../lib/booking-service';
import {
  CreneauIndisponibleError,
  ClientNotFoundError,
  ArtisteNotFoundError,
  isCreneauIndisponibleError,
} from '../lib/booking-errors';
import type { CreerReservationData } from '../types/booking';

export const BookingFormExample: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreerReservationData>>({
    clientId: '',
    tatoueurId: '',
    dateDebut: new Date(),
    duree: 120,
    type: 'session',
    prix: 200,
    acompte: 60,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data: CreerReservationData = {
        clientId: formData.clientId!,
        tatoueurId: formData.tatoueurId!,
        dateDebut: formData.dateDebut!,
        duree: formData.duree!,
        type: formData.type!,
        prix: formData.prix!,
        acompte: formData.acompte,
        projetDescription: formData.projetDescription,
        zone: formData.zone,
        taille: formData.taille,
        style: formData.style,
        photosReference: formData.photosReference,
        notes: formData.notes,
      };

      const result = await creerReservation(data);
      
      toast.success('Réservation créée avec succès !');
      console.log('Réservation créée:', result);
    } catch (error) {
      // Gestion d'erreurs explicite avec types d'erreurs spécifiques
      if (error instanceof CreneauIndisponibleError) {
        toast.error(`Ce créneau n'est plus disponible${error.raison ? `: ${error.raison}` : ''}`);
      } else if (error instanceof ClientNotFoundError) {
        toast.error('Client introuvable. Veuillez vérifier l\'ID du client.');
      } else if (error instanceof ArtisteNotFoundError) {
        toast.error('Artiste introuvable. Veuillez vérifier l\'ID de l\'artiste.');
      } else if (isCreneauIndisponibleError(error)) {
        // Alternative avec type guard
        toast.error(`Créneau indisponible: ${error.raison || error.message}`);
      } else if (error instanceof Error) {
        // Erreur de validation Zod ou autre
        toast.error(`Erreur: ${error.message}`);
      } else {
        toast.error('Une erreur inconnue est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Client ID</label>
        <input
          type="text"
          value={formData.clientId}
          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Artiste ID</label>
        <input
          type="text"
          value={formData.tatoueurId}
          onChange={(e) => setFormData({ ...formData, tatoueurId: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Date de début</label>
        <input
          type="datetime-local"
          value={formData.dateDebut?.toISOString().slice(0, 16)}
          onChange={(e) => setFormData({ ...formData, dateDebut: new Date(e.target.value) })}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Durée (minutes)</label>
        <input
          type="number"
          value={formData.duree}
          onChange={(e) => setFormData({ ...formData, duree: parseInt(e.target.value) })}
          min={30}
          max={480}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
          required
        >
          <option value="consultation">Consultation</option>
          <option value="session">Session</option>
          <option value="retouche">Retouche</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Prix (€)</label>
        <input
          type="number"
          value={formData.prix}
          onChange={(e) => setFormData({ ...formData, prix: parseFloat(e.target.value) })}
          min={0}
          max={10000}
          step="0.01"
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 disabled:opacity-50"
      >
        {loading ? 'Création...' : 'Créer la réservation'}
      </button>
    </form>
  );
};
