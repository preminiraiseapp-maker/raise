import { useMemo } from 'react'
import { startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, format } from 'date-fns'

export type WeekDay = {
  date: Date
  dateStr: string  // YYYY-MM-DD
  label: string    // "Mon 30 Jun"
  dayName: string  // "Mon"
  dayNum: string   // "30"
}

function makeWeekDays(weekOffset: number): WeekDay[] {
  const target = addWeeks(new Date(), weekOffset)
  const start = startOfWeek(target, { weekStartsOn: 1 })
  const end = endOfWeek(target, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end }).map((date) => ({
    date,
    dateStr: format(date, 'yyyy-MM-dd'),
    label: format(date, 'EEE d MMM'),
    dayName: format(date, 'EEE'),
    dayNum: format(date, 'd'),
  }))
}

export function useCurrentWeek(): WeekDay[] {
  return useMemo(() => makeWeekDays(0), [])
}

export function useNextWeek(): WeekDay[] {
  return useMemo(() => makeWeekDays(1), [])
}

export function useWeekRange(weekOffset: number) {
  return useMemo(() => {
    const days = makeWeekDays(weekOffset)
    return { days, start: days[0].dateStr, end: days[6].dateStr }
  }, [weekOffset])
}
