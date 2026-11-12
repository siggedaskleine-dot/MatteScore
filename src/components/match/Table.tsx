import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getStandings } from '../../api/endpoints';
import { Fixture, StandingRow } from '../../api/types';
import { colors } from '../../theme';
import { useAsync } from '../../useAsync';
import { Chips, Empty, ErrorView, Loading, Logo, ResultBadge } from '../ui';

type View_ = 'all' | 'home' | 'away' | 'form';

function rankColor(desc: string | null) {
  if (!desc) return null;
  const d = desc.toLowerCase();
  if (d.includes('relegation')) return '#B42318';
  if (d.includes('champions') || d.includes('promotion') && !d.includes('play')) return '#1D4ED8';
  if (d.includes('europa') || d.includes('conference') || d.includes('play')) return '#7A1F3D';
  return '#475467';
}

export function Table({ f }: { f: Fixture }) {
  const { data, error, reload } = useAsync(() => getStandings(f.league.id, f.league.season), [f.league.id, f.league.season]);
  const [view, setView] = useState<View_>('all');

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  if (data.length === 0) return <Empty text="Ingen tabell finns för den här turneringen" icon="podium-outline" />;

  const ids = [f.teams.home.id, f.teams.away.id];
  // For group stages, show only the groups containing these teams.
  const groups = data.length > 1 ? data.filter((g) => g.some((r) => ids.includes(r.team.id))) : data;

  return (
    <View>
      <Chips
        options={[
          { key: 'all', label: 'ÖVERSIKT' },
          { key: 'home', label: 'HEMMA' },
          { key: 'away', label: 'BORTA' },
          { key: 'form', label: 'FORM' },
        ]}
        value={view}
        onChange={setView}
      />
      {groups.map((rows, gi) => {
        const sorted =
          view === 'all' || view === 'form'
            ? rows
            : [...rows].sort((a, b) => {
                const pa = a[view].win * 3 + a[view].draw;
                const pb = b[view].win * 3 + b[view].draw;
                return pb - pa || (b[view].goals.for - b[view].goals.against) - (a[view].goals.for - a[view].goals.against);
              });
        return (
          <View key={gi} style={styles.table}>
            {groups.length > 1 && <Text style={styles.group}>{rows[0]?.group}</Text>}
            <View style={[styles.row, styles.head]}>
              <Text style={[styles.h, { width: 34 }]}>#</Text>
              <Text style={[styles.h, { flex: 1 }]}>LAG</Text>
              {view === 'form' ? (
                <Text style={[styles.h, { width: 130, textAlign: 'center' }]}>SENASTE 5</Text>
              ) : (
                <>
                  <Text style={[styles.h, styles.num]}>M</Text>
                  <Text style={[styles.h, styles.goals]}>MÅL</Text>
                  <Text style={[styles.h, styles.num]}>P</Text>
                </>
              )}
            </View>
            {sorted.map((r: StandingRow, i) => {
              const s = view === 'home' ? r.home : view === 'away' ? r.away : r.all;
              const pts = view === 'home' || view === 'away' ? s.win * 3 + s.draw : r.points;
              const rank = view === 'home' || view === 'away' ? i + 1 : r.rank;
              const rc = view === 'all' || view === 'form' ? rankColor(r.description) : null;
              const mine = ids.includes(r.team.id);
              return (
                <View key={r.team.id} style={[styles.row, mine && styles.mine]}>
                  <View style={{ width: 34 }}>
                    <View style={[styles.rank, rc ? { backgroundColor: rc } : null]}>
                      <Text style={[styles.rankText, rc ? { color: '#fff' } : null]}>{rank}.</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Logo uri={r.team.logo} name={r.team.name} size={22} />
                    <Text style={[styles.team, mine && { fontWeight: '800' }]} numberOfLines={1}>{r.team.name}</Text>
                  </View>
                  {view === 'form' ? (
                    <View style={{ width: 130, flexDirection: 'row', justifyContent: 'center' }}>
                      {(r.form ?? '').slice(0, 5).split('').reverse().map((c, k) => (
                        <ResultBadge key={k} r={c as 'W' | 'D' | 'L'} size={20} />
                      ))}
                    </View>
                  ) : (
                    <>
                      <Text style={styles.num}>{s.played}</Text>
                      <Text style={styles.goals}>{s.goals.for}:{s.goals.against}</Text>
                      <Text style={[styles.num, { fontWeight: '800' }]}>{pts}</Text>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { marginHorizontal: 10, marginBottom: 12 },
  group: { fontWeight: '800', color: colors.muted, paddingVertical: 6, paddingHorizontal: 6 },
  head: { backgroundColor: colors.sectionBg, borderRadius: 8 },
  h: { fontWeight: '700', color: '#4B5563', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  mine: { backgroundColor: colors.accentSoft },
  rank: { width: 28, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontWeight: '700', fontSize: 13, color: colors.text },
  team: { fontSize: 15, color: colors.text, flexShrink: 1 },
  num: { width: 34, textAlign: 'center', fontSize: 14, color: colors.text },
  goals: { width: 62, textAlign: 'center', fontSize: 14, color: colors.text },
});
