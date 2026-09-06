import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile, updateHealthConditions } from '../services/userService';
import { UserProfile } from '../types';
import './Profile.css';

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

function Profile() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState('');
  const [dietGoal, setDietGoal] = useState<'weight_gain' | 'weight_loss' | 'maintenance'>('maintenance');
  const [dietCharacteristics, setDietCharacteristics] = useState<string[]>([]);
  const [healthConditions, setHealthConditions] = useState<string[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfile(data);
      
      // Reset form
      setName(data.user.name);
      setGender(data.user.gender);
      setAge(data.user.age.toString());
      setDietGoal(data.user.diet_goal);
      setDietCharacteristics(data.user.diet_characteristics);
      setHealthConditions(data.health_conditions.map(c => c.condition_type));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Update basic info
      await updateUserProfile({
        name,
        gender,
        age: parseInt(age),
        diet_goal: dietGoal,
        diet_characteristics: dietCharacteristics
      });

      // Update health info
      await updateHealthConditions(
        healthConditions.map(condition => ({
          condition_type: condition,
          details: {}
        }))
      );

      setSuccess('Profile updated successfully!');
      await refreshUser();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!profile) {
    return <div className="error-message">Profile not found.</div>;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle">Edit your profile information.</p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={profile.user.username}
              disabled
            />
            <small className="form-help">Username cannot be changed.</small>
          </div>

          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gender *</label>
            <select
              className="form-select"
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              required
              disabled={saving}
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
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Diet goal *</label>
            <select
              className="form-select"
              value={dietGoal}
              onChange={(e) => setDietGoal(e.target.value as any)}
              required
              disabled={saving}
            >
              <option value="maintenance">Maintenance</option>
              <option value="weight_gain">Weight gain</option>
              <option value="weight_loss">Weight loss</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Diet characteristics</label>
            <div className="checkbox-group">
              {DIET_CHARACTERISTICS.map(item => (
                <label key={item.value} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={dietCharacteristics.includes(item.value)}
                    onChange={() => toggleDietCharacteristic(item.value)}
                    disabled={saving}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Conditions / Allergies</label>
            <div className="checkbox-group">
              {HEALTH_CONDITIONS.map(item => (
                <label key={item.value} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={healthConditions.includes(item.value)}
                    onChange={() => toggleHealthCondition(item.value)}
                    disabled={saving}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="form-submit-center">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="card-title">Account info</h2>
        <p>Joined: {new Date(profile.user.created_at).toLocaleDateString('en-US')}</p>
        <p>Last updated: {new Date(profile.user.updated_at).toLocaleDateString('en-US')}</p>
      </div>
    </div>
  );
}

export default Profile;
