import { Check, ChevronDown, Search, X, type LucideIcon } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Field, IconButton } from '@/components/ui/primitives';
import { palette, theme } from '@/constants/theme';

export type SelectOption = {
  label: string;
  value: string;
  description?: string;
};

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar',
  icon: Icon,
  searchable = false,
  disabled = false,
}: {
  label?: string;
  value?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  searchable?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      `${option.label} ${option.description || ''}`.toLowerCase().includes(normalized)
    );
  }, [options, query]);

  function close() {
    setOpen(false);
    setQuery('');
  }

  return (
    <View style={styles.container}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, disabled && styles.disabled, pressed && styles.pressed]}>
        {Icon ? <Icon color={theme.colors.textMuted} size={19} /> : null}
        <View style={styles.triggerCopy}>
          <AppText color={selected ? theme.colors.text : theme.colors.textMuted} numberOfLines={1}>
            {selected?.label || placeholder}
          </AppText>
          {selected?.description ? (
            <AppText color={theme.colors.textMuted} numberOfLines={1} variant="micro">
              {selected.description}
            </AppText>
          ) : null}
        </View>
        <ChevronDown color={theme.colors.textMuted} size={19} />
      </Pressable>

      <Modal animationType="slide" onRequestClose={close} transparent visible={open}>
        <View style={styles.scrim}>
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <AppText variant="title">{label || 'Seleccionar opcion'}</AppText>
                <AppText color={theme.colors.textMuted} variant="caption">
                  {options.length} opciones disponibles
                </AppText>
              </View>
              <IconButton accessibilityLabel="Cerrar selector" icon={X} onPress={close} />
            </View>
            {searchable ? (
              <View style={styles.search}>
                <Field icon={Search} onChangeText={setQuery} placeholder="Buscar..." value={query} />
              </View>
            ) : null}
            <ScrollView contentContainerStyle={styles.options} keyboardShouldPersistTaps="handled">
              {filtered.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      close();
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      active && styles.optionActive,
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.optionCopy}>
                      <AppText color={active ? theme.colors.primary : theme.colors.text} variant="label">
                        {option.label}
                      </AppText>
                      {option.description ? (
                        <AppText color={theme.colors.textMuted} variant="caption">{option.description}</AppText>
                      ) : null}
                    </View>
                    {active ? (
                      <View style={styles.check}>
                        <Check color={palette.paper} size={16} strokeWidth={3} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
              {!filtered.length ? (
                <AppText color={theme.colors.textMuted} style={styles.empty} variant="body">
                  No se encontraron opciones.
                </AppText>
              ) : null}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 7 },
  trigger: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  triggerCopy: { flex: 1 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.82 },
  scrim: { backgroundColor: palette.scrim, flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '82%',
    minHeight: '38%',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: theme.colors.borderStrong,
    borderRadius: 4,
    height: 5,
    marginTop: 9,
    width: 46,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 18,
  },
  headerCopy: { flex: 1 },
  search: { paddingHorizontal: 16, paddingTop: 12 },
  options: { gap: 8, padding: 16, paddingBottom: 36 },
  option: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 58,
    padding: 13,
  },
  optionActive: { backgroundColor: theme.colors.accentSoft, borderColor: '#9CD4E8' },
  optionCopy: { flex: 1 },
  check: {
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: 11,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  empty: { paddingVertical: 28, textAlign: 'center' },
});
