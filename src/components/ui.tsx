import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { isDemo } from '../api/client';
import { colors } from '../theme';

export function Logo({ uri, name, size = 28 }: { uri?: string | null; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    const initials = name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: colors.header }}>{initials}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={36} color={colors.muted} />
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.retry}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Försök igen</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Empty({ text, icon = 'football-outline' }: { text: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={36} color={colors.muted} />
      <Text style={styles.errorText}>{text}</Text>
    </View>
  );
}

export function DemoBanner() {
  if (!isDemo()) return null;
  return (
    <Pressable style={styles.demo} onPress={() => router.push('/settings')}>
      <Text style={styles.demoText}>DEMOLÄGE · påhittad data · tryck för att lägga in API-nyckel</Text>
    </Pressable>
  );
}

export function SectionHeader({ title, fav }: { title: string; fav?: boolean }) {
  return (
    <View style={[styles.section, fav && { backgroundColor: colors.favSection }]}>
      <Text style={styles.sectionText}>{title}</Text>
    </View>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && { color: '#fff' }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function ResultBadge({ r, size = 22 }: { r: 'W' | 'D' | 'L'; size?: number }) {
  const bg = r === 'W' ? colors.win : r === 'D' ? colors.draw : colors.loss;
  const label = r === 'W' ? 'V' : r === 'D' ? 'O' : 'F';
  return (
    <View style={{ width: size, height: size, borderRadius: 4, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', marginHorizontal: 1.5 }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.55 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: '#E3E8F0', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, minHeight: 200 },
  errorText: { color: colors.muted, textAlign: 'center', marginTop: 10, fontSize: 15 },
  retry: { marginTop: 14, backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  demo: { backgroundColor: colors.accent, paddingVertical: 4 },
  demoText: { color: '#fff', textAlign: 'center', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  section: { backgroundColor: colors.sectionBg, paddingHorizontal: 16, paddingVertical: 9 },
  sectionText: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: colors.text },
  chips: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: { backgroundColor: '#ECEEF2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  chipActive: { backgroundColor: colors.accent },
  chipText: { fontWeight: '700', fontSize: 12, letterSpacing: 0.8, color: '#374151' },
});
