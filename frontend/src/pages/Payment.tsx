import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { createCheckoutSession, createPayPalOrder, capturePayPalOrder } from '../api/api';
import { trackEvent } from '../utils/analytics';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    experienceId,
    title,
    price,
    quantity,
    name,
    email,
    slotDate,
    slotTime,
  }: any = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const hasUser = !!localStorage.getItem('user');
    if (!hasUser) {
      navigate('/login');
    }
  }, [navigate]);

  const proceedToPayment = async () => {
    setError('');
    if (!experienceId || !slotDate || !slotTime || !name || !email || !quantity) {
      setError('Missing payment details');
      return;
    }
    try {
      setLoading(true);
      trackEvent('payment_initiated', { experienceId, quantity, price, slotDate, slotTime });
      const metadata = { experienceId, slotDate, slotTime, userName: name, userEmail: email, quantity } as any;
      const sessionRes = await createCheckoutSession({
        items: [{ title: title || 'Experience', price, quantity }],
        customerEmail: email,
        metadata,
      });
      const url = sessionRes.data?.url;
      if (url) {
        window.location.href = url;
        return;
      }
      setError('Unable to start payment');
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = (price || 0) * (quantity || 1);

  return (
    <PayPalScriptProvider options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '', currency: 'INR' }}>
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Complete Your Payment</h2>
          <p className="text-gray-600 dark:text-gray-300">Secure checkout for your experience booking</p>
        </div>

        {/* Booking Summary Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Booking Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Experience</span>
              <span className="font-medium text-gray-900 dark:text-white">{title}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Date & Time</span>
              <span className="font-medium text-gray-900 dark:text-white">{slotDate} at {slotTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Name</span>
              <span className="font-medium text-gray-900 dark:text-white">{name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Email</span>
              <span className="font-medium text-gray-900 dark:text-white">{email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Quantity</span>
              <span className="font-medium text-gray-900 dark:text-white">{quantity}</span>
            </div>
            <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-gray-900 dark:text-white">Total Amount</span>
                <span className="text-green-600 dark:text-green-400">₹{Math.round(subtotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Stripe Payment Option */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pay with Card (Stripe)</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Secure payment processing with credit/debit cards</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={proceedToPayment}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Pay with Card'
                )}
              </button>
            </div>
          </div>

          {/* PayPal Payment Option */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pay with PayPal</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Fast and secure payment with your PayPal account</p>
            <PayPalButtons
              style={{
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'paypal'
              }}
              createOrder={async () => {
                const metadata = { experienceId, slotDate, slotTime, userName: name, userEmail: email, quantity };
                const res = await createPayPalOrder({
                  items: [{ title: title || 'Experience', price, quantity }],
                  customerEmail: email,
                  metadata,
                });
                return res.data.id;
              }}
              onApprove={async (data) => {
                const metadata = { experienceId, slotDate, slotTime, userName: name, userEmail: email, quantity };
                const res = await capturePayPalOrder({ orderID: data.orderID, metadata });
                if (res.data.success) {
                  navigate('/result', { state: { success: true, booking: res.data.booking } });
                } else {
                  setError('Payment failed');
                }
              }}
              onError={(err) => {
                console.error(err);
                setError('PayPal payment failed');
              }}
            />
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>🔒 Your payment information is secure and encrypted</p>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}


