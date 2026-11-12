import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { getFixture } from '../../api/endpoints';
import { Fixture, isFinished, isLive } from '../../api/types';
import { Header } from '../../components/Header';
import { Analysis } from '../../components/match/Analysis';
import { H2H } from '../../components/match/H2H';
import { Odds } from '../../components/match/Odds';
import { Table } from '../../components/match/Table';
import { statusText } from '../../components/MatchList';
import { DemoBanner, ErrorView, Loading, Logo } from '../../components/ui';
import { countryFlag, countryName } from '../../countries';
import { useFavorites } from '../../state/favorites';
import { colors } from '../../theme';
import { useAsync } from '../../useAsync';

type Tab = 'analys' | 'odds' | 'tabell' | 'h2h';
const TABS: { key: Tab; label: string }[] = [
  { key: 'analys', label: 'ANALYS' },
  { key: 'odds', label: 'ODDS' },
  { key: 'tabell', label: 'TABELL' },
  { key: 'h2h', label: 'H2H' },
];

function roundName(r?: string) {
  if (!r) return '';
  const m = r.match(/Regular Season - (\d+)/);
  return m ? `OMGÅNG ${m[1]}` : r.toUpperCase();
}

function Hero({ f }: { f: Fixture }) {
  const fav = useFavorites();
  const d = new Date(f.fixture.date);
  const when = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const live = isLive(f);
  const started = f.goals.home !== null;
  const side = (s: 'home' | 'away') => {
    const t = f.teams[s];
    const starred = !!fav.teams[t.id];
    return (
      <View style={styles.side}>
        <View style={styles.logoBox}>
          <Logo uri={t.logo} name={t.name} size={64} />
        </View>
        <Text style={styles.teamName} numberOfLines={2}>{t.name}</Text>
        <Pressable onPress={() => fav.toggleTeam(t)} hitSlop={10}>
          <Ionicons name={starred ? 'star' : 'star-outline'} size={20} color={starred ? colors.accent : '#A0A7B4'} />
        </Pressable>
      </View>
    );
  };
  return (
    <View style={styles.hero}>
      {side('home')}
      <View style={{ alignItems: 'center', flex: 1 }}>
        <Text style={styles.when}>{when}</Text>
        <Text style={[styles.score, live && { color: colors.live }]}>
          {started ? `${f.goals.home} - ${f.goals.away}` : '-'}
        </Text>
        {(live || isFinished(f)) && (
          <Text style={[styles.status, live && { color: colors.live }]}>{statusText(f)}</Text>
        )}
      </View>
      {side('away')}
    </View>
  );
}

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fav = useFavorites();
  const [tab, setTab] = useState<Tab>('analys');
  const { data: f, error, loading, reload } = useAsync(() => getFixture(Number(id)), [id], 60000);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const starred = f ? !!fav.matches[f.fixture.id] : false;

  return (
    <View style={styles.screen}>
      <Header
        onBack={back}
        right={
          f && (
            <View style={{ flexDirection: 'row', gap: 18, marginLeft: 16 }}>
              <Pressable
                hitSlop={10}
                onPress={() =>
                  Share.share({
                    message: `${f.teams.home.name} - ${f.teams.away.name} ${f.goals.home !== null ? `${f.goals.home}-${f.goals.away}` : statusText(f)} (${f.league.name}) · via MatteScore`,
                  })
                }
              >
                <Ionicons name="share-social-outline" size={24} color="#fff" />
              </Pressable>
              <Pressable hitSlop={10} onPress={() => fav.toggleMatch(f)}>
                <Ionicons name={starred ? 'star' : 'star-outline'} size={24} color={starred ? colors.accent : '#fff'} />
              </Pressable>
            </View>
          )
        }
      />
      <DemoBanner />
      {error && !f ? (
        <ErrorView message={error} onRetry={reload} />
      ) : !f ? (
        <Loading />
      ) : (
        <ScrollView
          stickyHeaderIndices={[2]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.leagueBar}>
            <Text style={{ fontSize: 18 }}>{countryFlag(f.league.country)}</Text>
            <Text style={styles.leagueText} numberOfLines={1}>
              {countryName(f.league.country).toUpperCase()}: <Text style={{ fontWeight: '800' }}>{f.league.name.toUpperCase()}{f.league.round ? ` - ${roundName(f.league.round)}` : ''}</Text>
            </Text>
          </View>
          <Hero f={f} />
          <View style={styles.tabs}>
            {TABS.map((t) => (
              <Pressable key={t.key} onPress={() => setTab(t.key)} style={styles.tab}>
                <Text style={[styles.tabText, tab === t.key && { color: colors.accent }]}>{t.label}</Text>
                <View style={[styles.tabLine, tab === t.key && { backgroundColor: colors.accent }]} />
              </Pressable>
            ))}
          </View>
          {tab === 'analys' && <Analysis f={f} />}
          {tab === 'odds' && <Odds f={f} />}
          {tab === 'tabell' && <Table f={f} />}
          {tab === 'h2h' && <H2H f={f} />}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  leagueBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ECEEF1', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  leagueText: { flex: 1, fontSize: 13, letterSpacing: 1, color: '#4B5563' },
  hero: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#ECEEF1', paddingVertical: 16, paddingHorizontal: 8 },
  side: { width: 120, alignItems: 'center', gap: 8 },
  logoBox: { backgroundColor: '#fff', borderRadius: 14, padding: 12 },
  teamName: { fontSize: 16, color: colors.text, textAlign: 'center' },
  when: { color: colors.muted, fontSize: 13, marginTop: 4 },
  score: { fontSize: 36, fontWeight: '800', color: colors.header, marginTop: 14 },
  status: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingTop: 14 },
  tabText: { fontWeight: '700', fontSize: 13, letterSpacing: 1, color: '#374151' },
  tabLine: { height: 4, width: '70%', borderRadius: 2, marginTop: 10, backgroundColor: 'transparent' },
});
