/**
 * Calendrier mobile : swipe entre les jours + vue jour + FAB QuickAdd.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { addDays, startOfDay } from 'date-fns';
import 'swiper/css';
import { DayView } from './DayView';
import { QuickAddFAB } from './QuickAddFAB';
import type { DayViewEvent } from './DayView';

export interface MobileCalendarProps {
  events: DayViewEvent[];
  onEventClick?: (event: DayViewEvent) => void;
  onOpenQuickAdd: () => void;
  /** Date initiale affichée (centre du carrousel) */
  initialDate?: Date;
  className?: string;
}

const CENTER_INDEX = 1;

export function MobileCalendar({
  events,
  onEventClick,
  onOpenQuickAdd,
  initialDate = new Date(),
  className = '',
}: MobileCalendarProps) {
  const [currentDay, setCurrentDay] = useState(() => startOfDay(initialDate));
  const swiperRef = useRef<SwiperType | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    swiperRef.current?.slideTo(CENTER_INDEX, 0);
  }, [currentDay]);

  const handleSlideChange = (swiper: SwiperType) => {
    const offset = swiper.activeIndex - CENTER_INDEX;
    const newDay = addDays(currentDay, offset);
    setCurrentDay(startOfDay(newDay));
  };

  return (
    <div className={`md:hidden flex flex-col flex-1 min-h-0 ${className}`}>
      <Swiper
        className="flex-1 min-h-0 w-full"
        initialSlide={CENTER_INDEX}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={handleSlideChange}
        slidesPerView={1}
        spaceBetween={0}
        allowTouchMove={true}
        resistanceRatio={0.85}
        threshold={8}
      >
        {[-1, 0, 1].map((offset) => (
          <SwiperSlide key={offset} className="h-full">
            <DayView
              date={addDays(currentDay, offset)}
              events={events}
              onEventClick={onEventClick}
              emptyMessage="Aucun rendez-vous ce jour-là"
              className="px-4"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <QuickAddFAB onClick={onOpenQuickAdd} ariaLabel="Nouveau rendez-vous" />
    </div>
  );
}
