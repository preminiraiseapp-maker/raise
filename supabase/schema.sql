-- Run this entire file in the Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- EXERCISES TABLE (public read, auth write)
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT CHECK (muscle_group IN ('Chest','Back','Legs','Glutes','Shoulders','Arms','Core','Full Body','Cardio')),
  machine_settings TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WORKOUT SESSIONS TABLE
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WORKOUT SETS TABLE
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  exercise_order INTEGER NOT NULL DEFAULT 0,
  set_number INTEGER NOT NULL DEFAULT 1,
  effort TEXT CHECK (effort IN ('hard','max')),
  planned_reps INTEGER,
  planned_weight NUMERIC(6,2),
  actual_reps INTEGER,
  actual_weight NUMERIC(6,2),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BODY WEIGHT LOGS TABLE
CREATE TABLE IF NOT EXISTS body_weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight NUMERIC(5,2) NOT NULL,
  date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','healthkit')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- STEP LOGS TABLE
CREATE TABLE IF NOT EXISTS step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  steps INTEGER NOT NULL,
  date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','healthkit')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_sets_session ON workout_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_body_weight_logs_user_date ON body_weight_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_step_logs_user_date ON step_logs(user_id, date);

-- ROW LEVEL SECURITY
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_logs ENABLE ROW LEVEL SECURITY;

-- Exercises: anyone can read; any authenticated user can insert custom exercises
-- and edit them (name, muscle group, machine settings)
CREATE POLICY "exercises_read" ON exercises FOR SELECT USING (true);
CREATE POLICY "exercises_insert" ON exercises FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "exercises_update" ON exercises FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Sessions: users own their data
CREATE POLICY "sessions_all" ON workout_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sets: access via session ownership
CREATE POLICY "sets_all" ON workout_sets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions s
      WHERE s.id = workout_sets.session_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sessions s
      WHERE s.id = workout_sets.session_id AND s.user_id = auth.uid()
    )
  );

-- Body weight: users own their data
CREATE POLICY "body_weight_all" ON body_weight_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Steps: users own their data
CREATE POLICY "step_logs_all" ON step_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- TABLE GRANTS
-- RLS policies are only evaluated after the table-level grant check passes.
-- Supabase normally provisions these automatically; run explicitly in case this project didn't get them.
GRANT SELECT, INSERT, UPDATE ON public.exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_weight_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.step_logs TO authenticated;

-- CARDIO TIME TRACKING
-- Treadmill/Stairmaster-style exercises are tracked by duration instead of
-- reps and weight. Run this block in the Supabase SQL Editor.
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS tracking_type TEXT NOT NULL DEFAULT 'reps_weight'
  CHECK (tracking_type IN ('reps_weight', 'time'));
ALTER TABLE workout_sets ADD COLUMN IF NOT EXISTS planned_duration_minutes NUMERIC(6,2);
ALTER TABLE workout_sets ADD COLUMN IF NOT EXISTS actual_duration_minutes NUMERIC(6,2);

UPDATE exercises SET tracking_type = 'time' WHERE muscle_group = 'Cardio';

-- SET EFFORT MARKER
-- Replaces the old is_warmup flag. Tag a set as 'hard' or 'max' effort after logging it.
-- Run this block in the Supabase SQL Editor.
ALTER TABLE workout_sets ADD COLUMN IF NOT EXISTS effort TEXT CHECK (effort IN ('hard','max'));
ALTER TABLE workout_sets DROP COLUMN IF EXISTS is_warmup;

-- MACHINE SETTINGS
-- Free-text note per exercise for remembering machine setup (seat height, pad, pin…).
-- Run this block in the Supabase SQL Editor.
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS machine_settings TEXT;

-- The original schema only granted SELECT + INSERT on exercises, so editing one
-- (machine settings, recategorising) was silently blocked. Add UPDATE.
GRANT UPDATE ON public.exercises TO authenticated;
DROP POLICY IF EXISTS "exercises_update" ON exercises;
CREATE POLICY "exercises_update" ON exercises FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ALL CARDIO IS TIME-TRACKED
-- Every cardio exercise (not just Treadmill/Stairmaster) is tracked by duration.
-- Run this block in the Supabase SQL Editor.
UPDATE exercises SET tracking_type = 'time' WHERE muscle_group = 'Cardio';

-- PLANKS ARE TIME-TRACKED
-- Any exercise with "plank" in the name is a hold, so track it by duration.
-- Run this block in the Supabase SQL Editor.
UPDATE exercises SET tracking_type = 'time' WHERE name ILIKE '%plank%';

-- GLUTES + FULL BODY MUSCLE GROUPS
-- Widen the muscle_group check constraint.
-- Run this block in the Supabase SQL Editor.
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_muscle_group_check;
ALTER TABLE exercises ADD CONSTRAINT exercises_muscle_group_check
  CHECK (muscle_group IN ('Chest','Back','Legs','Glutes','Shoulders','Arms','Core','Full Body','Cardio'));

-- Optionally move existing exercises into the new groups:
-- UPDATE exercises SET muscle_group = 'Glutes'
--   WHERE name IN ('Hip Thrust', 'Cable Kickbacks', 'Glute Bridge');
-- UPDATE exercises SET muscle_group = 'Full Body'
--   WHERE name IN ('Deadlift', 'Clean and Press', 'Thruster', 'Burpee');
