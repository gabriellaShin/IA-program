import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { register as registerService } from '../services/authService';
import './Auth.css';

const HEALTH_CONDITIONS = [
  { value: 'lactose_intolerance', label: 'Lactose intolerance' },
  { value: 'allergy_peanuts', label: 'Peanut allergy' },
  { value: 'allergy_shellfish', label: 'Shellfish allergy' },
  { value: 'allergy_eggs', label: 'Egg allergy' },
  { value: 'allergy_milk', label: 'Milk allergy' },
  { value: 'eating_disorder', label: 'Eating disorder' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'obesity', label: 'Obesity' },
  { value: 'hypertension', label: 'Hypertension' },
  { value: 'hyperlipidemia', label: 'Hyperlipidemia' }
];

const DIET_CHARACTERISTICS = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' }
];

function getRegistrationErrorMessage(err: unknown): string {
  const fallback = 'Registration failed.';
  if (typeof err !== 'object' || err === null) {
    return fallback;
  }

  const response = 'response' in err
    ? (err as { response?: { status?: number; data?: unknown } }).response
    : undefined;
  const status = response?.status;
  const data = response?.data;

  let message = '';
  if (typeof data === 'string') {
    message = data.trim();
  } else if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.error === 'string') {
      message = record.error;
    } else if (typeof record.error === 'object' && record.error !== null) {
      const nested = record.error as Record<string, unknown>;
      if (typeof nested.message === 'string') {
        message = nested.message;
      }
    } else if (typeof record.message === 'string') {
      message = record.message;
    }
  }

  if (status === 409) {
    return message || 'Username already exists.';
  }
  return message || fallback;
}

function Register() {
  // Step 1: Basic info
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState('');
  const [dietGoal, setDietGoal] = useState<'weight_gain' | 'weight_loss' | 'maintenance'>('maintenance');
  
  // Step 2: Diet & health
  const [dietCharacteristics, setDietCharacteristics] = useState<string[]>([]);
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  // Step 1 validation
  const validateStep1 = () => {
    if (!username || !password || !name || !age) {
      setError('Please fill in all required fields.');
      return false;
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (parseInt(age) < 1 || parseInt(age) > 150) {
      setError('Please enter a valid age.');
      return false;
    }
    return true;
  };

  const handleStep1Next = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleStep2Submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = {
        username,
        password,
        name,
        gender,
        age: parseInt(age),
        diet_goal: dietGoal,
        diet_characteristics: dietCharacteristics,
        health_conditions: healthConditions.map(condition => ({
          condition_type: condition,
          details: {}
        }))
      };

      const response = await registerService(userData);
      login(response.user);
      navigate('/meal-plan');
    } catch (err: unknown) {
      const message = getRegistrationErrorMessage(err);
      setError(message);
      const status = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
      if (status === 409) {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleDietCharacteristic = (value: string) => {
    setDietCharacteristics(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const toggleHealthCondition = (value: string) => {
    setHealthConditions(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Sign Up</h1>
        <div className="register-steps">
          <span className={step === 1 ? 'active' : ''}>1. Basic info</span>
          <span className={step === 2 ? 'active' : ''}>2. Diet & health</span>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleStep1Next} className="auth-form">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              {error === 'Username already exists.' && (
                <p className="field-error">{error}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Password * (min. 6 chars)</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="password-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="password-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  className="form-input"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPasswordConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPasswordConfirm ? 'Hide password' : 'Show password'}
                >
                  {showPasswordConfirm ? (
                    <svg className="password-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="password-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordConfirm.length > 0 && password !== passwordConfirm && (
                <p className="field-error">Passwords do not match.</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select
                className="form-select"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Age *</label>
              <input
                type="number"
                className="form-input"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="1"
                max="150"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Diet goal *</label>
              <select
                className="form-select"
                value={dietGoal}
                onChange={(e) => setDietGoal(e.target.value as any)}
                required
              >
                <option value="maintenance">Maintenance</option>
                <option value="weight_gain">Weight gain</option>
                <option value="weight_loss">Weight loss</option>
              </select>
            </div>

            <div className="form-submit-step1">
              <button type="submit" className="btn btn-primary">
                Next
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Diet characteristics (optional)</label>
              <div className="checkbox-group">
                {DIET_CHARACTERISTICS.map(item => (
                  <label key={item.value} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={dietCharacteristics.includes(item.value)}
                      onChange={() => toggleDietCharacteristic(item.value)}
                      disabled={loading}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Conditions / Allergies (optional)</label>
              <div className="checkbox-group">
                {HEALTH_CONDITIONS.map(item => (
                  <label key={item.value} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={healthConditions.includes(item.value)}
                      onChange={() => toggleHealthCondition(item.value)}
                      disabled={loading}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Log In</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
