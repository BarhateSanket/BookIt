import React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
};

export default function ExperienceCard({ id, title, description, price, image }: Props) {
  return (
    <div className="bg-white rounded shadow-sm overflow-hidden">
      <img src={image || 'https://via.placeholder.com/800x400'} alt={title} className="w-full h-48 object-cover"/>
      <div className="p-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
        <div className="flex items-center justify-between mt-4">
          <div className="font-bold">₹{price}</div>
          <Link to={`/details/${id}`} className="text-sm bg-blue-600 text-white px-3 py-1 rounded">View</Link>
        </div>
      </div>
    </div>
  );
}
