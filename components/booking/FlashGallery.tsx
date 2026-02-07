'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { BookingModal } from './BookingModal';

interface Flash {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  prix: number;
  acompte: number;
  disponible: boolean;
}

interface FlashGalleryProps {
  flashs: Flash[];
  artistSlug: string;
}

export function FlashGallery({ flashs, artistSlug }: FlashGalleryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {flashs.map((flash, idx) => (
        <motion.div
          key={flash.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="group relative"
        >
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-900">
            <Image
              src={flash.image_url}
              alt={flash.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Overlay au hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <h3 className="text-2xl font-bold mb-2">{flash.title}</h3>
              {flash.description && (
                <p className="text-sm text-zinc-300 mb-4">{flash.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{flash.prix}€</p>
                  <p className="text-sm text-zinc-400">Acompte: {flash.acompte}€</p>
                </div>
                
                {flash.disponible ? (
                  <BookingModal 
                    type="flash"
                    flash={{
                      id: flash.id,
                      title: flash.title,
                      prix: flash.prix,
                      acompte: flash.acompte,
                    }}
                    artistSlug={artistSlug}
                    trigger={
                      <button className="px-6 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">
                        Réserver
                      </button>
                    }
                  />
                ) : (
                  <button disabled className="px-6 py-3 bg-zinc-700 text-zinc-400 rounded-full font-bold cursor-not-allowed">
                    Réservé
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Info rapide */}
          {!flash.disponible && (
            <div className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold">
              Réservé
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
