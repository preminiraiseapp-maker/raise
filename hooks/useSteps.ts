import { useState, useEffect, useCallback } from 'react'
import { supabase, getUserId } from '@/lib/supabase'
import { subMonths, format } from 'date-fns'
import type { StepLog } from '@/types/database'

export function useSteps(monthsBack = 6) {
  const [logs, setLogs] = useState<StepLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const userId = await getUserId()
    if (!userId) return
    const since = format(subMonths(new Date(), monthsBack), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('step_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', since)
      .order('date')
    if (error) console.error('useSteps:', error.message)
    setLogs(data ?? [])
    setLoading(false)
  }, [monthsBack])

  useEffect(() => { fetch() }, [fetch])

  async function logSteps(steps: number, date: string) {
    const userId = await getUserId()
    if (!userId) return
    const { error } = await supabase
      .from('step_logs')
      .upsert({ user_id: userId, steps, date, source: 'manual' }, { onConflict: 'user_id,date' })
    if (error) console.error('logSteps:', error.message)
    else fetch()
  }

  return { logs, loading, refetch: fetch, logSteps }
}
