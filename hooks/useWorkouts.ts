import { useState, useEffect, useCallback } from 'react'
import { supabase, getUserId } from '@/lib/supabase'
import type { WorkoutSession, WorkoutSessionWithSets } from '@/types/database'

export function useWeekWorkouts(weekStart: string, weekEnd: string) {
  const [sessions, setSessions] = useState<WorkoutSessionWithSets[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const userId = await getUserId()
    if (!userId) return
    const { data } = await supabase
      .from('workout_sessions')
      .select('*, workout_sets(*, exercise:exercises(*))')
      .eq('user_id', userId)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .order('date')
    setSessions((data as WorkoutSessionWithSets[]) ?? [])
    setLoading(false)
  }, [weekStart, weekEnd])

  useEffect(() => { fetch() }, [fetch])

  return { sessions, loading, refetch: fetch }
}

export function useSession(sessionId: string) {
  const [session, setSession] = useState<WorkoutSessionWithSets | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('workout_sessions')
      .select('*, workout_sets(*, exercise:exercises(*))')
      .eq('id', sessionId)
      .single()
    setSession(data as WorkoutSessionWithSets | null)
    setLoading(false)
  }, [sessionId])

  useEffect(() => { fetch() }, [fetch])

  return { session, loading, refetch: fetch }
}

export function useAllSessions() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const userId = await getUserId()
    if (!userId) return
    const { data } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('date', { ascending: false })
    setSessions(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { sessions, loading, refetch: fetch }
}

export function useExerciseHistory(exerciseId: string) {
  const [sets, setSets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const userId = await getUserId()
    if (!userId) return
    const { data } = await supabase
      .from('workout_sets')
      .select('*, session:workout_sessions!inner(date, user_id, status)')
      .eq('exercise_id', exerciseId)
      .eq('session.user_id', userId)
      .eq('session.status', 'completed')
      .eq('is_warmup', false)
      .order('created_at', { ascending: false })
      .limit(100)
    setSets(data ?? [])
    setLoading(false)
  }, [exerciseId])

  useEffect(() => { fetch() }, [fetch])

  return { sets, loading, refetch: fetch }
}
