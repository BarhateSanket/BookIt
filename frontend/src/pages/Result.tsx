import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function Result() {
  const { state }: any = useLocation();

  if (!state) return <div>No result</div>;

  if (state.success) {
    const b = state.booking;
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 dark:text-gray-300">Your experience has been successfully booked</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Booking Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Booking ID</span>
              <span className="font-mono text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">{b._id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Experience</span>
              <span className="font-medium text-gray-900 dark:text-white">{b.experience}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Date & Time</span>
              <span className="font-medium text-gray-900 dark:text-white">{b.slotDate} at {b.slotTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Quantity</span>
              <span className="font-medium text-gray-900 dark:text-white">{b.quantity}</span>
            </div>
            <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-gray-900 dark:text-white">Total Paid</span>
                <span className="text-green-600 dark:text-green-400">₹{b.totalPrice}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-blue-800 dark:text-blue-200 font-medium mb-1">What's Next?</h4>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Check your email for booking confirmation and details. We'll send you reminders before your experience begins.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
          >
            Book Another Experience
          </Link>
          <Link
            to="/dashboard"
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
          >
            View My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Booking Failed</h2>
        <p className="text-gray-600 dark:text-gray-300">We couldn't process your booking</p>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-red-800 dark:text-red-200 font-medium mb-1">Error Details</h4>
            <p className="text-red-700 dark:text-red-300 text-sm">
              {state.message || 'An unknown error occurred during payment processing.'}
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Don't worry! Your payment was not processed. Please try again.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}
