import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onQuotaChange } from '../api/client';
import { colors } from '../theme';

interface Props {
  onBack?: () => void;
  right?: React.ReactNode;
  onSearch?: () => void;
}

export function Header({ onBack, right, onSearch }: Props) {
  const insets = useSafeAreaInsets();
  const [menu, setMenu] = useState(false);
  const [quota, setQuota] = useState<number | null>(null);
  useEffect(() => {
    const off = onQuotaChange(setQuota);
    return () => {
      off();
    };
  }, []);

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      {onBack && (
        <Pressable onPress={onBack} hitSlop={12} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>
      )}
      <Pressable style={styles.sport} onPress={() => setMenu(true)}>
        <Ionicons name="football-outline" size={28} color="#fff" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.brand}>
            Matte<Text style={{ color: colors.accent }}>Score</Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.sportText}>Fotboll</Text>
            <Ionicons name="caret-down" size={14} color="#fff" style={{ marginLeft: 4 }} />
          </View>
        </View>
      </Pressable>
      <View style={{ flex: 1 }} />
      {quota !== null && <Text style={styles.quota}>{quota} anrop kvar</Text>}
      {onSearch && (
        <Pressable onPress={onSearch} hitSlop={10} style={{ marginLeft: 16 }}>
          <Ionicons name="search" size={24} color="#fff" />
        </Pressable>
      )}
      {right}
      {!onBack && (
        <Pressable onPress={() => router.push('/settings')} hitSlop={10} style={{ marginLeft: 16 }}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </Pressable>
      )}

      <Modal transparent visible={menu} animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenu(false)}>
          <View style={[styles.menu, { marginTop: insets.top + 70 }]}>
            <View style={styles.menuRow}>
              <Ionicons name="football" size={22} color={colors.accent} />
              <Text style={[styles.menuText, { color: colors.accent }]}>Fotboll</Text>
              <Ionicons name="checkmark" size={20} color={colors.accent} />
            </View>
            {['Ishockey', 'Tennis', 'Basket', 'Handboll'].map((s) => (
              <View key={s} style={styles.menuRow}>
                <Ionicons name="ellipse-outline" size={22} color="#C0C4CC" />
                <Text style={[styles.menuText, { color: '#9CA3AF' }]}>{s}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>kommer</Text>
              </View>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  sport: { flexDirection: 'row', alignItems: 'center' },
  brand: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5, opacity: 0.85 },
  sportText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  quota: { color: '#9FB0C8', fontSize: 11 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  menu: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, paddingVertical: 6 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '600' },
});
