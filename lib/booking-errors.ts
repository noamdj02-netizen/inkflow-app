/**
 * Classes d'erreurs personnalisées pour le système de réservation
 * Gestion d'erreurs explicite avec types d'erreurs spécifiques
 */

export class CreneauIndisponibleError extends Error {
  constructor(
    message: string,
    public readonly raison?: string,
    public readonly creneauDebut?: Date,
    public readonly creneauFin?: Date
  ) {
    super(message);
    this.name = 'CreneauIndisponibleError';
    Object.setPrototypeOf(this, CreneauIndisponibleError.prototype);
  }
}

export class ReservationNotFoundError extends Error {
  constructor(reservationId: string) {
    super(`Réservation introuvable: ${reservationId}`);
    this.name = 'ReservationNotFoundError';
    Object.setPrototypeOf(this, ReservationNotFoundError.prototype);
  }
}

export class ClientNotFoundError extends Error {
  constructor(clientId: string) {
    super(`Client introuvable: ${clientId}`);
    this.name = 'ClientNotFoundError';
    Object.setPrototypeOf(this, ClientNotFoundError.prototype);
  }
}

export class ArtisteNotFoundError extends Error {
  constructor(artisteId: string) {
    super(`Artiste introuvable: ${artisteId}`);
    this.name = 'ArtisteNotFoundError';
    Object.setPrototypeOf(this, ArtisteNotFoundError.prototype);
  }
}

export class DureeInvalideError extends Error {
  constructor(duree: number, min: number = 30, max: number = 480) {
    super(`Durée invalide: ${duree} minutes (min: ${min}, max: ${max})`);
    this.name = 'DureeInvalideError';
    Object.setPrototypeOf(this, DureeInvalideError.prototype);
  }
}

export class DatePasseeError extends Error {
  constructor(date: Date) {
    super(`La date ne peut pas être dans le passé: ${date.toISOString()}`);
    this.name = 'DatePasseeError';
    Object.setPrototypeOf(this, DatePasseeError.prototype);
  }
}

export class PaiementEchoueError extends Error {
  constructor(
    message: string,
    public readonly paymentIntentId?: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'PaiementEchoueError';
    Object.setPrototypeOf(this, PaiementEchoueError.prototype);
  }
}

export class ReservationDejaConfirmeeError extends Error {
  constructor(reservationId: string) {
    super(`La réservation ${reservationId} est déjà confirmée`);
    this.name = 'ReservationDejaConfirmeeError';
    Object.setPrototypeOf(this, ReservationDejaConfirmeeError.prototype);
  }
}

export class ReservationDejaAnnuleeError extends Error {
  constructor(reservationId: string) {
    super(`La réservation ${reservationId} est déjà annulée`);
    this.name = 'ReservationDejaAnnuleeError';
    Object.setPrototypeOf(this, ReservationDejaAnnuleeError.prototype);
  }
}

/**
 * Type guard pour vérifier le type d'erreur
 */
export function isCreneauIndisponibleError(error: unknown): error is CreneauIndisponibleError {
  return error instanceof CreneauIndisponibleError;
}

export function isReservationNotFoundError(error: unknown): error is ReservationNotFoundError {
  return error instanceof ReservationNotFoundError;
}

export function isPaiementEchoueError(error: unknown): error is PaiementEchoueError {
  return error instanceof PaiementEchoueError;
}
