import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import Home from './pages/Home';
import Details from './pages/Details';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import Result from './pages/Result';
import Login from './pages/Login';
import Register from './pages/Register';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Sitemap from './pages/Sitemap';
import About from './pages/About';
import Navbar from '@/components/Navbar.tsx';
import Footer from '@/components/Footer.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <div className="flex-grow">
            <div className="container py-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/details/:id" element={<Details />} />
                <Route path="/checkout/:id" element={<Checkout />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/result" element={<Result />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/sitemap" element={<Sitemap />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </div>
          </div>
          <Footer />
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}