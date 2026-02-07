/**
 * Point d'entrée Vercel pour les routes réécrites :
 * - GET  /api/artist-booking-info → handleArtistBookingInfo
 * - POST /api/create-booking      → handleCreateBooking
 * - POST /api/cancel-pending-booking → handleCancelPendingBooking
 */
import handler from './booking-refactored';
export default handler;
