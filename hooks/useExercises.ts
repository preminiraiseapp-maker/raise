import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Exercise, MuscleGroup } from '@/types/database'

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .order('muscle_group')
      .order('name')
    setExercises(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  async function addExercise(name: string, muscleGroup: MuscleGroup | null) {
    const { data, error } = await supabase
      .from('exercises')
      .insert({ name, muscle_group: muscleGroup })
      .select()
      .single()
    if (!error && data) {
      setExercises((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    }
    return { data, error }
  }

  async function updateExercise(
    id: string,
    patch: Partial<Pick<Exercise, 'name' | 'muscle_group' | 'machine_settings'>>,
  ) {
    const { data, error } = await supabase
      .from('exercises')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setExercises((prev) => prev.map((e) => (e.id === id ? data : e)))
    }
    return { data, error }
  }

  return { exercises, loading, refetch: fetch, addExercise, updateExercise }
}
