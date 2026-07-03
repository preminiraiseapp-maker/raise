export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Cardio'

export type SessionStatus = 'planned' | 'completed'

export interface Exercise {
  id: string
  name: string
  muscle_group: MuscleGroup | null
  created_at: string
}

export interface WorkoutSession {
  id: string
  user_id: string
  name: string
  date: string
  status: SessionStatus
  notes: string | null
  created_at: string
}

export interface WorkoutSet {
  id: string
  session_id: string
  exercise_id: string
  exercise_order: number
  set_number: number
  is_warmup: boolean
  planned_reps: number | null
  planned_weight: number | null
  actual_reps: number | null
  actual_weight: number | null
  completed: boolean
  created_at: string
}

export interface WorkoutSetWithExercise extends WorkoutSet {
  exercise: Exercise
}

export interface WorkoutSessionWithSets extends WorkoutSession {
  workout_sets: WorkoutSetWithExercise[]
}

export interface BodyWeightLog {
  id: string
  user_id: string
  weight: number
  date: string
  source: 'manual' | 'healthkit'
  created_at: string
}
