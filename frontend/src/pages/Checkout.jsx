import React, { useState } from 'react';
import { experiences } from '../data/experiences';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackEvent } from '../utils/analytics';


export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const experienceId = params.get('experience');
  const experience = experiences.find(e => String(e.id) === String(experienceId));
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);


  // PayPal client ID (replace with your real client ID)
  const PAYPAL_CLIENT_ID = 'AXKM4EgWIgDZG9hBHs86xOYdmExWjp7GwE20T2y0yjnuJWFwrXb9mZiLnDQTUdOg3ao2NCdJF7GiYuf1';

  const handleApprove = async (data, actions) => {
    setPaying(true);
    setError('');
    try {
      await actions.order.capture();
      // Call booking API after successful payment
      await axios.post('/api/bookings', {
        experienceId,
        slotDate,
        slotTime,
        userName,
        userEmail,
        quantity
      });
      setSuccess(true);
      setTimeout(() => navigate('/bookings'), 1200);
    } catch (err) {
      setError('Payment or booking failed.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-16 p-8 bg-white dark:bg-gray-800 rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Checkout</h2>
      <p className="mb-4 text-center">Ready to book experience #{experienceId}: <span className="font-semibold">{experience?.title}</span></p>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {success ? (
        <div className="text-green-600 text-center font-semibold mb-4">Booking successful! Redirecting...</div>
      ) : (
        <>
          <form className="mb-6 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Your Name</label>
              <input className="input" type="text" value={userName} onChange={e => setUserName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Your Email</label>
              <input className="input" type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input className="input" type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input className="input" type="time" value={slotTime} onChange={e => setSlotTime(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input className="input" type="number" min={1} max={experience?.spots || 10} value={quantity} onChange={e => setQuantity(Number(e.target.value))} required />
            </div>
          </form>
            <PayPalButtons
              style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
              disabled={paying || !userName || !userEmail || !slotDate || !slotTime || !quantity}
              forceReRender={[experienceId, slotDate, slotTime, userName, userEmail, quantity]}
              createOrder={(data, actions) => {
                return actions.order.create({
                  purchase_units: [
                    {
                      amount: {
                        value: String((experience?.price || 10) * quantity),
                      },
                      description: `Booking for experience #${experienceId}`,
                    },
                  ],
                });
              }}
              onApprove={handleApprove}
              onError={() => setError('Payment failed.')}
            />
        </>
      )}
    </div>
  );
}
