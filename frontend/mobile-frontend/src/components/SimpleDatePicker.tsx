import { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { colors } from '@/src/theme/colors';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function SimpleDatePicker({
  label,
  value,
  minDate,
  onChange,
}: {
  label: string;
  value: string;
  minDate?: string;
  onChange: (isoDate: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const pick = (day: number) => {
    const iso = toIsoDate(new Date(viewYear, viewMonth, day));
    if (minDate && iso < minDate) return;
    onChange(iso);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3"
      >
        <Text className="text-sm text-gray-800">{value || 'Select date'}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-6"
          onPress={() => setOpen(false)}
        >
          <Pressable className="w-full max-w-[320px] rounded-2xl bg-white p-4" onPress={() => {}}>
            <Text className="mb-3 text-center text-sm font-bold text-gray-900">{label}</Text>
            <View className="mb-3 flex-row items-center justify-between">
              <Pressable onPress={() => changeMonth(-1)} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
                <ChevronLeft size={16} color={colors.primary} />
              </Pressable>
              <Text className="text-sm font-semibold text-gray-800">
                {new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <Pressable onPress={() => changeMonth(1)} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
                <ChevronRight size={16} color={colors.primary} />
              </Pressable>
            </View>
            <View className="flex-row">
              {WEEKDAYS.map((w, i) => (
                <View key={i} className="w-[14.28%] items-center py-1">
                  <Text className="text-[10px] font-semibold text-gray-400">{w}</Text>
                </View>
              ))}
            </View>
            <View className="flex-row flex-wrap">
              {cells.map((day, i) => {
                const iso = day ? toIsoDate(new Date(viewYear, viewMonth, day)) : null;
                const isSelected = iso === value;
                const isDisabled = !!(iso && minDate && iso < minDate);
                return (
                  <View key={i} className="w-[14.28%] items-center py-1">
                    {day ? (
                      <Pressable
                        disabled={isDisabled}
                        onPress={() => pick(day)}
                        className="h-8 w-8 items-center justify-center rounded-full"
                        style={isSelected ? styles.dayCellSelected : styles.dayCellUnselected}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={
                            isDisabled
                              ? styles.dayTextDisabled
                              : isSelected
                                ? styles.dayTextSelected
                                : styles.dayTextDefault
                          }
                        >
                          {day}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellUnselected: {
    backgroundColor: 'transparent',
  },
  dayTextDisabled: {
    color: '#D1D5DB',
  },
  dayTextSelected: {
    color: '#fff',
  },
  dayTextDefault: {
    color: '#374151',
  },
});
