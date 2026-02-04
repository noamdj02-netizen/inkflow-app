/**
 * Types stricts pour le système de réservation
 */

export type StatutReservation = "en_attente" | "confirmee" | "annulee" | "terminee";

export type TypeReservation = "consultation" | "session" | "retouche";

export type MethodePaiement = "stripe" | "especes" | "virement";

export type StatutPaiement = "en_attente" | "regle" | "rembourse";

export interface Reservation {
  id: string;
  clientId: string;
  tatoueurId: string;
  dateDebut: Date;
  dateFin: Date;
  duree: number; // en minutes
  type: TypeReservation;
  statut: StatutReservation;
  prix: number;
  acompte?: number;
  acompteRegle: boolean;
  projetDescription: string;
  zone: string;
  taille: string;
  style: string;
  photosReference: string[];
  rappelsEnvoyes: Date[];
  notes: string;
}

export interface CreerReservationData {
  clientId: string;
  tatoueurId: string;
  dateDebut: Date;
  duree: number;
  type: TypeReservation;
  prix: number;
  acompte?: number;
  projetDescription?: string;
  zone?: string;
  taille?: string;
  style?: string;
  photosReference?: string[];
  notes?: string;
}
