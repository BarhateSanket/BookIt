import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '../api/api';
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
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Payment</h2>
      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
        <div className="flex justify-between"><span>Experience</span><span>{title}</span></div>
        <div className="flex justify-between"><span>Date</span><span>{slotDate}</span></div>
        <div className="flex justify-between"><span>Time</span><span>{slotTime}</span></div>
        <div className="flex justify-between"><span>Name</span><span>{name}</span></div>
        <div className="flex justify-between"><span>Email</span><span>{email}</span></div>
        <div className="flex justify-between"><span>Quantity</span><span>{quantity}</span></div>
        <div className="flex justify-between font-semibold mt-2"><span>Total</span><span>₹{Math.round(subtotal)}</span></div>
      </div>

      {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}

      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary">Back</button>
        <button onClick={proceedToPayment} disabled={loading} className="btn disabled:opacity-60">
          {loading ? 'Redirecting…' : 'Proceed to secure payment'}
        </button>
      </div>
    </div>
  );
}


