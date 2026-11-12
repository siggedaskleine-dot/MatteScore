import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Fixture, isFinished, isLive } from '../api/types';
import { countryFlag, countryName } from '../countries';
import { useFavorites } from '../state/favorites';
import { colors } from '../theme';
import { Logo, SectionHeader } from './ui';

export function statusText(f: Fixture) {
  const s = f.fixture.status;
  if (s.short === 'HT') return 'Halvlek';
  if (isLive(f)) return `${s.elapsed ?? ''}'`;
  if (isFinished(f)) return s.short === 'FT' ? 'Slut' : s.short === 'PEN' ? 'Straffar' : 'Förl.';
  if (s.short === 'PST') return 'Uppskj.';
  if (s.short === 'CANC') return 'Inställd';
  const d = new Date(f.fixture.date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function MatchRow({ f }: { f: Fixture }) {
  const fav = useFavorites();
  const live = isLive(f);
  const starred = !!fav.matches[f.fixture.id];
  const started = f.goals.home !== null;
  const bold = (side: 'home' | 'away') =>
    isFinished(f) && f.teams[side].winner ? { fontWeight: '800' as const } : null;
  return (
    <Pressable style={styles.match} onPress={() => router.push(`/match/${f.fixture.id}`)}>
      <Pressable onPress={() => fav.toggleMatch(f)} hitSlop={8} style={{ marginRight: 10 }}>
        <Ionicons name={starred ? 'star' : 'star-outline'} size={18} color={starred ? colors.accent : '#B0B6C0'} />
      </Pressable>
      <Text style={[styles.time, live && { color: colors.live, fontWeight: '800' }]}>{statusText(f)}</Text>
      <View style={{ flex: 1 }}>
        <View style={styles.teamLine}>
          <Logo uri={f.teams.home.logo} name={f.teams.home.name} size={18} />
          <Text style={[styles.team, bold('home')]} numberOfLines={1}>{f.teams.home.name}</Text>
        </View>
        <View style={styles.teamLine}>
          <Logo uri={f.teams.away.logo} name={f.teams.away.name} size={18} />
          <Text style={[styles.team, bold('away')]} numberOfLines={1}>{f.teams.away.name}</Text>
        </View>
      </View>
      {started && (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.score, live && { color: colors.live }]}>{f.goals.home}</Text>
          <Text style={[styles.score, live && { color: colors.live }]}>{f.goals.away}</Text>
        </View>
      )}
    </Pressable>
  );
}

interface Group {
  key: number;
  league: Fixture['league'];
  fixtures: Fixture[];
  live: number;
}

function LeagueBlock({ g, initiallyOpen }: { g: Group; initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const fav = useFavorites();
  const starred = !!fav.leagues[g.league.id];
  return (
    <View>
      <Pressable style={styles.league} onPress={() => setOpen((o) => !o)}>
        <Text style={styles.flag}>{countryFlag(g.league.country)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.country}>{countryName(g.league.country).toUpperCase()}</Text>
          <Text style={styles.leagueName} numberOfLines={1}>{g.league.name}</Text>
        </View>
        <Pressable onPress={() => fav.toggleLeague(g.league)} hitSlop={10} style={{ marginHorizontal: 10 }}>
          <Ionicons name={starred ? 'star' : 'star-outline'} size={20} color={starred ? colors.accent : '#C4C9D1'} />
        </Pressable>
        {g.live > 0 && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>{g.live}</Text>
          </View>
        )}
        <Text style={styles.count}>{g.fixtures.length}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" style={{ marginLeft: 6 }} />
      </Pressable>
      {open && g.fixtures.map((f) => <MatchRow key={f.fixture.id} f={f} />)}
    </View>
  );
}

export function groupByLeague(fixtures: Fixture[]): Group[] {
  const map = new Map<number, Group>();
  for (const f of fixtures) {
    let g = map.get(f.league.id);
    if (!g) {
      g = { key: f.league.id, league: f.league, fixtures: [], live: 0 };
      map.set(f.league.id, g);
    }
    g.fixtures.push(f);
    if (isLive(f)) g.live++;
  }
  for (const g of map.values()) g.fixtures.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
  return [...map.values()];
}

const sortAZ = (a: Group, b: Group) =>
  countryName(a.league.country).localeCompare(countryName(b.league.country), 'sv') ||
  a.league.name.localeCompare(b.league.name, 'sv');

export function LeagueSections({ fixtures, expandAll }: { fixtures: Fixture[]; expandAll?: boolean }) {
  const fav = useFavorites();
  const groups = useMemo(() => groupByLeague(fixtures), [fixtures]);
  const favGroups = groups.filter((g) => fav.leagues[g.league.id]).sort(sortAZ);
  const others = groups.filter((g) => !fav.leagues[g.league.id]).sort(sortAZ);
  return (
    <View>
      {favGroups.length > 0 && <SectionHeader title="FAVORITLIGOR" fav />}
      {favGroups.map((g) => (
        <LeagueBlock key={g.key} g={g} initiallyOpen />
      ))}
      {others.length > 0 && <SectionHeader title="ANDRA LIGOR [A–Ö]" />}
      {others.map((g) => (
        <LeagueBlock key={g.key} g={g} initiallyOpen={!!expandAll || g.live > 0} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  league: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  flag: { fontSize: 26, width: 44 },
  country: { fontSize: 11, color: colors.muted, letterSpacing: 1, fontWeight: '600' },
  leagueName: { fontSize: 16, color: colors.text, fontWeight: '600', marginTop: 1 },
  liveBadge: { backgroundColor: colors.live, borderRadius: 6, minWidth: 24, paddingHorizontal: 6, paddingVertical: 2, marginRight: 10, alignItems: 'center' },
  liveBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  count: { fontSize: 15, color: colors.text, minWidth: 22, textAlign: 'right' },
  match: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFBFC', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  time: { width: 52, fontSize: 13, color: colors.muted },
  teamLine: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  team: { fontSize: 15, color: colors.text, flexShrink: 1 },
  score: { fontSize: 15, fontWeight: '800', color: colors.text, paddingVertical: 2 },
});
