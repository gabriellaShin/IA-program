# Personalized Weekly Meal Plan Web App

An AI-powered web application that recommends weekly meal plans tailored to the user's health conditions, diet goals, and allergies.

## Features

This website consists of various features, such as weekly meal plan generation, intake evaluation, peronslised recommendations, and intake record management. In order to support each users with tailored meal plans, their last week intake records will be analyzed to provide imporved suggestions for the upcoming week. Based on the user profile set by the user, including age, gender, diet goal, and etc., the AI model will generate personalised recommendatons. 

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Axios

### Backend
- Node.js
- Express
- TypeScript
- Firebase Firestore
- JWT authentication
- OpenAI GPT-4o API

## Setup

### Prerequisites
- Node.js 18+
- Firebase project with Firestore enabled
- OpenAI API key

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Configure environment variables
Create `backend/.env`:
```
PORT=5000
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
```

Place `firebase-service-account.json` in the `backend/` directory.

### 3. Run development servers
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

## Project Structure

```
2026_MealPlan/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API communication
│   │   ├── contexts/   # Auth context
│   │   └── types/      # Type definitions
├── backend/            # Express backend
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── controllers/# Controllers
│   │   ├── services/   # Business logic
│   │   ├── db/         # Database connection
│   │   └── utils/      # Utility functions
└── database/           # SQL schema (reference only)
```

## License
MIT
