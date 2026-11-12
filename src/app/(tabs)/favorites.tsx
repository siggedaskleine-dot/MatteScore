import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header } from '../../components/Header';
import { MatchRow } from '../../components/MatchList';
import { DemoBanner, Empty, SectionHeader } from '../../components/ui';
import { countryFlag, countryName } from '../../countries';
import { useFavorites } from '../../state/favorites';
import { colors } from '../../theme';

export default function Favorites() {
  const fav = useFavorites();
  const matches = Object.values(fav.matches).sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
  const leagues = Object.values(fav.leagues).sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  const empty = matches.length === 0 && leagues.length === 0;
  return (
    <View style={styles.screen}>
      <Header />
      <DemoBanner />
      <ScrollView>
        {empty && <Empty text={'Tryck på stjärnan vid en match eller liga\nför att spara den här.'} icon="star-outline" />}
        {matches.length > 0 && <SectionHeader title="MATCHER" fav />}
        {matches.map((f) => (
          <MatchRow key={f.fixture.id} f={f} />
        ))}
        {leagues.length > 0 && <SectionHeader title="LIGOR" fav />}
        {leagues.map((l) => (
          <View key={l.id} style={styles.row}>
            <Text style={{ fontSize: 24, width: 40 }}>{countryFlag(l.country)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.country}>{countryName(l.country).toUpperCase()}</Text>
              <Text style={styles.name}>{l.name}</Text>
            </View>
            <Pressable onPress={() => fav.toggleLeague(l)} hitSlop={10}>
              <Ionicons name="star" size={20} color={colors.accent} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  country: { fontSize: 11, color: colors.muted, letterSpacing: 1, fontWeight: '600' },
  name: { fontSize: 16, color: colors.text, fontWeight: '600' },
});
