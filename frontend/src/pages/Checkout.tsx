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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Checkout</h2>
        <p className="text-gray-600 dark:text-gray-300">{title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="glass rounded-2xl p-6 shadow-elevated">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Name</label>
                <input 
                  id="name"
                  name="name"
                  type="text"
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  onBlur={() => setTouched(prev => ({...prev, name: true}))}
                  className="input"
                  required
                  aria-required="true"
                />
                {touched.name && !name && (<p className="mt-1 text-xs text-red-500">Name is required</p>)}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Email</label>
                <input 
                  id="email"
                  name="email"
                  type="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  onBlur={() => setTouched(prev => ({...prev, email: true}))}
                  className="input"
                  required
                  aria-required="true"
                />
                {touched.email && !isValidEmail(email) && (<p className="mt-1 text-xs text-red-500">Enter a valid email</p>)}
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 shadow-elevated">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Booking Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Quantity</label>
                <input 
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  value={quantity} 
                  onChange={e => setQuantity(Number(e.target.value))} 
                  className="input w-full sm:w-32"
                  required
                  aria-required="true"
                />
                {quantity < 1 && (<p className="mt-1 text-xs text-red-500">Minimum 1</p>)}
              </div>
              {!slot && (
                <>
                  <div>
                    <label htmlFor="date" className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Preferred Date</label>
                    <input
                      id="date"
                      name="date"
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      onBlur={() => setTouched(prev => ({...prev, date: true}))}
                      className="input"
                      required
                      aria-required="true"
                    />
                    {touched.date && !date && (<p className="mt-1 text-xs text-red-500">Select a date</p>)}
                  </div>
                  <div>
                    <label htmlFor="time" className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Preferred Time</label>
                    <input
                      id="time"
                      name="time"
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      onBlur={() => setTouched(prev => ({...prev, time: true}))}
                      className="input"
                      required
                      aria-required="true"
                    />
                    {touched.time && !time && (<p className="mt-1 text-xs text-red-500">Select a time</p>)}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 shadow-elevated">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Promo Code</h3>
            <div className="flex items-center gap-3">
              <label htmlFor="promo" className="sr-only">Promo Code</label>
              <input 
                id="promo"
                name="promo"
                type="text"
                placeholder="Enter promo code"
                value={promo} 
                onChange={e => setPromo(e.target.value)} 
                className="input"
                aria-label="Promo code"
              />
              <button onClick={applyPromoCode} className="btn-secondary">Apply</button>
            </div>
            {appliedPromo && <div className="mt-2 text-green-700 dark:text-green-400 text-sm">Applied: {appliedPromo.code}</div>}
            {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="glass rounded-2xl p-6 shadow-elevated sticky top-24">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-700 dark:text-gray-300"><span>Experience</span><span>{title}</span></div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300"><span>Quantity</span><span>{quantity}</span></div>
              {slot && (
                <>
                  <div className="flex justify-between text-gray-700 dark:text-gray-300"><span>Date</span><span>{slot.date}</span></div>
                  <div className="flex justify-between text-gray-700 dark:text-gray-300"><span>Time</span><span>{slot.time}</span></div>
                </>
              )}
              {!slot && (
                <>
                  <div className="flex justify-between text-gray-700 dark:text-gray-300"><span>Date</span><span>{date}</span></div>
                  <div className="flex justify-between text-gray-700 dark:text-gray-300"><span>Time</span><span>{time}</span></div>
                </>
              )}
              <div className="h-px my-2 bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300"><span>Discount</span><span>-₹{Math.round(discount)}</span></div>
              <div className="flex justify-between font-semibold text-gray-900 dark:text-white"><span>Total</span><span>₹{Math.round(total)}</span></div>
            </div>
            <button disabled={loading || formInvalid} onClick={placeBooking} className="btn w-full mt-5 disabled:opacity-60">
              {loading ? 'Processing...' : 'Pay & Book'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
