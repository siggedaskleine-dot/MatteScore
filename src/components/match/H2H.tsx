import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getHeadToHead } from '../../api/endpoints';
import { Fixture, isFinished } from '../../api/types';
import { colors } from '../../theme';
import { useAsync } from '../../useAsync';
import { Empty, ErrorView, Loading } from '../ui';
import { MatchRow } from '../MatchList';

export function H2H({ f }: { f: Fixture }) {
  const h = f.teams.home;
  const a = f.teams.away;
  const { data, error, reload } = useAsync(() => getHeadToHead(h.id, a.id), [h.id, a.id]);
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const done = data
    .filter((x) => isFinished(x) && x.fixture.id !== f.fixture.id)
    .sort((x, y) => y.fixture.timestamp - x.fixture.timestamp)
    .slice(0, 10);
  if (done.length === 0) return <Empty text="Lagen har inte mötts tidigare" icon="git-compare-outline" />;

  let hw = 0, d = 0, aw = 0, goals = 0, btts = 0;
  for (const m of done) {
    const hg = m.teams.home.id === h.id ? m.goals.home! : m.goals.away!;
    const ag = m.teams.home.id === h.id ? m.goals.away! : m.goals.home!;
    if (hg > ag) hw++;
    else if (hg === ag) d++;
    else aw++;
    goals += hg + ag;
    if (hg > 0 && ag > 0) btts++;
  }
  const n = done.length;
  return (
    <View>
      <View style={styles.summary}>
        <Stat label={h.name} value={hw} color={colors.win} />
        <Stat label="Oavgjort" value={d} color={colors.draw} />
        <Stat label={a.name} value={aw} color={colors.loss} />
      </View>
      <View style={styles.bar}>
        <View style={{ flex: hw || 0.0001, backgroundColor: colors.win }} />
        <View style={{ flex: d || 0.0001, backgroundColor: colors.draw }} />
        <View style={{ flex: aw || 0.0001, backgroundColor: colors.loss }} />
      </View>
      <Text style={styles.meta}>
        Senaste {n} mötena · {(goals / n).toFixed(1)} mål per match · BTTS i {Math.round((btts / n) * 100)}%
      </Text>
      {done.map((m) => (
        <MatchRow key={m.fixture.id} f={m} />
      ))}
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16 },
  bar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginHorizontal: 16, marginTop: 12 },
  meta: { color: colors.muted, textAlign: 'center', fontSize: 13, paddingVertical: 10 },
});
