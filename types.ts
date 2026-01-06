export enum AppView {
  LANDING = 'LANDING',
  CLIENT_HOME = 'CLIENT_HOME',
  FLASH_GALLERY = 'FLASH_GALLERY',
  CUSTOM_PROJECT = 'CUSTOM_PROJECT',
  ARTIST_DASHBOARD = 'ARTIST_DASHBOARD'
}

export interface FlashDesign {
  id: string;
  title: string;
  price: number;
  size: string; // e.g., "10x10 cm"
  imageUrl: string;
  available: boolean;
  style: string;
}

export interface CustomProjectRequest {
  bodyPart: string;
  sizeCm: number;
  style: string;
  description: string;
  budget?: string;
  isCoverUp: boolean;
  isFirstTattoo: boolean;
  availability: string[]; // Days of week
  referenceImageCount: number; // For UI simulation
}

export interface AIAnalysisResult {
  estimatedTimeHours: number;
  complexityScore: number; // 1-10
  suggestedPriceRange: string;
  technicalNotes: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  date: string;
  type: 'Flash' | 'Custom';
  status: 'Confirmed' | 'Pending' | 'Deposit Paid';
  price: number;
}

// ============================================
// Types compatibles avec Supabase
// ============================================

// Helper pour convertir Flash Supabase vers FlashDesign UI
export const mapFlashToFlashDesign = (flash: import('./types/supabase').Flash): FlashDesign => ({
  id: flash.id,
  title: flash.title,
  price: flash.prix / 100, // Conversion centimes -> euros
  size: flash.taille_cm || 'N/A',
  imageUrl: flash.image_url,
  available: flash.statut === 'available',
  style: flash.style || 'N/A'
});