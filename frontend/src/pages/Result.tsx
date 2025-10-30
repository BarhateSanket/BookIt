import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function Result() {
  const { state }: any = useLocation();

  if (!state) return <div>No result</div>;

  if (state.success) {
    const b = state.booking;
    return (
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow-sm">
        <h2 className="text-2xl font-bold">Booking Confirmed</h2>
        <p className="mt-2">Booking ID: <span className="font-mono">{b._id}</span></p>
        <p>Experience ID: {b.experience}</p>
        <p>Slot: {b.slotDate} · {b.slotTime}</p>
        <p>Quantity: {b.quantity}</p>
        <p className="font-bold mt-3">Total paid: ₹{b.totalPrice}</p>
        <Link to="/" className="inline-block mt-4 text-blue-600">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow-sm">
      <h2 className="text-2xl font-bold">Booking Failed</h2>
      <p className="mt-2 text-red-600">{state.message || 'Unknown error'}</p>
      <Link to="/" className="inline-block mt-4 text-blue-600">Back to Home</Link>
    </div>
  );
}
