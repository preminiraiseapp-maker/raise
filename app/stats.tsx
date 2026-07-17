import { useState } from 'react'
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native'
import { format } from 'date-fns'
import { theme } from '@/constants/theme'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { useSteps } from '@/hooks/useSteps'
import { LineChart } from 'react-native-gifted-charts'

export default function StatsScreen() {
  const { logs, loading, logWeight, syncFromHealthKit } = useBodyWeight(6)
  const [newWeight, setNewWeight] = useState('')
  const [syncing, setSyncing] = useState(false)

  const { logs: stepLogs, loading: stepsLoading, logSteps } = useSteps(6)
  const [newSteps, setNewSteps] = useState('')

  async function handleLog() {
    const w = parseFloat(newWeight)
    if (!w || w < 20 || w > 300) {
      Alert.alert('Invalid weight', 'Enter a weight between 20 and 300 kg.')
      return
    }
    await logWeight(w, format(new Date(), 'yyyy-MM-dd'))
    setNewWeight('')
  }

  async function handleSync() {
    setSyncing(true)
    await syncFromHealthKit()
    setSyncing(false)
  }

  async function handleLogSteps() {
    const s = parseInt(newSteps, 10)
    if (!s || s < 0 || s > 100000) {
      Alert.alert('Invalid steps', 'Enter a step count between 0 and 100,000.')
      return
    }
    await logSteps(s, format(new Date(), 'yyyy-MM-dd'))
    setNewSteps('')
  }

  const chartData = logs.map((l) => ({
    value: l.weight,
    label: format(new Date(l.date + 'T00:00:00'), 'd/M'),
    dataPointColor: theme.colors.secondary,
  }))

  const latest = logs[logs.length - 1]
  const earliest = logs[0]
  const change = latest && earliest && latest.date !== earliest.date
    ? latest.weight - earliest.weight
    : null

  const stepsChartData = stepLogs.map((l) => ({
    value: l.steps,
    label: format(new Date(l.date + 'T00:00:00'), 'd/M'),
    dataPointColor: theme.colors.accent,
  }))

  const latestSteps = stepLogs[stepLogs.length - 1]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Stats & Progress</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Body Weight</Text>

        {latest && (
          <View style={styles.currentRow}>
            <View>
              <Text style={styles.currentLabel}>Current</Text>
              <Text style={styles.currentValue}>{latest.weight} kg</Text>
              <Text style={styles.currentDate}>{format(new Date(latest.date + 'T00:00:00'), 'd MMM yyyy')}</Text>
            </View>
            {change !== null && (
              <View style={styles.changeCard}>
                <Text style={styles.changeLabel}>6-month change</Text>
                <Text style={[styles.changeValue, change > 0 ? styles.changeUp : styles.changeDown]}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)} kg
                </Text>
              </View>
            )}
          </View>
        )}

        {chartData.length >= 2 && (
          <View style={styles.chartCard}>
            <LineChart
              data={chartData}
              color={theme.colors.secondary}
              thickness={2}
              curved
              hideDataPoints={chartData.length > 15}
              dataPointsColor={theme.colors.secondary}
              xAxisColor={theme.colors.border}
              yAxisColor={theme.colors.border}
              yAxisTextStyle={{ color: theme.colors.textMuted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: theme.colors.textMuted, fontSize: 9 }}
              rulesColor={theme.colors.border}
              backgroundColor={theme.colors.card}
              height={140}
              width={280}
              startFillColor={`${theme.colors.secondary}44`}
              endFillColor={`${theme.colors.secondary}00`}
              areaChart
            />
          </View>
        )}

        <View style={styles.logRow}>
          <TextInput
            style={styles.weightInput}
            value={newWeight}
            onChangeText={setNewWeight}
            placeholder="Enter weight (kg)"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.logBtn} onPress={handleLog}>
            <Text style={styles.logBtnText}>Log</Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.healthKitBtn, syncing && styles.healthKitBtnDisabled]}
            onPress={handleSync}
            disabled={syncing}
          >
            {syncing
              ? <ActivityIndicator size="small" color={theme.colors.accent} />
              : <Text style={styles.healthKitBtnText}>↑ Sync from Apple Health</Text>
            }
          </TouchableOpacity>
        )}

        {loading && <ActivityIndicator color={theme.colors.accent} style={{ marginTop: theme.spacing.md }} />}

        {logs.length > 0 && (
          <View style={styles.logList}>
            <Text style={styles.logListTitle}>Recent entries</Text>
            {[...logs].reverse().slice(0, 10).map((l) => (
              <View key={l.id} style={styles.logItem}>
                <Text style={styles.logDate}>{format(new Date(l.date + 'T00:00:00'), 'EEE d MMM yyyy')}</Text>
                <View style={styles.logRight}>
                  <Text style={styles.logWeight}>{l.weight} kg</Text>
                  {l.source === 'healthkit' && <Text style={styles.logSource}>Health</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Steps</Text>

        {latestSteps && (
          <View style={styles.currentRow}>
            <View>
              <Text style={styles.currentLabel}>Today's latest</Text>
              <Text style={styles.currentValue}>{latestSteps.steps.toLocaleString()}</Text>
              <Text style={styles.currentDate}>{format(new Date(latestSteps.date + 'T00:00:00'), 'd MMM yyyy')}</Text>
            </View>
          </View>
        )}

        {stepsChartData.length >= 2 && (
          <View style={styles.chartCard}>
            <LineChart
              data={stepsChartData}
              color={theme.colors.accent}
              thickness={2}
              curved
              hideDataPoints={stepsChartData.length > 15}
              dataPointsColor={theme.colors.accent}
              xAxisColor={theme.colors.border}
              yAxisColor={theme.colors.border}
              yAxisTextStyle={{ color: theme.colors.textMuted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: theme.colors.textMuted, fontSize: 9 }}
              rulesColor={theme.colors.border}
              backgroundColor={theme.colors.card}
              height={140}
              width={280}
              startFillColor={`${theme.colors.accent}44`}
              endFillColor={`${theme.colors.accent}00`}
              areaChart
            />
          </View>
        )}

        <View style={styles.logRow}>
          <TextInput
            style={styles.weightInput}
            value={newSteps}
            onChangeText={setNewSteps}
            placeholder="Enter steps"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.logBtn} onPress={handleLogSteps}>
            <Text style={styles.logBtnText}>Log</Text>
          </TouchableOpacity>
        </View>

        {stepsLoading && <ActivityIndicator color={theme.colors.accent} style={{ marginTop: theme.spacing.md }} />}

        {stepLogs.length > 0 && (
          <View style={styles.logList}>
            <Text style={styles.logListTitle}>Recent entries</Text>
            {[...stepLogs].reverse().slice(0, 10).map((l) => (
              <View key={l.id} style={styles.logItem}>
                <Text style={styles.logDate}>{format(new Date(l.date + 'T00:00:00'), 'EEE d MMM yyyy')}</Text>
                <View style={styles.logRight}>
                  <Text style={styles.logWeight}>{l.steps.toLocaleString()}</Text>
                  {l.source === 'healthkit' && <Text style={styles.logSource}>Health</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 60 },
  heading: { fontSize: theme.fontSize.xxl, fontWeight: '800', color: theme.colors.text, paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md },
  section: { marginHorizontal: theme.spacing.md, backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.md },
  currentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.lg },
  currentLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  currentValue: { fontSize: theme.fontSize.xxxl, fontWeight: '300', color: theme.colors.text, marginVertical: 2 },
  currentDate: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted },
  changeCard: { backgroundColor: theme.colors.background, borderRadius: theme.radius.md, padding: theme.spacing.md, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  changeLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 },
  changeValue: { fontSize: theme.fontSize.xl, fontWeight: '700' },
  changeUp: { color: theme.colors.danger },
  changeDown: { color: theme.colors.success },
  chartCard: { marginBottom: theme.spacing.lg, borderRadius: theme.radius.md, overflow: 'hidden' },
  logRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  weightInput: { flex: 1, height: 44, backgroundColor: theme.colors.background, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, color: theme.colors.text, fontSize: theme.fontSize.md, borderWidth: 1, borderColor: theme.colors.border },
  logBtn: { width: 60, height: 44, backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  logBtnText: { fontSize: theme.fontSize.md, fontWeight: '700', color: theme.colors.background },
  healthKitBtn: { height: 44, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md },
  healthKitBtnDisabled: { opacity: 0.5 },
  healthKitBtnText: { fontSize: theme.fontSize.sm, color: theme.colors.accent, fontWeight: '600' },
  logList: { marginTop: theme.spacing.sm },
  logListTitle: { fontSize: theme.fontSize.sm, fontWeight: '700', color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border },
  logDate: { fontSize: theme.fontSize.sm, color: theme.colors.text },
  logRight: { alignItems: 'flex-end' },
  logWeight: { fontSize: theme.fontSize.md, fontWeight: '700', color: theme.colors.secondary },
  logSource: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted },
})
