/**
 * ============================================================
 * MODULE NOTIFICATIONS - Volley Péi
 * ============================================================
 *
 * Architecture prête pour activer plus tard :
 *  - Notifications de nouveaux tournois
 *  - Rappels d'événements
 *  - Notifications de modifications
 *  - Notifications sponsors
 *
 * État actuel : INACTIF (les fonctions sont stub)
 * Pour activer :
 *  1. Exécuter `supabase/notifications.sql` (table + RLS)
 *  2. Activer le flag NOTIFICATIONS_ENABLED ci-dessous
 *  3. Implémenter le service de push (Web Push API, OneSignal, etc.)
 * ============================================================
 */

import { supabase } from './supabase';

// ============================================================
// FLAGS DE CONFIGURATION
// ============================================================

export const NOTIFICATIONS_ENABLED = false;

// ============================================================
// TYPES
// ============================================================

export type NotificationType =
  | 'tournament_new'      // Nouveau tournoi publié
  | 'tournament_update'   // Tournoi modifié
  | 'tournament_reminder' // Rappel J-1 / H-1
  | 'sponsor_new'         // Nouveau sponsor
  | 'system';             // Annonce générale

export interface Notification {
  id: string;
  created_at: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  user_id?: string | null; // null = notification globale
  metadata?: Record<string, unknown>;
}

export interface PushSubscription {
  id: string;
  endpoint: string;
  created_at: string;
  // Préférences
  topics: NotificationType[];
}

// ============================================================
// API (stub - prêt à implémenter)
// ============================================================

/**
 * Récupère les notifications de l'utilisateur courant.
 * Pour l'instant : retourne un tableau vide.
 */
export async function fetchNotifications(): Promise<Notification[]> {
  if (!NOTIFICATIONS_ENABLED) return [];

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  return (data as Notification[]) ?? [];
}

/**
 * Marque une notification comme lue.
 */
export async function markAsRead(id: string): Promise<void> {
  if (!NOTIFICATIONS_ENABLED) return;
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

/**
 * Marque toutes les notifications comme lues.
 */
export async function markAllAsRead(): Promise<void> {
  if (!NOTIFICATIONS_ENABLED) return;
  await supabase.from('notifications').update({ read: true }).eq('read', false);
}

/**
 * Demande la permission pour les notifications push du navigateur.
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (!NOTIFICATIONS_ENABLED) return 'default';
  return await window.Notification.requestPermission();
}

/**
 * Crée une notification (côté admin/serveur).
 * À déclencher après publication d'un tournoi par exemple.
 */
export async function createNotification(
  payload: Omit<Notification, 'id' | 'created_at' | 'read'>
): Promise<void> {
  if (!NOTIFICATIONS_ENABLED) {
    console.log('[notifications] (disabled) createNotification:', payload);
    return;
  }
  await supabase.from('notifications').insert({
    ...payload,
    read: false,
  });
}

/**
 * Hook : compteur de notifications non lues.
 * À utiliser dans NotificationBell.
 */
export async function fetchUnreadCount(): Promise<number> {
  if (!NOTIFICATIONS_ENABLED) return 0;
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false);
  return count ?? 0;
}

// ============================================================
// HELPERS - Création de notifications typées
// ============================================================

export const NotificationFactory = {
  tournamentNew: (tournamentId: string, name: string) =>
    createNotification({
      type: 'tournament_new',
      title: 'Nouveau tournoi 🏐',
      body: `${name} vient d'être publié`,
      link: `/tournoi/${tournamentId}`,
    }),

  tournamentUpdate: (tournamentId: string, name: string) =>
    createNotification({
      type: 'tournament_update',
      title: 'Tournoi modifié',
      body: `Les informations de "${name}" ont été mises à jour`,
      link: `/tournoi/${tournamentId}`,
    }),

  tournamentReminder: (tournamentId: string, name: string, when: string) =>
    createNotification({
      type: 'tournament_reminder',
      title: '⏰ Rappel tournoi',
      body: `${name} commence ${when}`,
      link: `/tournoi/${tournamentId}`,
    }),

  sponsorNew: (sponsorName: string) =>
    createNotification({
      type: 'sponsor_new',
      title: 'Nouveau partenaire',
      body: `${sponsorName} rejoint Volley Péi`,
      link: `/partenaires`,
    }),
};
