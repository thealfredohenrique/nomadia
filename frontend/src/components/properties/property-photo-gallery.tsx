'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PropertyPhoto } from '@/lib/types';

interface PropertyPhotoGalleryProps {
  photos: PropertyPhoto[];
  title: string;
}

export function PropertyPhotoGallery({ photos, title }: PropertyPhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8 rounded-xl overflow-hidden">
      <div className="relative aspect-[4/3]">
        <Image
          src={photos[selectedPhoto]?.url || ''}
          alt={photos[selectedPhoto]?.caption || title}
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {photos.slice(0, 4).map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(i)}
            className={`relative aspect-[4/3] overflow-hidden ${
              selectedPhoto === i ? 'ring-2 ring-rose-500' : ''
            }`}
          >
            <Image
              src={photo.url}
              alt={photo.caption || ''}
              fill
              className="object-cover hover:opacity-90 transition-opacity"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
