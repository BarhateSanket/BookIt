import React, { useState, useEffect } from 'react';

interface DashboardData {
  metrics: {
    totalBookings: number;
    todayBookings: number;
    monthlyBookings: number;
    totalRevenue: number;
    monthlyRevenue: number;
    totalUsers: number;
    activeChats: number;
    waitlistCount: number;
  };
  charts: {
    revenueByMonth: any[];
    popularExperiences: any[];
  };
  recentBookings: any[];
}

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Failed to load dashboard data</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Total Bookings</h3>
          <p className="text-3xl font-bold text-blue-600">{data.metrics.totalBookings}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Today's Bookings</h3>
          <p className="text-3xl font-bold text-green-600">{data.metrics.todayBookings}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Monthly Revenue</h3>
          <p className="text-3xl font-bold text-purple-600">${data.metrics.monthlyRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Total Users</h3>
          <p className="text-3xl font-bold text-orange-600">{data.metrics.totalUsers}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Active Chats</h3>
          <p className="text-3xl font-bold text-indigo-600">{data.metrics.activeChats}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Waitlist Count</h3>
          <p className="text-3xl font-bold text-red-600">{data.metrics.waitlistCount}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Total Revenue</h3>
          <p className="text-3xl font-bold text-teal-600">${data.metrics.totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Monthly Bookings</h3>
          <p className="text-3xl font-bold text-pink-600">{data.metrics.monthlyBookings}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Experiences */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Popular Experiences</h2>
          <div className="space-y-3">
            {data.charts.popularExperiences.slice(0, 5).map((exp, index) => (
              <div key={exp._id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{exp.experience.title}</p>
                  <p className="text-sm text-gray-600">{exp.count} bookings</p>
                </div>
                <span className="text-2xl">#{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
          <div className="space-y-3">
            {data.recentBookings.slice(0, 5).map((booking) => (
              <div key={booking._id} className="border-b pb-3">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{booking.userName}</p>
                    <p className="text-sm text-gray-600">{booking.experience?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${booking.totalPrice}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-xl font-bold mb-4">Revenue Trends</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p className="text-gray-500">Revenue chart visualization would go here</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors">
            Manage Bookings
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors">
            View Users
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors">
            System Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;