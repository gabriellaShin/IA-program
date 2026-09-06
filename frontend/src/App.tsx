import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import MealPlan from './pages/MealPlan';
import IntakeHistory from './pages/IntakeHistory';
import Profile from './pages/Profile';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/meal-plan" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/meal-plan" 
              element={
                <PrivateRoute>
                  <MealPlan />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/intake-history" 
              element={
                <PrivateRoute>
                  <IntakeHistory />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
