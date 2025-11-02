import React, { useState } from 'react';
import { experiences } from '../data/experiences';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';


export default function Checkout() {
  return (
    <PayPalScriptProvider options={{ "client-id": "AXKM4EgWIgDZG9hBHs86xOYdmExWjp7GwE20T2y0yjnuJWFwrXb9mZiLnDQTUdOg3ao2NCdJF7GiYuf1" }}>
      <CheckoutContent />
    </PayPalScriptProvider>
  );
}

function CheckoutContent() {
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
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiApp, setUpiApp] = useState('');


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
    } catch (error) {
      console.error('Payment or booking error:', error);
      setError('Payment or booking failed.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-8 text-white">
            <h1 className="text-3xl font-bold text-center mb-2">Complete Your Booking</h1>
            <p className="text-center text-primary-100">Secure checkout for your experience</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
                </div>
              </div>
            )}

            {success ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Booking Successful!</h2>
                <p className="text-gray-600 dark:text-gray-300">Redirecting to your bookings...</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Experience Summary */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Experience Details</h3>
                    <div className="flex items-start space-x-4">
                      <img
                        src={experience?.image}
                        alt={experience?.title}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{experience?.title}</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{experience?.description}</p>
                        <div className="flex items-center mt-3 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {experience?.duration}
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {experience?.category}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Order Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Experience</span>
                        <span className="font-medium">${experience?.price || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Quantity</span>
                        <span className="font-medium">× {quantity}</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total</span>
                          <span className="text-primary-600">${((experience?.price || 0) * quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Form */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Booking Information</h3>
                    <form className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="John"
                            value={userName.split(' ')[0] || ''}
                            onChange={e => setUserName(e.target.value + (userName.split(' ')[1] ? ' ' + userName.split(' ')[1] : ''))}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="Doe"
                            value={userName.split(' ')[1] || ''}
                            onChange={e => setUserName((userName.split(' ')[0] || '') + ' ' + e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                        <input
                          type="email"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="john@example.com"
                          value={userEmail}
                          onChange={e => setUserEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                          <input
                            type="date"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={slotDate}
                            onChange={e => setSlotDate(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time</label>
                          <input
                            type="time"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={slotTime}
                            onChange={e => setSlotTime(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Number of Participants</label>
                        <select
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          value={quantity}
                          onChange={e => setQuantity(Number(e.target.value))}
                          required
                        >
                          {Array.from({ length: Math.min(experience?.spots || 10, 10) }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
                          ))}
                        </select>
                      </div>
                    </form>
                  </div>

                  {/* Payment Section */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Payment Method</h3>
                    <div className="space-y-4">
                      {/* Payment Method Selection */}
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          paymentMethod === 'paypal'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="paypal"
                            checked={paymentMethod === 'paypal'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="sr-only"
                          />
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">PayPal</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Secure payment</p>
                          </div>
                        </label>

                        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          paymentMethod === 'card'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="card"
                            checked={paymentMethod === 'card'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="sr-only"
                          />
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Credit/Debit Card</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Visa, Mastercard</p>
                          </div>
                        </label>

                        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          paymentMethod === 'upi'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="upi"
                            checked={paymentMethod === 'upi'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="sr-only"
                          />
                          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">UPI</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Google Pay, PhonePe</p>
                          </div>
                        </label>

                        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          paymentMethod === 'apple'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="apple"
                            checked={paymentMethod === 'apple'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="sr-only"
                          />
                          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Apple Pay</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Touch ID / Face ID</p>
                          </div>
                        </label>
                      </div>

                      {/* Payment Forms */}
                      {paymentMethod === 'paypal' && (
                        <div className="space-y-4">
                          <PayPalButtons
                            style={{
                              layout: 'horizontal',
                              color: 'blue',
                              shape: 'rect',
                              label: 'pay',
                              height: 50
                            }}
                            disabled={paying || !userName || !userEmail || !slotDate || !slotTime || !quantity}
                            forceReRender={[experienceId, slotDate, slotTime, userName, userEmail, quantity]}
                            createOrder={(data, actions) => {
                              return actions.order.create({
                                purchase_units: [
                                  {
                                    amount: {
                                      value: String((experience?.price || 10) * quantity),
                                    },
                                    description: `Booking for ${experience?.title}`,
                                  },
                                ],
                              });
                            }}
                            onApprove={handleApprove}
                            onError={() => setError('Payment failed. Please try again.')}
                          />
                        </div>
                      )}

                      {paymentMethod === 'card' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Card Number</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              placeholder="1234 5678 9012 3456"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expiry Date</label>
                              <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="MM/YY"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CVV</label>
                              <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="123"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={paying || !userName || !userEmail || !slotDate || !slotTime || !quantity || !cardNumber || !cardExpiry || !cardCvv}
                            onClick={() => {
                              setPaying(true);
                              setError('');
                              // Simulate payment processing
                              setTimeout(() => {
                                axios.post('/api/bookings', {
                                  experienceId,
                                  slotDate,
                                  slotTime,
                                  userName,
                                  userEmail,
                                  quantity,
                                  paymentMethod: 'card'
                                }).then(() => {
                                  setSuccess(true);
                                  setTimeout(() => navigate('/bookings'), 1200);
                                }).catch(() => {
                                  setError('Payment failed. Please try again.');
                                }).finally(() => setPaying(false));
                              }, 2000);
                            }}
                          >
                            {paying ? 'Processing...' : `Pay $${((experience?.price || 0) * quantity).toFixed(2)}`}
                          </button>
                        </div>
                      )}

                      {paymentMethod === 'upi' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">UPI App</label>
                            <select
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              value={upiApp}
                              onChange={(e) => setUpiApp(e.target.value)}
                              required
                            >
                              <option value="">Select UPI App</option>
                              <option value="gpay">Google Pay</option>
                              <option value="phonepe">PhonePe</option>
                              <option value="paytm">Paytm</option>
                              <option value="amazonpay">Amazon Pay</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={paying || !userName || !userEmail || !slotDate || !slotTime || !quantity || !upiApp}
                            onClick={() => {
                              setPaying(true);
                              setError('');
                              // Simulate UPI payment processing
                              setTimeout(() => {
                                axios.post('/api/bookings', {
                                  experienceId,
                                  slotDate,
                                  slotTime,
                                  userName,
                                  userEmail,
                                  quantity,
                                  paymentMethod: 'upi',
                                  upiApp
                                }).then(() => {
                                  setSuccess(true);
                                  setTimeout(() => navigate('/bookings'), 1200);
                                }).catch(() => {
                                  setError('Payment failed. Please try again.');
                                }).finally(() => setPaying(false));
                              }, 2000);
                            }}
                          >
                            {paying ? 'Processing...' : `Pay with ${upiApp || 'UPI'}`}
                          </button>
                        </div>
                      )}

                      {paymentMethod === 'apple' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                </svg>
                              </div>
                              <p className="text-gray-600 dark:text-gray-300 mb-4">Touch ID or Face ID required</p>
                              <button
                                type="button"
                                className="bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={paying || !userName || !userEmail || !slotDate || !slotTime || !quantity}
                                onClick={() => {
                                  setPaying(true);
                                  setError('');
                                  // Simulate Apple Pay processing
                                  setTimeout(() => {
                                    axios.post('/api/bookings', {
                                      experienceId,
                                      slotDate,
                                      slotTime,
                                      userName,
                                      userEmail,
                                      quantity,
                                      paymentMethod: 'apple'
                                    }).then(() => {
                                      setSuccess(true);
                                      setTimeout(() => navigate('/bookings'), 1200);
                                    }).catch(() => {
                                      setError('Payment failed. Please try again.');
                                    }).finally(() => setPaying(false));
                                  }, 2000);
                                }}
                              >
                                {paying ? 'Processing...' : `Pay $${((experience?.price || 0) * quantity).toFixed(2)}`}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Your payment information is secure and encrypted
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
