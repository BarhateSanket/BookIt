import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExperience, getExperiences } from '../api/api';
import MapView from '../components/MapView';
import { FullPageLoading } from '../components/LoadingStates';
import { socketService } from '../utils/socketService';
import { trackEvent } from '../utils/analytics';

interface Review {
  _id: string;
  user: { name: string; avatar?: string };
  rating: number;
  comment: string;
  createdAt: string;
}

interface Host {
  _id: string;
  name: string;
  avatar?: string;
  bio: string;
  rating: number;
  reviewCount: number;
}

interface Experience {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category?: string;
  rating?: number;
  reviewCount?: number;
  duration?: string;
  spots?: number;
  latitude?: number;
  longitude?: number;
  host?: Host;
  reviews?: Review[];
  slots: any[];
}

export default function Details() {
  const { id } = useParams();
  const nav = useNavigate();
  const [exp, setExp] = useState<Experience | null>(null);
  const [similarExperiences, setSimilarExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{date:string, time:string}|null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadExperienceData();

    // Track experience view
    trackEvent('experience_view', { experience_id: id });

    // Join experience room for real-time updates
    socketService.joinExperienceRoom(id);

    // Listen for availability updates
    const handleAvailabilityUpdate = (data: any) => {
      if (data.experienceId === id) {
        setExp(prev => prev ? { ...prev, slots: data.slots } : null);
      }
    };

    socketService.onAvailabilityUpdated(handleAvailabilityUpdate);

    return () => {
      socketService.leaveExperienceRoom(id);
      socketService.off('availability-updated');
    };
  }, [id]);

  const loadExperienceData = async () => {
    try {
      const expRes = await getExperience(id!);
      setExp(expRes.data);

      // Load similar experiences
      const similarRes = await getExperiences({ category: expRes.data.category, limit: 4 });
      setSimilarExperiences(similarRes.data.filter((e: Experience) => e._id !== id));
    } catch (error) {
      console.error('Failed to load experience data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <FullPageLoading message="Loading experience details..." />;

  if (!exp) return <div className="text-center py-10">Experience not found</div>;

  const displayedReviews = showAllReviews ? exp.reviews : exp.reviews?.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Image Gallery */}
      <div className="mb-8">
        <div className="relative h-96 rounded-lg overflow-hidden">
          <img
            src={exp.images?.[currentImageIndex] || '/images/default.jpg'}
            alt={exp.title}
            className="w-full h-full object-cover"
          />
          {exp.images && exp.images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : exp.images.length - 1))}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev < exp.images.length - 1 ? prev + 1 : 0))}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                aria-label="Next image"
              >
                ›
              </button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {exp.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title and Basic Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{exp.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
              {exp.rating && (
                <div className="flex items-center">
                  <span className="text-yellow-400">★</span>
                  <span className="ml-1">{exp.rating.toFixed(1)}</span>
                  <span className="ml-1">({exp.reviewCount || 0} reviews)</span>
                </div>
              )}
              {exp.category && <span>{exp.category}</span>}
              {exp.duration && <span>{exp.duration}</span>}
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-4">About this experience</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{exp.description}</p>
          </div>

          {/* Host Information */}
          {exp.host && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Meet your host</h2>
              <div className="flex items-start space-x-4">
                <img
                  src={exp.host.avatar || '/logo-small.svg'}
                  alt={exp.host.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{exp.host.name}</h3>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1">{exp.host.rating.toFixed(1)}</span>
                    <span className="ml-1">({exp.host.reviewCount} reviews)</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{exp.host.bio}</p>
                </div>
              </div>
            </div>
          )}

          {/* Location Map */}
          {exp.latitude && exp.longitude && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              <MapView experiences={[exp]} />
            </div>
          )}

          {/* Reviews */}
          {exp.reviews && exp.reviews.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Reviews</h2>
                {exp.reviews.length > 3 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {showAllReviews ? 'Show less' : `Show all ${exp.reviews.length} reviews`}
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {displayedReviews?.map((review) => (
                  <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={review.user.avatar || '/logo-small.svg'}
                        alt={review.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{review.user.name}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Experiences */}
          {similarExperiences.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Similar experiences</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {similarExperiences.map((similarExp) => (
                  <div key={similarExp._id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <img
                      src={similarExp.images?.[0] || '/images/default.jpg'}
                      alt={similarExp.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-sm mb-1">{similarExp.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">₹{similarExp.price}</p>
                      <button
                        onClick={() => nav(`/details/${similarExp._id}`)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold">₹{exp.price}</span>
              <span className="text-gray-600 dark:text-gray-300">per person</span>
            </div>

            {/* Available slots */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Available slots</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {exp.slots.map((s: any, idx: number) => {
                  const soldOut = s.bookedCount >= s.capacity;
                  const active = selectedSlot?.date === s.date && selectedSlot?.time === s.time;
                  return (
                    <button
                      key={idx}
                      disabled={soldOut}
                      onClick={() => setSelectedSlot({ date: s.date, time: s.time })}
                      className={`w-full p-3 rounded border text-left transition-colors ${
                        soldOut
                          ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700'
                          : active
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{s.date}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{s.time}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{soldOut ? 'Sold out' : `${s.capacity - s.bookedCount} left`}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              disabled={!selectedSlot}
              onClick={() => nav(`/checkout/${exp._id}`, { state: { slot: selectedSlot, title: exp.title, price: exp.price } })}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {selectedSlot ? 'Book now' : 'Select a slot to book'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
