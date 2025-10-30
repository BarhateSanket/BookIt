import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExperience } from '../api/api';

export default function Details() {
  const { id } = useParams();
  const nav = useNavigate();
  const [exp, setExp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{date:string, time:string}|null>(null);

  useEffect(() => {
    if (!id) return;
    getExperience(id).then(r => setExp(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!exp) return <div>Experience not found</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow-sm">
      <h2 className="text-2xl font-bold">{exp.title}</h2>
      <p className="text-gray-700 mt-2">{exp.description}</p>

      <div className="mt-4">
        <h3 className="font-semibold">Available slots</h3>
        <div className="grid gap-3 mt-2">
          {exp.slots.map((s:any, idx:number) => {
            const soldOut = s.bookedCount >= s.capacity;
            const active = selectedSlot?.date === s.date && selectedSlot?.time === s.time;
            return (
              <button
                key={idx}
                disabled={soldOut}
                onClick={() => setSelectedSlot({ date: s.date, time: s.time })}
                className={`p-3 rounded border text-left ${soldOut ? 'opacity-60 cursor-not-allowed' : active ? 'border-blue-600' : ''}`}
              >
                <div className="flex justify-between">
                  <div>{s.date} · {s.time}</div>
                  <div>{soldOut ? 'Sold out' : `${s.capacity - s.bookedCount} seats`}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <button
          disabled={!selectedSlot}
          onClick={() => nav(`/checkout/${exp._id}`, { state: { slot: selectedSlot, title: exp.title, price: exp.price } })}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          Book now
        </button>
      </div>
    </div>
  );
}
