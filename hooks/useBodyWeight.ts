import { useState, useEffect, useCallback } from 'react'
import { supabase, getUserId } from '@/lib/supabase'
import { subMonths, format } from 'date-fns'
import type { BodyWeightLog } from '@/types/database'

export function useBodyWeight(monthsBack = 6) {
  const [logs, setLogs] = useState<BodyWeightLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const userId = await getUserId()
    if (!userId) return
    const since = format(subMonths(new Date(), monthsBack), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('body_weight_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', since)
      .order('date')
    setLogs(data ?? [])
    setLoading(false)
  }, [monthsBack])

  useEffect(() => { fetch() }, [fetch])

  async function logWeight(weight: number, date: string, source: 'manual' | 'healthkit' = 'manual') {
    const userId = await getUserId()
    if (!userId) return
    const { error } = await supabase
      .from('body_weight_logs')
      .upsert({ user_id: userId, weight, date, source }, { onConflict: 'user_id,date' })
    if (!error) fetch()
  }

  async function syncFromHealthKit() {
    const { requestHealthKitPermissions, getBodyWeightSamples, isHealthKitAvailable } =
      await import('@/lib/healthkit')
    if (!isHealthKitAvailable) return
    const granted = await requestHealthKitPermissions()
    if (!granted) return
    const since = format(subMonths(new Date(), monthsBack), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
    const samples = await getBodyWeightSamples(since)
    for (const sample of samples) {
      await logWeight(sample.value, sample.date, 'healthkit')
    }
  }

  return { logs, loading, refetch: fetch, logWeight, syncFromHealthKit }
}
