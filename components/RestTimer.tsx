import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native'
import { theme } from '@/constants/theme'

const DURATIONS = [60, 90, 120, 180]

type Props = {
  visible: boolean
  onDismiss: () => void
}

export default function RestTimer({ visible, onDismiss }: Props) {
  const [duration, setDuration] = useState(90)
  const [remaining, setRemaining] = useState(90)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (visible) {
      setRemaining(duration)
      setRunning(true)
    } else {
      setRunning(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [visible, duration])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  function changeDuration(d: number) {
    setDuration(d)
    setRemaining(d)
    setRunning(true)
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const pct = remaining / duration
  const done = remaining === 0

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          <Text style={styles.label}>Rest Timer</Text>
          <Text style={[styles.time, done && styles.timeDone]}>
            {done ? 'Done!' : `${mins}:${String(secs).padStart(2, '0')}`}
          </Text>

          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
          </View>

          <View style={styles.durations}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.durationBtn, duration === d && styles.durationBtnActive]}
                onPress={() => changeDuration(d)}
              >
                <Text style={[styles.durationText, duration === d && styles.durationTextActive]}>
                  {d < 60 ? `${d}s` : `${d / 60}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissText}>Skip</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    paddingBottom: 40,
    alignItems: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 56,
    fontWeight: '200',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  timeDone: { color: theme.colors.success },
  progressBg: {
    width: '100%',
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: 2,
  },
  durations: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  durationBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  durationBtnActive: {
    borderColor: theme.colors.accent,
    backgroundColor: `${theme.colors.accent}22`,
  },
  durationText: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
  durationTextActive: { color: theme.colors.accent, fontWeight: '600' },
  dismissBtn: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  dismissText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
})
