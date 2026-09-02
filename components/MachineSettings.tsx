import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { theme } from '@/constants/theme'

type Props = {
  value: string | null
  onSave: (value: string | null) => void | Promise<void>
  readonly?: boolean
  /** compact = inline on a workout exercise card; otherwise a labelled card for the exercise detail screen */
  compact?: boolean
}

export default function MachineSettings({ value, onSave, readonly, compact }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  function startEditing() {
    setDraft(value ?? '')
    setEditing(true)
  }

  function save() {
    const trimmed = draft.trim()
    onSave(trimmed.length ? trimmed : null)
    setEditing(false)
  }

  if (editing) {
    return (
      <View style={compact ? styles.compactWrap : styles.cardWrap}>
        {!compact && <Text style={styles.cardLabel}>Machine setup</Text>}
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Seat 4, back pad B, pin 7…"
          placeholderTextColor={theme.colors.textMuted}
          multiline
          autoFocus
        />
        <View style={styles.editActions}>
          <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={save} style={styles.saveBtn}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (compact) {
    if (!value && readonly) return null
    return (
      <TouchableOpacity
        style={styles.compactRow}
        onPress={readonly ? undefined : startEditing}
        disabled={readonly}
        activeOpacity={0.6}
      >
        <Text style={styles.gear}>⚙</Text>
        <Text style={[styles.compactText, !value && styles.compactPlaceholder]} numberOfLines={2}>
          {value ?? 'Add machine setup'}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.cardWrap}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>Machine setup</Text>
        {!readonly && (
          <TouchableOpacity onPress={startEditing} hitSlop={8}>
            <Text style={styles.editLink}>{value ? 'Edit' : 'Add'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.cardValue, !value && styles.compactPlaceholder]}>
        {value ?? 'No settings saved yet.'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  compactWrap: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  gear: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
  compactText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.text,
  },
  compactPlaceholder: { color: theme.colors.textMuted, fontFamily: theme.fonts.body },
  cardWrap: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  cardLabel: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardValue: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.text,
    lineHeight: 22,
  },
  editLink: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.accent,
  },
  input: {
    minHeight: 44,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  cancelBtn: { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.md },
  cancelText: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.bodyMedium, color: theme.colors.textMuted },
  saveBtn: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
  },
  saveText: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.bodyBold, color: '#FFFFFF' },
})
