import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFixturesByDate, isoDate } from '../../api/endpoints';
import { Header } from '../../components/Header';
import { DemoBanner, ErrorView, Loading, SectionHeader } from '../../components/ui';
import { countryFlag, countryName } from '../../countries';
import { useFavorites } from '../../state/favorites';
import { colors } from '../../theme';
import { useAsync } from '../../useAsync';

// Reuses today's fixture list (already cached) so this tab costs no extra API calls.
export default function Leagues() {
  const fav = useFavorites();
  const { data, error, reload } = useAsync(() => getFixturesByDate(isoDate(new Date())), []);

  const byCountry = useMemo(() => {
    const leagues = new Map<number, NonNullable<typeof data>[number]['league']>();
    data?.forEach((f) => leagues.set(f.league.id, f.league));
    const groups = new Map<string, (typeof leagues extends Map<number, infer L> ? L : never)[]>();
    for (const l of leagues.values()) {
      const c = countryName(l.country);
      groups.set(c, [...(groups.get(c) ?? []), l]);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], 'sv'));
  }, [data]);

  return (
    <View style={styles.screen}>
      <Header />
      <DemoBanner />
      <ScrollView>
        <SectionHeader title="LIGOR MED MATCHER IDAG" />
        {error && !data ? (
          <ErrorView message={error} onRetry={reload} />
        ) : !data ? (
          <Loading />
        ) : (
          byCountry.map(([country, leagues]) => (
            <View key={country}>
              <View style={styles.country}>
                <Text style={{ fontSize: 20, width: 34 }}>{countryFlag(leagues[0].country)}</Text>
                <Text style={styles.countryText}>{country}</Text>
              </View>
              {leagues.map((l) => {
                const starred = !!fav.leagues[l.id];
                return (
                  <Pressable key={l.id} style={styles.row} onPress={() => fav.toggleLeague(l)}>
                    <Text style={styles.name}>{l.name}</Text>
                    <Ionicons name={starred ? 'star' : 'star-outline'} size={20} color={starred ? colors.accent : '#C4C9D1'} />
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  country: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  countryText: { fontSize: 13, fontWeight: '800', color: colors.muted, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingLeft: 50, paddingRight: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  name: { flex: 1, fontSize: 15, color: colors.text },
});
