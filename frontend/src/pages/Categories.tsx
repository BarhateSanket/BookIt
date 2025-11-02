import React from 'react';
import { Link } from 'react-router-dom';

const categories = [
  {
    id: 'adventure-outdoor',
    name: 'Adventure & Outdoor',
    description: 'Thrilling outdoor experiences and adventures',
    image: '/images/hiking.jpg',
    count: 12
  },
  {
    id: 'arts-crafts',
    name: 'Arts & Crafts',
    description: 'Creative workshops and artistic endeavors',
    image: '/images/painting.jpg',
    count: 8
  },
  {
    id: 'cooking-food',
    name: 'Cooking & Food',
    description: 'Culinary experiences and food adventures',
    image: '/images/cooking.jpg',
    count: 15
  },
  {
    id: 'fitness-wellness',
    name: 'Fitness & Wellness',
    description: 'Health, fitness, and wellness activities',
    image: '/images/yoga.jpg',
    count: 10
  },
  {
    id: 'music-performance',
    name: 'Music & Performance',
    description: 'Musical and performance arts experiences',
    image: '/images/citytour.jpg',
    count: 6
  },
  {
    id: 'technology-coding',
    name: 'Technology & Coding',
    description: 'Tech workshops and coding experiences',
    image: '/images/coding.jpg',
    count: 9
  },
  {
    id: 'photography-media',
    name: 'Photography & Media',
    description: 'Visual arts and media production',
    image: '/images/photography.jpg',
    count: 7
  },
  {
    id: 'sports-recreation',
    name: 'Sports & Recreation',
    description: 'Sports activities and recreational fun',
    image: '/images/kayaking.jpg',
    count: 11
  }
];

export default function Categories() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Experience Categories
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Discover unique experiences across various categories. From outdoor adventures to creative workshops,
          find the perfect activity that matches your interests and passions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/experiences?category=${category.id}`}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <div className="aspect-w-16 aspect-h-9 relative overflow-hidden">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-semibold text-lg mb-1">
                  {category.name}
                </h3>
                <p className="text-white/90 text-sm">
                  {category.count} experiences
                </p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {category.description}
              </p>
              <div className="mt-4 flex items-center text-primary-600 dark:text-primary-400 font-medium">
                <span>Explore experiences</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Call to Action */}
      <div className="mt-16 text-center">
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Can't find what you're looking for?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            We're constantly adding new experiences and categories. Let us know what you'd like to see,
            and we'll work with local hosts to bring it to life.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            Suggest a Category
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
