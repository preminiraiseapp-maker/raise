import { Platform } from 'react-native'

export type BodyWeightSample = {
  value: number // kg
  date: string  // YYYY-MM-DD
}

// HealthKit is only available on iOS native builds (not Expo Go, not web)
let AppleHealthKit: any = null

if (Platform.OS === 'ios') {
  try {
    AppleHealthKit = require('react-native-health').default
  } catch {
    // Not available in Expo Go — requires a Dev Build
  }
}

export const isHealthKitAvailable = Platform.OS === 'ios' && AppleHealthKit !== null

export async function requestHealthKitPermissions(): Promise<boolean> {
  if (!isHealthKitAvailable || !AppleHealthKit) return false
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(
      {
        permissions: {
          read: [AppleHealthKit.Constants.Permissions.Weight],
          write: [],
        },
      },
      (err: Error | null) => resolve(!err),
    )
  })
}

export async function getBodyWeightSamples(startDate: string): Promise<BodyWeightSample[]> {
  if (!isHealthKitAvailable || !AppleHealthKit) return []
  return new Promise((resolve) => {
    AppleHealthKit.getWeightSamples(
      { startDate, unit: 'gram' },
      (err: Error | null, results: any[]) => {
        if (err || !results) { resolve([]); return }
        resolve(
          results.map((r) => ({
            value: Math.round((r.value / 1000) * 10) / 10, // grams → kg, 1 decimal
            date: r.startDate.split('T')[0],
          })),
        )
      },
    )
  })
}
