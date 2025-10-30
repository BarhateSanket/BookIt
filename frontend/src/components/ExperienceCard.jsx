import { StarIcon, ClockIcon, UserGroupIcon, HeartIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';

export default function ExperienceCard({ experience, variant = 'standard', isFavorite = false, onToggleFavorite }) {
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  
  const handleBookNow = () => {
    navigate(`/checkout?experience=${experience.id}`);
  };

  const imageAspectClass = 'aspect-square w-full';
  const titleClass = variant === 'compact' ? 'text-base' : 'text-xl';
  const descClampClass = variant === 'compact' ? 'line-clamp-1' : 'line-clamp-2';
  const paddingClass = variant === 'compact' ? 'p-3' : 'p-4';
  const ratingIconClass = variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5';
  const ratingTextClass = variant === 'compact' ? 'text-sm' : 'text-sm';
  const metaIconClass = variant === 'compact' ? 'h-4 w-4' : 'h-4 w-4';
  const metaTextClass = variant === 'compact' ? 'text-xs' : 'text-xs';

  const categoryClass = (category) => {
    const map = {
      Adventure: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
      Culinary: 'bg-rose-100 text-rose-800 dark:bg-rose-800 dark:text-rose-100',
      Art: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-800 dark:text-fuchsia-100',
      Wellness: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100',
      Nature: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
      Tech: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100',
    };
    return map[category] || 'bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100';
  };

  return (
    <div className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-primary-400/60 via-primary-600/40 to-secondary-500/50 shadow-lg hover:shadow-2xl transition-transform duration-300 hover:-translate-y-1">
      <div className="absolute inset-0 rounded-2xl blur-xl opacity-20 bg-gradient-to-br from-primary-400 via-primary-600 to-secondary-500 pointer-events-none z-0"></div>
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
        <div className={`relative ${imageAspectClass}`}>
          <img
            className={`absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300 z-0 ${imgLoaded ? 'blur-0' : 'blur-sm'}`}
            src={experience.image || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'}
            alt={experience.title || 'Experience image'}
            loading="lazy"
            decoding="async"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'; }}
            onLoad={() => setImgLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 z-10"></div>
          <div className="absolute top-3 right-3 z-20 rounded-full px-3 py-0.5 text-sm font-semibold bg-white/90 dark:bg-gray-800/80 text-primary-700 dark:text-primary-200 shadow-md">
            ${experience.price}
          </div>
        </div>
      <div className={`${paddingClass} flex flex-col gap-2`}>
        <div className="flex justify-between items-center mb-1">
          <h3 className={`${titleClass} font-bold text-gray-900 dark:text-white`}>{experience.title}</h3>
          <div className="flex items-center gap-1">
            <StarIcon className={`${ratingIconClass} text-yellow-400`} />
            <span className={`${ratingTextClass} font-semibold text-gray-700 dark:text-gray-300`}>{experience.rating}</span>
          </div>
        </div>
        <p className={`text-sm text-gray-600 dark:text-gray-300 ${descClampClass}`}>{experience.description}</p>
        <div className={`flex items-center gap-4 ${metaTextClass} text-gray-500 dark:text-gray-400`}>
          <div className="flex items-center gap-1">
            <ClockIcon className={metaIconClass} />
            <span>{experience.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <UserGroupIcon className={metaIconClass} />
            <span>{experience.spots} spots left</span>
          </div>
        </div>
        <div className="mt-2 h-1 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
            style={{ width: `${Math.max(0, Math.min(100, (experience.spots / 20) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shadow ${categoryClass(experience.category)}`}>
            {experience.category}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite && onToggleFavorite()}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`btn-secondary p-2 text-xs ${isFavorite ? 'ring-2 ring-rose-400' : ''}`}
            >
              <HeartIcon className={`h-4 w-4 ${isFavorite ? 'text-rose-500' : 'text-rose-500'}`} />
            </button>
            <button onClick={handleBookNow} className="btn px-4 py-2 text-sm">Book Now</button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}