# BookIt — Experiences & Slots

![BookIt Screenshot](https://raw.githubusercontent.com/BarhateSanket/BookIt/main/frontend/src/assets/images/Screenshot%20(42).png)
![BookIt Screenshot](https://raw.githubusercontent.com/BarhateSanket/BookIt/main/frontend/src/assets/images/Screenshot%20(45).png)
![BookIt Screenshot](https://raw.githubusercontent.com/BarhateSanket/BookIt/main/frontend/src/assets/images/Screenshot%20(46).png)



[![Frontend](https://img.shields.io/badge/Frontend-React%2BTS-blue)](https://github.com/BarhateSanket/BookIt) [![Backend](https://img.shields.io/badge/Backend-Node.js%2BExpress-brightgreen)](https://github.com/BarhateSanket/BookIt) [![Database](https://img.shields.io/badge/Database-MongoDB-green)]()

A full-stack travel experience booking web application where users can browse curated activities, check available date/time slots, apply promo codes and complete bookings.  
Built with React + TypeScript + TailwindCSS on the frontend, Node.js + Express on the backend, and MongoDB for data storage. Fully responsive, built for deployment on Vercel & Render.

---

## 🔍 Features

- Browse a list of experiences with title, description, price and images  
- View detailed information for a selected experience including date/time slots  
- Real-time slot availability and “sold out” detection  
- Checkout flow with user details, quantity selection, promo code validation (e.g., `SAVE10`, `FLAT100`)  
- Booking creation via backend API and prevention of double-booking for the same slot  
- Responsive UI for desktop & mobile  
- Deployed via Vercel (frontend) and Render (backend) with MongoDB Atlas as the database  

---

## 🛠 Tech Stack

| Layer      | Technologies                              |
|------------|------------------------------------------|
| Frontend   | React, TypeScript, TailwindCSS, Vite     |
| Backend    | Node.js, Express                          |
| Database   | MongoDB (via Mongoose)                    |
| Deployment | Vercel (frontend) · Render (backend)      |
| Others     | Axios, React Router, dotenv, Nodemon      |

---

## 🚀 Getting Started

### Prerequisites  
- Node.js (v16+)  
- npm or yarn  
- MongoDB Atlas account (or local MongoDB)  

### Clone the repo  
```bash

cd backend
cp .env.example .env
# Set MONGODB_URI to your MongoDB connection string
# Optionally set PORT
npm install
npm run seed       # seed sample data
npm run dev        # launch backend on localhost


cd ../frontend
cp .env.example .env
# Set VITE_API_BASE to backend base URL (e.g., http://localhost:5000/api)
npm install
npm run dev       # launch frontend (default http://localhost:5173)

git clone https://github.com/BarhateSanket/BookIt.git
cd BookIt
