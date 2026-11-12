import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { isoDate } from '../api/endpoints';
import { colors } from '../theme';

const DAYS = ['SÖN', 'MÅN', 'TIS', 'ONS', 'TOR', 'FRE', 'LÖR'];

export function DateStrip({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const today = new Date();
  const todayIso = isoDate(today);
  const dates = Array.from({ length: 15 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + i - 7));
  const ref = useRef<ScrollViewInstance>(null);
  const ITEM = 72;

  useEffect(() => {
    // centre "IDAG" (index 7) on first render
    setTimeout(() => ref.current?.scrollTo({ x: ITEM * 7 - ITEM * 2.2, animated: false }), 0);
  }, []);

  return (
    <View style={styles.wrap}>
      <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false}>
        {dates.map((d) => {
          const iso = isoDate(d);
          const active = iso === value;
          const label = iso === todayIso ? 'IDAG' : DAYS[d.getDay()];
          return (
            <Pressable key={iso} onPress={() => onChange(iso)} style={[styles.item, { width: ITEM }]}>
              <Text style={[styles.day, active && styles.active]}>{label}</Text>
              <Text style={[styles.date, active && styles.active]}>
                {String(d.getDate()).padStart(2, '0')}.{String(d.getMonth() + 1).padStart(2, '0')}.
              </Text>
              <View style={[styles.underline, active && { backgroundColor: colors.accent }]} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  item: { alignItems: 'center', paddingTop: 10 },
  day: { fontSize: 13, fontWeight: '700', color: '#4B5563', letterSpacing: 1 },
  date: { fontSize: 14, color: '#4B5563', marginTop: 2, letterSpacing: 0.5 },
  active: { color: colors.accent },
  underline: { height: 4, width: 40, borderRadius: 2, marginTop: 8, backgroundColor: 'transparent' },
});
