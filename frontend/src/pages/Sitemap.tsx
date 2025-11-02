import React from 'react';
import { Link } from 'react-router-dom';

export default function Sitemap() {
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Sitemap</h1>
        <p className="text-gray-600 dark:text-gray-400">Find everything on BookIt</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Main Pages */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-primary-600 dark:text-primary-400">Main Pages</h2>
          <ul className="space-y-2">
            <li><Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Home</Link></li>
            <li><Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Login</Link></li>
            <li><Link to="/register" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Register</Link></li>
            <li><span className="text-gray-500">Dashboard (Login Required)</span></li>
            <li><span className="text-gray-500">Bookings (Login Required)</span></li>
          </ul>
        </div>

        {/* Experience Categories */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-primary-600 dark:text-primary-400">Experience Categories</h2>
          <ul className="space-y-2">
            <li><span className="text-gray-700 dark:text-gray-300">Adventure & Outdoor</span></li>
            <li><span className="text-gray-700 dark:text-gray-300">Arts & Crafts</span></li>
            <li><span className="text-gray-700 dark:text-gray-300">Cooking & Food</span></li>
            <li><span className="text-gray-700 dark:text-gray-300">Fitness & Wellness</span></li>
            <li><span className="text-gray-700 dark:text-gray-300">Music & Performance</span></li>
            <li><span className="text-gray-700 dark:text-gray-300">Technology & Coding</span></li>
            <li><span className="text-gray-700 dark:text-gray-300">Photography & Media</span></li>
            <li><span className="text-gray-700 dark:text-gray-300">Sports & Recreation</span></li>
          </ul>
        </div>

        {/* Support & Help */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-primary-600 dark:text-primary-400">Support & Help</h2>
          <ul className="space-y-2">
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Help Center</a></li>
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Contact Us</a></li>
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">FAQ</a></li>
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Cancellation Policy</a></li>
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Refund Policy</a></li>
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Trust & Safety</a></li>
          </ul>
        </div>

        {/* Company Information */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-primary-600 dark:text-primary-400">Company</h2>
          <ul className="space-y-2">
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">About Us</a></li>
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">How It Works</a></li>
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Become a Host</a></li>
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Careers</a></li>
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Press</a></li>
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Blog</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-primary-600 dark:text-primary-400">Legal</h2>
          <ul className="space-y-2">
            <li><Link to="/privacy" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Terms of Service</Link></li>
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Cookie Policy</a></li>
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">Accessibility</a></li>
            <li><a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">DMCA</a></li>
          </ul>
        </div>

        {/* Popular Experiences */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-primary-600 dark:text-primary-400">Popular Experiences</h2>
          <ul className="space-y-2">
            <li><span className="text-gray-700 dark:text-gray-300">Kayaking Adventure</span></li>
            <li><span className="text-gray-700 dark:text-gray-300">Italian Cooking Class</span></li>
            <li><span className="text-gray-700 dark:text-gray-300">Photography Workshop</span></li>
            <li><span className="text-gray-700 dark:text-gray-300">Yoga Retreat</span></li>
            <li><span className="text-gray-700 dark:text-gray-300">Coding Bootcamp</span></li>
            <li><span className="text-gray-700 dark:text-gray-300">Wine Tasting Tour</span></li>
          </ul>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Contact Information</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Email: hello@bookit.com<br />
              Phone: (555) 123-4567<br />
              Address: 123 Experience Street, Adventure City, AC 12345
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Business Hours</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monday - Friday: 9:00 AM - 6:00 PM EST<br />
              Saturday: 10:00 AM - 4:00 PM EST<br />
              Sunday: Closed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
