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
const Dashboard = React.lazy(() => import('./pages/Dashboard.tsx'));
const About = React.lazy(() => import('./pages/About.tsx'));
const Privacy = React.lazy(() => import('./pages/Privacy.tsx'));
const Terms = React.lazy(() => import('./pages/Terms.tsx'));
const Sitemap = React.lazy(() => import('./pages/Sitemap.tsx'));
const Categories = React.lazy(() => import('./pages/Categories.tsx'));
const HelpCenter = React.lazy(() => import('./pages/HelpCenter.tsx'));
const Contact = React.lazy(() => import('./pages/Contact.tsx'));
const HowItWorks = React.lazy(() => import('./pages/HowItWorks.tsx'));

function NavbarAuthLinks({ theme, toggleTheme }) {
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
    <>
      {/* Desktop Navigation */}
      <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-8">
        <Link to="/#featured-experiences" className="text-gray-700 dark:text-gray-200 hover:text-primary-600">Experiences</Link>
        <NavLink to="/categories" className={({isActive}) => `hover:text-primary-600 ${isActive ? 'text-primary-600 font-semibold' : 'text-gray-700 dark:text-gray-200'}`}>Categories</NavLink>
        <NavLink to="/bookings" className={({isActive}) => `hover:text-primary-600 ${isActive ? 'text-primary-600 font-semibold' : 'text-gray-700 dark:text-gray-200'}`}>My Bookings</NavLink>
        <NavLink to="/favorites" className={({isActive}) => `hover:text-primary-600 ${isActive ? 'text-primary-600 font-semibold' : 'text-gray-700 dark:text-gray-200'}`}>Favorites</NavLink>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

        {user ? (
          <>
            <span className="font-medium">Hello, {user.name}</span>
            <div className="relative">
              <button
                onClick={() => setUser(prev => ({ ...prev, showProfileMenu: !prev?.showProfileMenu }))}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 focus:outline-none"
              >
                <img
                  src={user.avatar || '/logo-small.svg'}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-primary-200"
                />
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {user.showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setUser(prev => ({ ...prev, showProfileMenu: false }))}
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </div>
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setUser(prev => ({ ...prev, showProfileMenu: false }))}
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Dashboard
                    </div>
                  </Link>
                  <Link
                    to="/bookings"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setUser(prev => ({ ...prev, showProfileMenu: false }))}
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      My Bookings
                    </div>
                  </Link>
                  <Link
                    to="/favorites"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setUser(prev => ({ ...prev, showProfileMenu: false }))}
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Favorites
                    </div>
                  </Link>
                  <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setUser(prev => ({ ...prev, showProfileMenu: false }));
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </div>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn">Login</Link>
            <Link to="/register" className="btn btn-secondary">Register</Link>
          </>
        )}
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden">
        <MobileMenu user={user} handleLogout={handleLogout} setUser={setUser} />
      </div>
    </>
  );
}

function MobileMenu({ user, handleLogout, setUser }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
        aria-expanded="false"
      >
        <span className="sr-only">Open main menu</span>
        {isOpen ? (
          <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile menu panel */}
      {isOpen && (
        <div className="absolute top-16 inset-x-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/#featured-experiences"
              className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Experiences
            </Link>
            <NavLink
              to="/categories"
              className={({isActive}) => `block px-3 py-2 text-base font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 ${isActive ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-gray-200'}`}
              onClick={() => setIsOpen(false)}
            >
              Categories
            </NavLink>
            <NavLink
              to="/bookings"
              className={({isActive}) => `block px-3 py-2 text-base font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 ${isActive ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-gray-200'}`}
              onClick={() => setIsOpen(false)}
            >
              My Bookings
            </NavLink>
            <NavLink
              to="/favorites"
              className={({isActive}) => `block px-3 py-2 text-base font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 ${isActive ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-gray-200'}`}
              onClick={() => setIsOpen(false)}
            >
              Favorites
            </NavLink>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-3">
              {user ? (
                <div className="space-y-3">
                  {/* User Profile Section */}
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar || '/logo-small.svg'}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border-2 border-primary-200"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{user.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Dropdown Menu */}
                  <div className="space-y-1">
                    <Link
                      to="/dashboard"
                      className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </div>
                    </Link>
                    <Link
                      to="/dashboard"
                      className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Dashboard
                      </div>
                    </Link>
                    <Link
                      to="/bookings"
                      className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        My Bookings
                      </div>
                    </Link>
                    <Link
                      to="/favorites"
                      className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Favorites
                      </div>
                    </Link>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                    <button
                      className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
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

    // Add smooth transition class
    document.body.style.transition = 'background-color 0.4s ease, color 0.4s ease';
    setTimeout(() => {
      document.body.style.transition = '';
    }, 400);
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
      className="btn-secondary theme-toggle"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="flex items-center gap-2">
        {theme === 'dark' ? (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
            Light Mode
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
            Dark Mode
          </>
        )}
      </span>
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
    } catch (error) {
      console.error('Error parsing favorites:', error);
      return [];
    }
  });
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

    // Add smooth transition class
    document.body.style.transition = 'background-color 0.4s ease, color 0.4s ease';
    setTimeout(() => {
      document.body.style.transition = '';
    }, 400);
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

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

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
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, [favorites]);

  const toggleFavorite = (id) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
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
                <NavbarAuthLinks theme={theme} toggleTheme={toggleTheme} />
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
                      <div key={experience.id} className="card-hover h-full">
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
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
              <div id="description-section" className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6 items-stretch">
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
                        <div key={experience.id} className="card-hover h-full">
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
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/terms" className="hover:underline">Terms</Link>
            <Link to="/sitemap" className="hover:underline">Sitemap</Link>
            <Link to="/about" className="hover:underline">About</Link>
          </div>
          <div>BookIt, Inc. This is a demo project for booking experiences.</div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
