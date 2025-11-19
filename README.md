# BookIt — Experiences & Slots Booking Platform

[![Frontend](https://img.shields.io/badge/Frontend-React%2BTypeScript%2BTailwindCSS-blue)](https://github.com/BarhateSanket/BookIt)
[![Backend](https://img.shields.io/badge/Backend-Node.js%2BExpress-brightgreen)](https://github.com/BarhateSanket/BookIt)
[![Database](https://img.shields.io/badge/Database-MongoDB-green)](https://github.com/BarhateSanket/BookIt)
[![Deployment](https://img.shields.io/badge/Deployment-Vercel%20%26%20Render-orange)](https://github.com/BarhateSanket/BookIt)

A full-stack web application for booking curated travel experiences and activities. Users can browse experiences, check real-time slot availability, apply promo codes, and complete secure bookings with integrated PayPal payments.

Built with modern web technologies for a responsive, scalable, and user-friendly experience.

## 📸 Screenshots

![BookIt Screenshot](https://raw.githubusercontent.com/BarhateSanket/BookIt/main/frontend/src/assets/images/Screenshot%20(42).png)
![BookIt Screenshot](https://raw.githubusercontent.com/BarhateSanket/BookIt/main/frontend/src/assets/images/Screenshot%20(45).png)
![BookIt Screenshot](https://raw.githubusercontent.com/BarhateSanket/BookIt/main/frontend/src/assets/images/Screenshot%20(46).png)

---

## 🌟 Features

- **Experience Discovery**: Browse a curated list of activities with images, descriptions, pricing, and ratings
- **Real-Time Availability**: View detailed experience information including date/time slots with live availability status
- **Smart Booking System**: Prevent double-bookings and handle "sold out" scenarios automatically
- **Secure Checkout**: Complete booking flow with user details, quantity selection, and promo code validation (e.g., `SAVE10`, `FLAT100`)
- **Payment Integration**: Secure payments via PayPal with webhook handling for transaction confirmation
- **User Authentication**: JWT-based authentication with registration, login, and user management
- **Responsive Design**: Fully responsive UI optimized for desktop and mobile devices
- **Admin Features**: Experience management, booking oversight, and promo code administration
- **Search & Filters**: Advanced search with filters for location, category, price, and availability
- **Saved Searches**: Save and manage search preferences for future use
- **Reviews & Ratings System**: User-generated reviews with moderation and rating aggregation
- **Calendar Integration**: Interactive calendar with availability management and time slot selection
- **Email Notifications**: Automated booking confirmations, reminders, and cancellation emails
- **User Dashboard Enhancements**: Booking history, profile management, favorites/wishlist, and upcoming bookings overview
- **Real-time Notifications**: Live booking status updates and availability changes via WebSocket
- **Live Chat Support**: Integrated chat widget for real-time customer support with automated responses
- **Waitlist Management**: Automatic booking notifications when slots become available
- **Group Booking System**: Support for multiple participants with group discounts and split payments
- **Advanced Admin Dashboard**: Real-time analytics, revenue tracking, user behavior insights, and performance monitoring

---

## 🚀 Upcoming Features

### Phase 4: Intelligence & Optimization
- **AI Recommendation Engine**: Personalized experience suggestions using collaborative filtering and machine learning
- **Dynamic Pricing**: Demand-based pricing with seasonal adjustments and competitor analysis
- **Advanced Analytics Dashboard**: Business intelligence reporting with customer lifetime value and conversion funnels
- **A/B Testing Framework**: Experiment management with statistical significance testing and feature flags
- **Third-party Integrations**: Calendar sync (Google/Outlook), social media sharing, weather API, and external review platforms

### Future Phases
- **Multi-tenancy Support**: Organization management with role-based access control and custom branding
- **Microservices Architecture**: Service decomposition with API Gateway and distributed tracing
- **Blockchain Integration**: NFT-based tickets, smart contracts for bookings, and cryptocurrency payments
- **AR/VR Features**: Virtual experience previews and 360° tours
- **Mobile Application**: React Native app for native mobile experience
- **Internationalization**: Multi-language support and regional payment methods

---

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript for type-safe component development
- **TailwindCSS** for utility-first styling and responsive design
- **Vite** for fast development and optimized builds
- **React Router** for client-side routing
- **Axios** for API communication
- **Leaflet** for interactive maps and location visualization
- **PayPal React SDK** for payment integration

### Backend
- **Node.js** with Express.js for RESTful API development
- **MongoDB** with Mongoose for data modeling and storage
- **JWT** for secure authentication and authorization
- **bcryptjs** for password hashing
- **PayPal Checkout SDK** for payment processing
- **Multer** for file upload handling
- **CORS** for cross-origin resource sharing

### Deployment & Infrastructure
- **Vercel** for frontend deployment
- **Render** for backend deployment
- **MongoDB Atlas** for cloud database hosting

---

## 📋 Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **MongoDB Atlas** account for database hosting - [Sign up here](https://www.mongodb.com/atlas)
- **PayPal Developer Account** for payment integration - [Sign up here](https://developer.paypal.com/)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/BarhateSanket/BookIt.git
cd BookIt
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory with the following environment variables:

```env
# Database
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/bookit?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Server
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

Seed the database with sample data:

```bash
npm run seed
```

Start the backend development server:

```bash
npm run dev
```

The backend API will be available at `http://localhost:5000`.

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 📖 Usage

### For Users
1. **Browse Experiences**: Visit the homepage to explore available activities
2. **View Details**: Click on any experience to see detailed information and available slots
3. **Book Experience**: Select date/time slots and proceed to checkout
4. **Apply Promo Codes**: Enter discount codes during checkout (e.g., `SAVE10` for 10% off)
5. **Complete Payment**: Secure payment processing via PayPal
6. **Manage Bookings**: View booking history and manage reservations

### For Developers
- **API Documentation**: Access API endpoints at `/api/*` routes
- **Database Models**: Check `backend/src/models/` for data schemas
- **Routes**: Explore `backend/src/routes/` for API endpoint implementations
- **Components**: Frontend components are organized in `frontend/src/components/`

---

## 🗄️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Experiences
- `GET /api/experiences` - Get all experiences (with filters)
- `GET /api/experiences/:id` - Get experience details
- `POST /api/experiences` - Create new experience (admin)
- `PUT /api/experiences/:id` - Update experience (admin)
- `DELETE /api/experiences/:id` - Delete experience (admin)

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Cancel booking

### Payments
- `POST /api/payments/create-order` - Create PayPal order
- `POST /api/payments/capture-order` - Capture PayPal payment
- `POST /api/payments/webhook` - PayPal webhook handler

### Promo Codes
- `GET /api/promo/validate/:code` - Validate promo code
- `POST /api/promo` - Create promo code (admin)

### Saved Searches
- `GET /api/saved-searches` - Get saved searches
- `POST /api/saved-searches` - Save search query
- `DELETE /api/saved-searches/:id` - Delete saved search

---

## 🏗️ Project Structure

```
BookIt/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # Database connection
│   │   ├── models/
│   │   │   ├── User.js            # User model
│   │   │   ├── Experience.js      # Experience model
│   │   │   ├── Booking.js         # Booking model
│   │   │   └── Promo.js           # Promo code model
│   │   ├── routes/
│   │   │   ├── auth.js            # Authentication routes
│   │   │   ├── experiences.js     # Experience CRUD routes
│   │   │   ├── bookings.js        # Booking management routes
│   │   │   ├── payments.js        # Payment processing routes
│   │   │   ├── promo.js           # Promo code routes
│   │   │   └── savedSearches.js   # Saved searches routes
│   │   ├── seed/
│   │   │   └── seed.js            # Database seeding script
│   │   └── index.js               # Main server file
│   ├── uploads/                   # File upload directory
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── images/                # Static images
│   │   └── logo.svg               # App logo
│   ├── src/
│   │   ├── api/
│   │   │   └── api.ts             # API client configuration
│   │   ├── components/
│   │   │   ├── ExperienceCard.tsx # Experience display component
│   │   │   ├── FilterPanel.tsx    # Search filters
│   │   │   ├── MapView.tsx        # Map visualization
│   │   │   └── SearchSuggestions.tsx # Search autocomplete
│   │   ├── pages/
│   │   │   ├── Home.tsx           # Landing page
│   │   │   ├── Details.tsx        # Experience details
│   │   │   ├── Checkout.tsx       # Booking checkout
│   │   │   ├── Payment.tsx        # Payment processing
│   │   │   ├── Login.tsx          # User login
│   │   │   ├── Register.tsx       # User registration
│   │   │   └── Dashboard.tsx      # User dashboard
│   │   ├── App.tsx                # Main app component
│   │   └── main.tsx               # App entry point
│   ├── index.html                 # HTML template
│   └── package.json
├── README.md                      # Project documentation
└── TODO.md                        # Development tasks
```

---

## 🔧 Development Scripts

### Backend
```bash
npm run dev        # Start development server with nodemon
npm run seed       # Seed database with sample data
```

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

---

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_API_BASE`: Your production backend URL
3. Deploy automatically on push to main branch

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard:
   - `MONGODB_URI`: MongoDB Atlas connection string
   - `JWT_SECRET`: JWT secret key
   - `PAYPAL_CLIENT_ID`: PayPal client ID
   - `PAYPAL_CLIENT_SECRET`: PayPal client secret
   - `CLIENT_ORIGIN`: Frontend production URL
3. Deploy automatically on push to main branch

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please ensure your code follows the existing code style and includes appropriate tests.

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For support, email support@bookit.com or join our Discord community.

---

## 📊 Project Status

- **Current Phase**: Phase 3 Completed, Ready for Phase 4
- **Version**: v1.1.0
- **Last Updated**: November 18, 2025

---

## 🙏 Acknowledgments

- Experience images sourced from Unsplash
- Icons provided by Heroicons
- UI components inspired by modern design systems

---

**Made with ❤️ by [Sanket Barhate](https://github.com/BarhateSanket)**
