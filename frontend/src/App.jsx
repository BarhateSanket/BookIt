import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import './App.css';
import { experiences } from './data/experiences';
import ExperienceCard from './components/ExperienceCard';
import ReactLazy, { Suspense } from 'react';
const Login = React.lazy(() => import('./pages/Login.jsx'));
const Register = React.lazy(() => import('./pages/Register.jsx'));
const Checkout = React.lazy(() => import('./pages/Checkout.jsx'));
const Payment = React.lazy(() => import('./pages/Payment.tsx'));
const Bookings = React.lazy(() => import('./pages/Bookings.tsx'));
const Details = React.lazy(() => import('./pages/Details.tsx'));

function NavbarAuthLinks() {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });

  useEffect(() => {
    const handler = () => {
      const u = localStorage.getItem('user');
      setUser(u ? JSON.parse(u) : null);
    };
    window.addEventListener('userChanged', handler);
    return () => window.removeEventListener('userChanged', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userChanged'));
  };

  return (
    <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-8">
      <a href="/#featured-experiences" className="text-gray-700 dark:text-gray-200 hover:text-primary-600">Experiences</a>
      <NavLink to="/bookings" className={({isActive}) => `hover:text-primary-600 ${isActive ? 'text-primary-600 font-semibold' : 'text-gray-700 dark:text-gray-200'}`}>My Bookings</NavLink>
      <NavLink to="/favorites" className={({isActive}) => `hover:text-primary-600 ${isActive ? 'text-primary-600 font-semibold' : 'text-gray-700 dark:text-gray-200'}`}>Favorites</NavLink>
      <a href="#featured-experiences" className="btn">Book Now</a>
      {user ? (
        <>
          <span className="font-medium">Hello, {user.name}</span>
          <button className="btn" onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login" className="btn">Login</Link>
          <Link to="/register" className="btn btn-secondary">Register</Link>
        </>
      )}
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const saved = localStorage.getItem('theme');
      if (!saved) setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <button
      className="btn-secondary"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const [compact, setCompact] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('layout');
    return saved ? saved === 'compact' : false;
  });
  const [favorites, setFavorites] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('favorites');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    localStorage.setItem('layout', compact ? 'compact' : 'comfort');
  }, [compact]);

  useEffect(() => {
    try {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const toggleFavorite = (id) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 ring-gradient">
        {/* Navigation */}
        <nav className="glass sticky top-0 z-40 shadow-elevated border-b border-primary-300/40 bg-white/70 dark:bg-gray-900/80 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <Link to="/" className="flex items-center gap-2">
                  <img src="/logo-small.svg" alt="BookIt Logo" className="h-8 w-8 drop-shadow" />
                  <span className="text-3xl font-extrabold tracking-wide bg-gradient-to-r from-primary-400 via-secondary-500 to-primary-600 bg-clip-text text-transparent drop-shadow-lg">BookIt</span>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <NavbarAuthLinks />
              </div>
            </div>
          </div>
        </nav>
        <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-600">Loading…</div>}>
        <Routes>
          <Route path="/favorites" element={
            <div>
              {/* Hero-less simple section header */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Your Favorites</h2>
                {favorites.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-300">No favorites yet. Tap the heart on any experience to save it.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 lg:gap-6">
                    {experiences.filter((e) => favorites.includes(e.id)).map((experience) => (
                      <div key={experience.id} className="card-hover">
                        <ExperienceCard
                          experience={experience}
                          variant={compact ? 'compact' : 'standard'}
                          isFavorite={favorites.includes(experience.id)}
                          onToggleFavorite={() => toggleFavorite(experience.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/details/:id" element={<Details />} />
          <Route path="/" element={
            <div>
              {/* Hero Section */}
              <div className="relative bg-white dark:bg-gray-800">
                <div className="absolute inset-0">
                  <img
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=2070&auto=format&fit=crop"
                    alt="Hero background"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-900/40 to-transparent"></div>
                  <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-primary-500/20 blur-3xl animate-float"></div>
                  <div className="absolute -bottom-10 -left-10 w-80 h-80 rounded-full bg-secondary-500/20 blur-3xl animate-float-delayed"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
                  <div className="text-center">
                    <h2 className="text-4xl tracking-tight font-bold text-white sm:text-5xl md:text-6xl">
                      <span className="block">Discover Amazing</span>
                      <span className="block text-gradient">Experiences</span>
                    </h2>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-200 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                      Book unique experiences and create unforgettable memories. From adventure sports to culinary classes, find something that excites you.
                    </p>
                    <div className="relative mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                      <div className="flex flex-col items-center space-y-3">
                        {/* Explore Experiences button removed as requested */}
                        <div className="rounded-md shadow">
                          <a href="#description-section" className="btn-secondary">Learn More</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Description Section */}
              <div id="description-section" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <h2 className="text-2xl font-bold text-primary-700 dark:text-primary-300 mb-4 text-center">Why BookIt?</h2>
                <p className="text-lg text-gray-700 dark:text-gray-200 text-center mb-6">
                  BookIt is your gateway to unforgettable experiences. Whether you crave adventure, relaxation, or learning something new, our curated selection connects you with local experts and unique activities. Enjoy seamless booking, secure payments, and personalized recommendations—all in one place.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mx-auto max-w-2xl">
                  <li>Handpicked experiences for every interest</li>
                  <li>Trusted hosts and verified reviews</li>
                  <li>Easy booking and instant confirmation</li>
                  <li>Secure payment options</li>
                  <li>Support for solo travelers, families, and groups</li>
                </ul>
                {/* Featured Experiences */}
                <div id="featured-experiences" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Featured Experiences</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                      Discover unique activities hosted by local experts and artisans
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <button
                      className={`btn-secondary ${!compact ? 'ring-2 ring-primary-400' : ''}`}
                      onClick={() => setCompact(false)}
                    >
                      Comfort
                    </button>
                    <button
                      className={`btn-secondary ${compact ? 'ring-2 ring-primary-400' : ''}`}
                      onClick={() => setCompact(true)}
                    >
                      Compact
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 lg:gap-6">
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-2xl p-[1px]">
                          <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
                            <div className={`skeleton ${compact ? 'h-36' : 'h-52'} w-full`}></div>
                            <div className="p-6 space-y-3">
                              <div className="skeleton h-6 w-2/3 rounded"></div>
                              <div className="skeleton h-4 w-full rounded"></div>
                              <div className="skeleton h-4 w-5/6 rounded"></div>
                              <div className="skeleton h-8 w-32 rounded-lg mt-2"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      experiences.map((experience) => (
                        <div key={experience.id} className="card-hover">
                          <ExperienceCard
                            experience={experience}
                            variant={compact ? 'compact' : 'standard'}
                            isFavorite={favorites.includes(experience.id)}
                            onToggleFavorite={() => toggleFavorite(experience.id)}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          } />
        </Routes>
        </Suspense>
        <footer className="mt-12 py-6 border-t text-center text-gray-500 text-sm glass">
          <div className="mb-2">© 2025 BookIt, Inc.</div>
          <div className="flex flex-wrap justify-center gap-4 mb-2">
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
            <a href="#" className="hover:underline">Sitemap</a>
            <a href="#" className="hover:underline">Company details</a>
          </div>
          <div>BookIt, Inc. This is a demo project for booking experiences.</div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
