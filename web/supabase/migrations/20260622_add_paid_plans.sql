-- Add paid_plans JSONB column to user_profiles for granular plan tracking
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS paid_plans JSONB DEFAULT '{}';
