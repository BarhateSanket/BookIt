import React, { useEffect, useState } from 'react';
import { getExperiences } from '../api/api';
import ExperienceCard from '../components/ExperienceCard';

type Exp = {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
};

export default function Home() {
  const [exps, setExps] = useState<Exp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    getExperiences().then(res => {
      setExps(res.data || []);
    }).catch(err => {
      console.error(err);
    }).finally(() => setLoading(false));
  }, []);

  // Get unique categories from experiences
  const categories = Array.from(new Set(exps.map(e => e.category).filter(Boolean)));

  // Filter experiences by search and category
  const filtered = exps.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category ? e.category === category : true;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">BookIt — Experiences</h1>
        <p className="text-gray-600 mt-1">Explore and book curated local experiences.</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search experiences..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input w-full sm:w-1/2"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="input w-full sm:w-1/4"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">No experiences found.</div>
        ) : (
          filtered.map(e => (
            <ExperienceCard
              key={e._id}
              id={e._id}
              title={e.title}
              description={e.description}
              price={e.price}
              image={e.images?.[0]}
            />
          ))
        )}
      </div>
    </div>
  );
}
