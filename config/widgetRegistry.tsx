/**
 * Widget Registry – registre central de tous les widgets du Dashboard.
 * Organisé par catégorie pour le Widget Store (modal Personnaliser).
 */

import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  Calendar,
  CalendarDays,
  Zap,
  Package,
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  BarChart3,
  MessageSquare,
  Activity,
  Target,
  ShoppingCart,
  AlertTriangle,
  TrendingUp as TrendingUpIcon,
} from 'lucide-react';

export type WidgetCategoryId = 'general' | 'calendrier' | 'flashs' | 'clients' | 'finance';

export type WidgetColSpan = 4 | 6 | 8 | 12;

export interface WidgetDefinition {
  id: string;
  category: WidgetCategoryId;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Ordre d'affichage dans la catégorie */
  order: number;
  /** Grille 12 colonnes : 4 = 1/3, 6 = 1/2, 8 = 2/3, 12 = pleine largeur */
  colSpan: WidgetColSpan;
}

export interface WidgetCategory {
  id: WidgetCategoryId;
  label: string;
  icon: LucideIcon;
  order: number;
}

export const WIDGET_CATEGORIES: WidgetCategory[] = [
  { id: 'general', label: 'Général', icon: LayoutGrid, order: 0 },
  { id: 'calendrier', label: 'Calendrier', icon: Calendar, order: 1 },
  { id: 'flashs', label: 'Flashs', icon: Zap, order: 2 },
  { id: 'clients', label: 'Clients', icon: Users, order: 3 },
  { id: 'finance', label: 'Finance', icon: DollarSign, order: 4 },
];

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  // ——— Général (KPI en premier : 3 cartes × 4 cols = 12) ———
  {
    id: 'kpi',
    category: 'general',
    title: 'Statistiques',
    description: 'CA du mois, RDV à venir, demandes en attente.',
    icon: BarChart3,
    order: 0,
    colSpan: 12,
  },
  {
    id: 'stats',
    category: 'general',
    title: 'Statistiques détaillées',
    description: 'CA du mois, nombre de clients, taux de remplissage avec évolution.',
    icon: TrendingUpIcon,
    order: 0.5,
    colSpan: 12,
  },
  {
    id: 'alerts',
    category: 'general',
    title: 'Alertes',
    description: 'Acomptes en attente, confirmations, RDV aujourd\'hui.',
    icon: AlertTriangle,
    order: 1.5,
    colSpan: 6,
  },
  {
    id: 'upcomingBookings',
    category: 'calendrier',
    title: 'RDV de la semaine',
    description: 'Tous les rendez-vous d\'aujourd\'hui et de la semaine à venir.',
    icon: CalendarDays,
    order: 1,
    colSpan: 6,
  },
  {
    id: 'nextAppointment',
    category: 'general',
    title: 'Prochains RDV',
    description: 'Liste des 3 prochains clients avec heure et projet.',
    icon: CalendarDays,
    order: 1,
    colSpan: 12,
  },
  {
    id: 'revenue',
    category: 'general',
    title: 'Revenus du mois',
    description: 'Courbe du CA et détail des revenus.',
    icon: DollarSign,
    order: 2,
    colSpan: 8,
  },
  {
    id: 'recentActivity',
    category: 'general',
    title: 'Activité récente',
    description: 'Dernières réservations et actions sur le compte.',
    icon: Activity,
    order: 3,
    colSpan: 4,
  },
  {
    id: 'pending',
    category: 'general',
    title: 'Demandes en attente',
    description: 'Projets et demandes à traiter.',
    icon: MessageSquare,
    order: 4,
    colSpan: 4,
  },
  {
    id: 'flashes',
    category: 'general',
    title: 'Mes Flashes',
    description: 'Aperçu galerie et lien vers la page Flashs.',
    icon: Zap,
    order: 5,
    colSpan: 4,
  },
  // ——— Calendrier ———
  {
    id: 'dayView',
    category: 'calendrier',
    title: 'Vue Journée',
    description: 'Mini timeline des créneaux du jour.',
    icon: CalendarDays,
    order: 0,
    colSpan: 12,
  },
  // ——— Flashs ———
  {
    id: 'topFlashs',
    category: 'flashs',
    title: 'Top Flashs',
    description: 'Les dessins les plus vendus.',
    icon: TrendingUp,
    order: 0,
    colSpan: 4,
  },
  {
    id: 'stock',
    category: 'flashs',
    title: 'Stock',
    description: 'Combien de flashs restants.',
    icon: Package,
    order: 1,
    colSpan: 4,
  },
  // ——— Clients ———
  {
    id: 'newVsRegular',
    category: 'clients',
    title: 'Nouveaux vs Habitués',
    description: 'Ratio du mois (nouveaux clients / habitués).',
    icon: Users,
    order: 0,
    colSpan: 4,
  },
  {
    id: 'lastRegistered',
    category: 'clients',
    title: 'Derniers inscrits',
    description: 'Liste des derniers clients inscrits.',
    icon: UserPlus,
    order: 1,
    colSpan: 4,
  },
  // ——— Finance ———
  {
    id: 'monthlyGoal',
    category: 'finance',
    title: 'Objectif du mois',
    description: 'Jauge de progression du CA vers l\'objectif.',
    icon: Target,
    order: 0,
    colSpan: 4,
  },
  {
    id: 'averageCart',
    category: 'finance',
    title: 'Panier Moyen',
    description: 'Montant moyen par réservation.',
    icon: ShoppingCart,
    order: 1,
    colSpan: 4,
  },
];

export const ALL_WIDGET_IDS = WIDGET_REGISTRY.map((w) => w.id);
export type WidgetId = (typeof ALL_WIDGET_IDS)[number];

export function getWidgetById(id: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY.find((w) => w.id === id);
}

export function getWidgetsByCategory(categoryId: WidgetCategoryId): WidgetDefinition[] {
  return WIDGET_REGISTRY.filter((w) => w.category === categoryId).sort((a, b) => a.order - b.order);
}

export const DEFAULT_ACTIVE_WIDGET_IDS: WidgetId[] = [
  'kpi',
  'nextAppointment',
  'revenue',
  'recentActivity',
  'flashes',
  'pending',
  'topFlashs', // remplit le trou à droite (4 cols) sur la même ligne que Mes Flashes + Demandes
];
