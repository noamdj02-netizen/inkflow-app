/**
 * Service Cal.com pour récupérer les créneaux disponibles et créer des réservations
 */

const CAL_COM_BASE_URL = process.env.CAL_COM_BASE_URL || 'https://cal.com/noam-41pyox';
const CAL_COM_API_KEY = process.env.CAL_COM_API_KEY;

export interface CalComSlot {
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  duration: number; // minutes
}

export interface CalComBooking {
  id: string;
  startTime: string;
  endTime: string;
  attendee: {
    name: string;
    email: string;
    phone?: string;
  };
}

/**
 * Récupère les créneaux disponibles pour un utilisateur Cal.com et un type d'événement
 */
export async function getAvailableSlots(
  username: string,
  eventTypeId: string,
  date: Date
): Promise<CalComSlot[]> {
  if (!CAL_COM_API_KEY) {
    throw new Error('CAL_COM_API_KEY is not configured');
  }

  // Cal.com API v1 format: startTime et endTime en ISO 8601
  const startTime = new Date(date);
  startTime.setHours(0, 0, 0, 0);
  const endTime = new Date(date);
  endTime.setHours(23, 59, 59, 999);

  // Construire l'URL selon la documentation Cal.com v1
  const params = new URLSearchParams({
    apiKey: CAL_COM_API_KEY!,
    eventTypeId: eventTypeId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
  });

  const url = `${CAL_COM_BASE_URL}/slots?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Cal.com API error response:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`Cal.com API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Cal.com v1 retourne: {"slots": {"2024-04-13": [{"time":"2024-04-13T11:00:00+04:00"}, ...]}}
  // Convertir en format uniforme
  const slots: CalComSlot[] = [];
  
  if (data.slots && typeof data.slots === 'object') {
    // Parcourir toutes les dates dans la réponse
    Object.keys(data.slots).forEach((dateKey) => {
      const daySlots = data.slots[dateKey];
      if (Array.isArray(daySlots)) {
        daySlots.forEach((slot: any) => {
          const slotTime = new Date(slot.time);
          // Estimer la durée (par défaut 60 minutes, ou utiliser eventTypeId pour récupérer la vraie durée)
          const duration = slot.duration || 60;
          slots.push({
            startTime: slotTime.toISOString(),
            endTime: new Date(slotTime.getTime() + duration * 60000).toISOString(),
            duration,
          });
        });
      }
    });
  }
  
  return slots;
}

/**
 * Crée une réservation Cal.com
 */
export async function createBooking(
  username: string,
  eventTypeId: string,
  startTime: string,
  attendee: { name: string; email: string; phone?: string }
): Promise<CalComBooking> {
  if (!CAL_COM_API_KEY) {
    throw new Error('CAL_COM_API_KEY is not configured');
  }

  const response = await fetch(`${CAL_COM_BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CAL_COM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventTypeId,
      start: startTime,
      responses: {
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone || '',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cal.com booking error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  return {
    id: data.id,
    startTime: data.startTime,
    endTime: data.endTime,
    attendee: {
      name: attendee.name,
      email: attendee.email,
      phone: attendee.phone,
    },
  };
}

/**
 * Annule une réservation Cal.com
 */
export async function cancelBooking(bookingId: string): Promise<void> {
  if (!CAL_COM_API_KEY) {
    throw new Error('CAL_COM_API_KEY is not configured');
  }

  const response = await fetch(`${CAL_COM_BASE_URL}/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${CAL_COM_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cal.com cancel error: ${response.status} - ${error}`);
  }
}
