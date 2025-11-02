import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { validatePromo, createBooking, createCheckoutSession } from '../api/api';
import { trackEvent } from '../utils/analytics';

export default function Checkout() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const { slot, title: stateTitle, price: statePrice, experienceId } : any = (location.state || {});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [promo, setPromo] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [time, setTime] = useState<string>('10:00');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const hasUser = !!localStorage.getItem('user');
    if (!hasUser) {
      nav('/login');
    }
  }, [nav]);

  const title = stateTitle || '';
  const price = statePrice || 0;
  const effectiveId = id || experienceId;
  const chosenSlot = slot || (date && time ? { date, time } : null);

  const applyPromoCode = async () => {
    if (!promo) return;
    try {
      const res = await validatePromo(promo);
      if (res.data.valid) setAppliedPromo(res.data.promo);
      else setAppliedPromo(null);
    } catch (err) {
      console.error(err);
      setAppliedPromo(null);
    }
  };

  const isValidEmail = (v: string) => /.+@.+\..+/.test(v);
  const formInvalid = !effectiveId || !chosenSlot || !name || !isValidEmail(email) || quantity < 1;

  const placeBooking = async () => {
    setError('');
    if (formInvalid) { setError('Please complete required fields'); return; }
    trackEvent('begin_checkout', { experienceId: effectiveId, quantity, price, title, date: chosenSlot?.date, time: chosenSlot?.time });
    // Navigate to dedicated payment page with all details
    nav('/payment', {
      state: {
        experienceId: effectiveId,
        title,
        price,
        quantity,
        name,
        email,
        slotDate: chosenSlot.date,
        slotTime: chosenSlot.time,
      }
    });
  };

  const subtotal = (price || 0) * quantity;
  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === 'percentage') discount = (subtotal * appliedPromo.value) / 100;
    else discount = appliedPromo.value;
  }
  const total = Math.max(0, subtotal - discount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="glass rounded-xl p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Checkout
            </h1>

            <div className="space-y-6">
              {/* Experience Details */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Date: {chosenSlot?.date} | Time: {chosenSlot?.time}
                </p>
                <p className="text-lg font-bold text-primary-600 mt-2">
                  ₹{price} per person
                </p>
              </div>

              {/* Form */}
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity *
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="promo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Promo Code
                    </label>
                    <div className="flex space-x-2">
                      <input
                        id="promo"
                        type="text"
                        value={promo}
                        onChange={(e) => setPromo(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter promo code"
                      />
                      <button
                        type="button"
                        onClick={applyPromoCode}
                        className="btn-secondary"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                {appliedPromo && (
                  <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md p-3">
                    <p className="text-green-800 dark:text-green-200 text-sm">
                      Promo code applied: {appliedPromo.code} ({appliedPromo.type === 'percentage' ? `${appliedPromo.value}% off` : `₹${appliedPromo.value} off`})
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-3">
                    <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                  </div>
                )}
              </form>

              {/* Order Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Order Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      {title} x {quantity}
                    </span>
                    <span className="text-gray-900 dark:text-white">₹{subtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <span className="text-primary-600">₹{total}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={placeBooking}
                disabled={formInvalid || loading}
                className="w-full btn text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `Proceed to Payment - ₹${total}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
