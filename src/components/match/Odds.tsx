import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getOdds } from '../../api/endpoints';
import { Bookmaker, Fixture } from '../../api/types';
import { colors } from '../../theme';
import { useAsync } from '../../useAsync';
import { Chips, Empty, ErrorView, Loading } from '../ui';

type Market = '1x2' | 'ou' | 'btts' | 'ah';

interface Column {
  label: string;
  bet: string;
  value: string;
}

function columnsFor(market: Market, line: string, ahLine: string): Column[] {
  switch (market) {
    case '1x2':
      return [
        { label: '1', bet: 'Match Winner', value: 'Home' },
        { label: 'X', bet: 'Match Winner', value: 'Draw' },
        { label: '2', bet: 'Match Winner', value: 'Away' },
      ];
    case 'ou':
      return [
        { label: `Över ${line}`, bet: 'Goals Over/Under', value: `Over ${line}` },
        { label: `Under ${line}`, bet: 'Goals Over/Under', value: `Under ${line}` },
      ];
    case 'btts':
      return [
        { label: 'Ja', bet: 'Both Teams Score', value: 'Yes' },
        { label: 'Nej', bet: 'Both Teams Score', value: 'No' },
      ];
    case 'ah':
      return [
        { label: `1 (${ahLine})`, bet: 'Asian Handicap', value: `Home ${ahLine}` },
        { label: `2 (${flip(ahLine)})`, bet: 'Asian Handicap', value: `Away ${flip(ahLine)}` },
      ];
  }
}

const flip = (l: string) => (l.startsWith('-') ? '+' + l.slice(1) : l.startsWith('+') ? '-' + l.slice(1) : l === '0' ? '0' : '-' + l);

const odd = (b: Bookmaker, c: Column) =>
  b.bets.find((x) => x.name === c.bet)?.values.find((v) => v.value === c.value)?.odd;

export function Odds({ f }: { f: Fixture }) {
  const { data, error, reload } = useAsync(() => getOdds(f.fixture.id), [f.fixture.id]);
  const [market, setMarket] = useState<Market>('1x2');
  const [prev, setPrev] = useState<Record<string, string>>({});
  const storeKey = `ms-odds-prev:${f.fixture.id}`;

  const lines = useMemo(() => {
    const set = new Set<string>();
    data?.bookmakers.forEach((b) =>
      b.bets.find((x) => x.name === 'Goals Over/Under')?.values.forEach((v) => set.add(v.value.split(' ')[1])),
    );
    return [...set].sort((a, b) => Number(a) - Number(b));
  }, [data]);
  const ahLines = useMemo(() => {
    const set = new Set<string>();
    data?.bookmakers.forEach((b) =>
      b.bets.find((x) => x.name === 'Asian Handicap')?.values.forEach((v) => {
        if (v.value.startsWith('Home')) set.add(v.value.split(' ')[1]);
      }),
    );
    return [...set].sort((a, b) => Number(a) - Number(b));
  }, [data]);
  const [line, setLine] = useState('2.5');
  const [ahLine, setAhLine] = useState('-0.5');

  // Remember the odds from the last visit so we can show which way they moved.
  useEffect(() => {
    if (!data) return;
    AsyncStorage.getItem(storeKey)
      .then((raw) => setPrev(raw ? JSON.parse(raw) : {}))
      .catch(() => {});
    const snapshot: Record<string, string> = {};
    data.bookmakers.forEach((b) => b.bets.forEach((bet) => bet.values.forEach((v) => (snapshot[`${b.id}|${bet.name}|${v.value}`] = v.odd))));
    const t = setTimeout(() => AsyncStorage.setItem(storeKey, JSON.stringify(snapshot)).catch(() => {}), 1500);
    return () => clearTimeout(t);
  }, [data, storeKey]);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (data === null && !error) return <Loading />;
  if (!data || data.bookmakers.length === 0) return <Empty text="Inga odds finns för den här matchen än" icon="cash-outline" />;

  const cols = columnsFor(market, lines.includes(line) ? line : lines[0] ?? '2.5', ahLines.includes(ahLine) ? ahLine : ahLines[0] ?? '-0.5');
  const books = data.bookmakers.filter((b) => cols.some((c) => odd(b, c)));
  const best = cols.map((c) => Math.max(...books.map((b) => Number(odd(b, c) ?? 0))));

  return (
    <View>
      <Chips
        options={[
          { key: '1x2', label: '1X2' },
          { key: 'ou', label: 'ÖVER/UNDER' },
          { key: 'btts', label: 'BÅDA LAGEN GÖR MÅL' },
          { key: 'ah', label: 'ASIATISKT HANDIKAPP' },
        ]}
        value={market}
        onChange={setMarket}
      />
      {market === 'ou' && lines.length > 1 && (
        <Chips options={lines.map((l) => ({ key: l, label: l }))} value={lines.includes(line) ? line : lines[0]} onChange={setLine} />
      )}
      {market === 'ah' && ahLines.length > 1 && (
        <Chips options={ahLines.map((l) => ({ key: l, label: l }))} value={ahLines.includes(ahLine) ? ahLine : ahLines[0]} onChange={setAhLine} />
      )}
      <View style={styles.headRow}>
        <View style={{ width: 104 }} />
        {cols.map((c) => (
          <Text key={c.label} style={styles.headText}>{c.label}</Text>
        ))}
      </View>
      {books.length === 0 && <Empty text="Ingen spelbolag har odds för den här marknaden" icon="cash-outline" />}
      {books.map((b) => (
        <View key={b.id} style={styles.row}>
          <View style={styles.book}>
            <Text style={styles.bookText} numberOfLines={1}>{b.name}</Text>
          </View>
          {cols.map((c, i) => {
            const o = odd(b, c);
            const p = prev[`${b.id}|${c.bet}|${c.value}`];
            const dir = o && p ? Math.sign(Number(o) - Number(p)) : 0;
            const isBest = o !== undefined && Number(o) === best[i];
            return (
              <View key={c.label} style={[styles.cell, isBest && styles.best]}>
                {dir !== 0 && (
                  <Ionicons name={dir > 0 ? 'arrow-up' : 'arrow-down'} size={14} color={dir > 0 ? colors.oddsUp : colors.oddsDown} />
                )}
                <Text style={[styles.oddText, isBest && { fontWeight: '800' }]}>{o ?? '–'}</Text>
              </View>
            );
          })}
        </View>
      ))}
      <Text style={styles.note}>
        Bästa oddset per kolumn är markerat. Pilarna visar ändring sedan du senast tittade. Spela ansvarsfullt, 18+.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', backgroundColor: colors.sectionBg, paddingVertical: 8, paddingHorizontal: 12 },
  headText: { flex: 1, textAlign: 'center', fontWeight: '700', color: '#4B5563' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  book: { width: 98, backgroundColor: colors.header, borderRadius: 8, paddingVertical: 11, paddingHorizontal: 6, alignItems: 'center' },
  bookText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  cell: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: '#D9DDE3', borderRadius: 8, paddingVertical: 10, backgroundColor: '#fff' },
  best: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  oddText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  note: { color: colors.muted, fontSize: 12, padding: 14, textAlign: 'center' },
});
