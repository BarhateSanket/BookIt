import React, { useEffect, useState } from 'react';
import { getBookings } from '../api/api';

type Booking = {
  _id: string;
  experience: { title: string; price?: number } | string;
  slotDate: string;
  slotTime: string;
  userName: string;
  userEmail: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
};

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const email = user?.email;
    setLoading(true);
    getBookings(email)
      .then((res) => setBookings(res.data.bookings || []))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">My Bookings</h1>
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 skeleton h-20"></div>
          ))}
        </div>
      )}
      {!loading && error && <div className="text-red-600">{error}</div>}
      {!loading && !error && bookings.length === 0 && (
        <div className="glass rounded-xl p-6 text-center text-gray-600 dark:text-gray-300">No bookings yet.</div>
      )}
      {!loading && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b._id} className="glass rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {typeof b.experience === 'string' ? 'Experience' : b.experience.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{b.slotDate} • {b.slotTime}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{b.quantity} seats • ₹{b.totalPrice}</div>
              </div>
              <div className="text-xs text-gray-500">Booked on {new Date(b.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


