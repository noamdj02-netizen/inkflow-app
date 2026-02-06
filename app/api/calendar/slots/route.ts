import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailableSlots } from '@/lib/calcom';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const artistSlug = searchParams.get('artist');
    const dateParam = searchParams.get('date');

    if (!artistSlug) {
      return NextResponse.json(
        { error: 'artist parameter is required' },
        { status: 400 }
      );
    }

    const date = dateParam ? new Date(dateParam) : new Date();

    // Récupérer l'artiste depuis Supabase
    const supabase = createClient();
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('cal_com_username, cal_com_event_type_id')
      .eq('slug_profil', artistSlug)
      .single();

    if (artistError || !artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    if (!artist.cal_com_username || !artist.cal_com_event_type_id) {
      console.log('⚠️ Cal.com not configured:', {
        artistSlug,
        hasUsername: !!artist.cal_com_username,
        hasEventTypeId: !!artist.cal_com_event_type_id,
        username: artist.cal_com_username,
        eventTypeId: artist.cal_com_event_type_id,
      });
      return NextResponse.json(
        { 
          error: 'Cal.com not configured for this artist',
          details: {
            hasUsername: !!artist.cal_com_username,
            hasEventTypeId: !!artist.cal_com_event_type_id,
          }
        },
        { status: 400 }
      );
    }

    console.log('📅 Fetching Cal.com slots:', {
      username: artist.cal_com_username,
      eventTypeId: artist.cal_com_event_type_id,
      date: date.toISOString(),
    });

    // Récupérer les créneaux disponibles depuis Cal.com
    let slots;
    try {
      slots = await getAvailableSlots(
        artist.cal_com_username,
        artist.cal_com_event_type_id,
        date
      );
      console.log('✅ Cal.com returned slots:', slots.length, slots);
    } catch (error) {
      console.error('❌ Cal.com API error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch slots from Cal.com',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }

    // Filtrer les créneaux déjà réservés (depuis Supabase)
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('scheduled_at, duration_minutes')
      .eq('artist_id', artist.id)
      .eq('status', 'confirmed')
      .gte('scheduled_at', date.toISOString());

    if (bookingsError) {
      console.error('⚠️ Error fetching existing bookings:', bookingsError);
    }

    console.log('📋 Existing bookings:', existingBookings?.length || 0);

    const bookedSlots = new Set(
      (existingBookings as { scheduled_at: string }[] | null)?.map((b) => {
        const start = new Date(b.scheduled_at);
        return `${start.toISOString()}`;
      }) || []
    );

    const availableSlots = slots.filter((slot) => {
      return !bookedSlots.has(slot.startTime);
    });

    console.log('🎯 Final available slots:', availableSlots.length, 'out of', slots.length);

    return NextResponse.json({ 
      slots: availableSlots,
      debug: {
        totalSlotsFromCalCom: slots.length,
        existingBookings: existingBookings?.length || 0,
        availableAfterFilter: availableSlots.length,
      }
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch slots' },
      { status: 500 }
    );
  }
}
