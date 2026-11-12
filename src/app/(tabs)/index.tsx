import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getFixturesByDate, isoDate } from '../../api/endpoints';
import { isLive } from '../../api/types';
import { DateStrip } from '../../components/DateStrip';
import { Header } from '../../components/Header';
import { LeagueSections } from '../../components/MatchList';
import { DemoBanner, Empty, ErrorView, Loading } from '../../components/ui';
import { countryName } from '../../countries';
import { colors } from '../../theme';
import { useAsync } from '../../useAsync';

export default function AllMatches() {
  const [date, setDate] = useState(isoDate(new Date()));
  const [search, setSearch] = useState<string | null>(null);
  const isToday = date === isoDate(new Date());
  const { data, error, loading, reload } = useAsync(() => getFixturesByDate(date), [date], isToday ? 60000 : undefined);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = (search ?? '').trim().toLowerCase();
    if (!q) return data;
    return data.filter((f) =>
      [f.teams.home.name, f.teams.away.name, f.league.name, countryName(f.league.country)]
        .some((s) => s.toLowerCase().includes(q)),
    );
  }, [data, search]);

  const liveCount = data?.filter(isLive).length ?? 0;

  return (
    <View style={styles.screen}>
      <Header onSearch={() => setSearch((s) => (s === null ? '' : null))} />
      <DemoBanner />
      <DateStrip value={date} onChange={setDate} />
      {search !== null && (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            autoFocus
            value={search}
            onChangeText={setSearch}
            placeholder="Sök lag, liga eller land"
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      )}
      <ScrollView refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={reload} />}>
        <View style={styles.allRow}>
          <Ionicons name="list" size={26} color={colors.text} />
          <Text style={styles.allText}>Alla matcher</Text>
          {liveCount > 0 && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>{liveCount}</Text>
            </View>
          )}
          <Text style={styles.total}>{data?.length ?? '–'}</Text>
        </View>
        {error && !data ? (
          <ErrorView message={error} onRetry={reload} />
        ) : !data ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <Empty text={search ? 'Inga träffar' : 'Inga matcher den här dagen'} />
        ) : (
          <LeagueSections fixtures={filtered} expandAll={!!search} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  allRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  allText: { flex: 1, marginLeft: 16, fontSize: 18, fontWeight: '700', color: colors.text },
  liveBadge: { backgroundColor: colors.live, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 3, marginRight: 14 },
  liveBadgeText: { color: '#fff', fontWeight: '800' },
  total: { fontSize: 16, color: colors.text, minWidth: 30, textAlign: 'right' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 15, color: colors.text },
});
