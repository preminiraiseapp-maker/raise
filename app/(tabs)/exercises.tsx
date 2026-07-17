import { useState } from 'react'
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native'
import { useRouter } from 'expo-router'
import { theme } from '@/constants/theme'
import { useExercises } from '@/hooks/useExercises'
import type { MuscleGroup } from '@/types/database'

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio']

export default function ExercisesScreen() {
  const router = useRouter()
  const { exercises, loading, addExercise } = useExercises()
  const [search, setSearch] = useState('')
  const [filterGroup, setFilterGroup] = useState<MuscleGroup | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState<MuscleGroup | null>(null)

  const filtered = exercises.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase())
    const matchGroup = !filterGroup || e.muscle_group === filterGroup
    return matchSearch && matchGroup
  })

  const grouped = MUSCLE_GROUPS.reduce<Record<string, typeof exercises>>((acc, g) => {
    const group = filtered.filter((e) => e.muscle_group === g)
    if (group.length > 0) acc[g] = group
    return acc
  }, {})
  const uncategorised = filtered.filter((e) => !e.muscle_group)

  async function handleAdd() {
    if (!newName.trim()) {
      Alert.alert('Name required', 'Please enter an exercise name.')
      return
    }
    const { error } = await addExercise(newName.trim(), newGroup)
    if (error) {
      Alert.alert('Error', 'Could not add exercise.')
    } else {
      setNewName('')
      setNewGroup(null)
      setShowAdd(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.heading}>Exercises</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Search exercises…"
        placeholderTextColor={theme.colors.textMuted}
      />

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !filterGroup && styles.filterChipActive]}
          onPress={() => setFilterGroup(null)}
        >
          <Text style={[styles.filterChipText, !filterGroup && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {MUSCLE_GROUPS.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.filterChip, filterGroup === g && styles.filterChipActive]}
            onPress={() => setFilterGroup(filterGroup === g ? null : g)}
          >
            <Text style={[styles.filterChipText, filterGroup === g && styles.filterChipTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {Object.entries(grouped).map(([group, items]) => (
          <View key={group}>
            <Text style={styles.groupHeading}>{group}</Text>
            {items.map((e) => (
              <TouchableOpacity key={e.id} style={styles.row} onPress={() => router.push(`/exercise/${e.id}`)}>
                <Text style={styles.exerciseName}>{e.name}</Text>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {uncategorised.length > 0 && (
          <View>
            <Text style={styles.groupHeading}>Other</Text>
            {uncategorised.map((e) => (
              <TouchableOpacity key={e.id} style={styles.row} onPress={() => router.push(`/exercise/${e.id}`)}>
                <Text style={styles.exerciseName}>{e.name}</Text>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {filtered.length === 0 && (
          <Text style={styles.empty}>No exercises found.</Text>
        )}
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowAdd(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Exercise</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Exercise name"
              placeholderTextColor={theme.colors.textMuted}
              autoFocus
            />
            <Text style={styles.modalLabel}>Muscle Group</Text>
            <View style={styles.groupGrid}>
              {MUSCLE_GROUPS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.groupChip, newGroup === g && styles.groupChipActive]}
                  onPress={() => setNewGroup(newGroup === g ? null : g)}
                >
                  <Text style={[styles.groupChipText, newGroup === g && styles.groupChipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Save Exercise</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  heading: { fontSize: theme.fontSize.xxl, fontWeight: '800', color: theme.colors.text },
  addBtn: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.card, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.accent },
  addBtnText: { fontSize: theme.fontSize.sm, color: theme.colors.accent, fontWeight: '600' },
  search: { marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm, height: 40, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: theme.spacing.md, gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  filterChip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.caramel, backgroundColor: theme.colors.card },
  filterChipActive: { borderColor: theme.colors.accent, backgroundColor: `${theme.colors.accent}22` },
  filterChipText: { fontSize: theme.fontSize.sm, color: theme.colors.text },
  filterChipTextActive: { color: theme.colors.accent, fontWeight: '600' },
  list: { paddingHorizontal: theme.spacing.md, paddingBottom: 40 },
  groupHeading: { fontSize: theme.fontSize.sm, fontWeight: '700', color: theme.colors.accent, textTransform: 'uppercase', letterSpacing: 1, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  exerciseName: { fontSize: theme.fontSize.md, color: theme.colors.text },
  arrow: { fontSize: 20, color: theme.colors.textMuted },
  empty: { textAlign: 'center', color: theme.colors.textMuted, marginTop: theme.spacing.xl, fontSize: theme.fontSize.md },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: theme.colors.card, borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg, padding: theme.spacing.xl, paddingBottom: 40 },
  modalTitle: { fontSize: theme.fontSize.xl, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.lg },
  modalInput: { height: 48, backgroundColor: theme.colors.background, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, color: theme.colors.text, fontSize: theme.fontSize.md, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.lg },
  modalLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, marginBottom: theme.spacing.sm, fontWeight: '600' },
  groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  groupChip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.border },
  groupChipActive: { borderColor: theme.colors.accent, backgroundColor: `${theme.colors.accent}22` },
  groupChipText: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
  groupChipTextActive: { color: theme.colors.accent, fontWeight: '600' },
  saveBtn: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, height: 50, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: theme.fontSize.md, fontWeight: '700', color: theme.colors.background },
})
