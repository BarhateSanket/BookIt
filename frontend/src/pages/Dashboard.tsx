import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Booking = {
  _id: string;
  experience: { title: string; price?: number; image?: string };
  slotDate: string;
  slotTime: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  phone: string;
  location: string;
  dateOfBirth: string;
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    theme: string;
    language: string;
  };
  favorites: any[];
  createdAt: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'profile'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Load user profile
      const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      if (profileData.success) {
        setUser(profileData.user);
      }

      // Load bookings
      const bookingsRes = await fetch('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        setBookings(bookingsData.bookings);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingBookings = bookings.filter(b =>
    new Date(b.slotDate) >= new Date() && b.status === 'confirmed'
  );

  const pastBookings = bookings.filter(b =>
    new Date(b.slotDate) < new Date() || b.status !== 'confirmed'
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your bookings, update your profile, and discover new experiences.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'bookings', label: 'My Bookings' },
            { id: 'profile', label: 'Profile' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Bookings</h3>
                  <p className="text-2xl font-bold text-primary-600">{bookings.length}</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upcoming</h3>
                  <p className="text-2xl font-bold text-green-600">{upcomingBookings.length}</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Favorites</h3>
                  <p className="text-2xl font-bold text-blue-600">{user?.favorites?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Spent</h3>
                  <p className="text-2xl font-bold text-purple-600">₹{bookings.reduce((sum, b) => sum + b.totalPrice, 0)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Bookings</h3>
            {upcomingBookings.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">No upcoming bookings.</p>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.slice(0, 3).map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src={booking.experience.image || '/images/default.jpg'}
                        alt={booking.experience.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{booking.experience.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {booking.slotDate} at {booking.slotTime}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">₹{booking.totalPrice}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{booking.quantity} seats</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-8">
          {/* Upcoming Bookings */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upcoming Bookings</h3>
            {upcomingBookings.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">No upcoming bookings.</p>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src={booking.experience.image || '/images/default.jpg'}
                        alt={booking.experience.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{booking.experience.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {booking.slotDate} at {booking.slotTime}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{booking.quantity} seats</p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="font-medium text-gray-900 dark:text-white">₹{booking.totalPrice}</p>
                      <div className="flex space-x-2">
                        <button className="btn-secondary text-xs">Reschedule</button>
                        <button className="btn text-xs bg-red-600 hover:bg-red-700">Cancel</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Bookings */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Booking History</h3>
            {pastBookings.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">No past bookings.</p>
            ) : (
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src={booking.experience.image || '/images/default.jpg'}
                        alt={booking.experience.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{booking.experience.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {booking.slotDate} at {booking.slotTime}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">₹{booking.totalPrice}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="max-w-2xl">
          <div className="glass rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Profile Settings</h3>

            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center space-x-4">
                <img
                  src={user?.avatar || '/logo-small.svg'}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-primary-200"
                />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{user?.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</p>
                  <button className="mt-2 btn-secondary text-sm">Change Avatar</button>
                </div>
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    defaultValue={user?.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    defaultValue={user?.phone}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    defaultValue={user?.location}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="date-of-birth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    id="date-of-birth"
                    type="date"
                    defaultValue={user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  defaultValue={user?.bio}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Preferences */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Preferences</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={user?.preferences?.notifications}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Email notifications</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={user?.preferences?.newsletter}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Newsletter subscription</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button className="btn-secondary">Cancel</button>
                <button className="btn">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
