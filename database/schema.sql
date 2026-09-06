-- Database schema

-- users: user basic info
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
  diet_goal VARCHAR(50) NOT NULL CHECK (diet_goal IN ('weight_gain', 'weight_loss', 'maintenance')),
  diet_characteristics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- health_conditions: user health/diet conditions
CREATE TABLE IF NOT EXISTS health_conditions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  condition_type VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- weekly_intake_records: weekly intake records
CREATE TABLE IF NOT EXISTS weekly_intake_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  intake_data JSONB NOT NULL,
  macro JSONB NOT NULL,
  strengths JSONB,
  weaknesses JSONB,
  improvements JSONB,
  cautions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, year, week_start_date)
);

-- weekly_meal_plans: weekly meal plans
CREATE TABLE IF NOT EXISTS weekly_meal_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  plan_data JSONB NOT NULL,
  plan_macro JSONB NOT NULL,
  rationale JSONB NOT NULL,
  shopping_list JSONB,
  substitutions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, year, week_start_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_intake_user_date 
  ON weekly_intake_records(user_id, year, week_start_date DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_date 
  ON weekly_meal_plans(user_id, year, week_start_date DESC);

CREATE INDEX IF NOT EXISTS idx_health_conditions_user 
  ON health_conditions(user_id);

-- updated_at auto-update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- users trigger
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- weekly_intake_records trigger
CREATE TRIGGER update_intake_updated_at BEFORE UPDATE ON weekly_intake_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
