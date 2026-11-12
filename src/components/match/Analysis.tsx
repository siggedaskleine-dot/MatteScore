import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getTeamStats, getTeamXg, PlayedMatch, Split, SplitStats, TeamStats } from '../../api/endpoints';
import { Fixture } from '../../api/types';
import { colors } from '../../theme';
import { useAsync } from '../../useAsync';
import { Chips, ErrorView, Loading, ResultBadge } from '../ui';

const ppgColor = (ppg: number) => (ppg >= 1.6 ? colors.win : ppg >= 1.1 ? colors.draw : colors.loss);
const f2 = (n: number) => n.toFixed(2);

function PpgChip({ value, big }: { value: number; big?: boolean }) {
  return (
    <View style={[styles.ppg, { backgroundColor: ppgColor(value) }, big && styles.ppgBig]}>
      <Text style={[styles.ppgText, big && { fontSize: 30 }]}>{f2(value)}</Text>
    </View>
  );
}

function FormRow({ list, size = 22 }: { list: PlayedMatch[]; size?: number }) {
  if (list.length === 0) return <Text style={{ color: colors.muted }}>–</Text>;
  return (
    <View style={{ flexDirection: 'row' }}>
      {list.map((m) => (
        <ResultBadge key={m.fixture.fixture.id} r={m.result} size={size} />
      ))}
    </View>
  );
}

/** Headline comparison: home team's home PPG vs away team's away PPG. */
function PpgCompare({ f, home, away }: { f: Fixture; home: TeamStats; away: TeamStats }) {
  const h = home.home;
  const a = away.away;
  const better = h.ppg >= a.ppg ? f.teams.home.name : f.teams.away.name;
  const hi = Math.max(h.ppg, a.ppg);
  const lo = Math.min(h.ppg, a.ppg);
  const diff = lo === 0 ? null : Math.round(((hi - lo) / lo) * 100);
  return (
    <View style={styles.card}>
      <View style={styles.compareRow}>
        <View style={styles.compareSide}>
          <PpgChip value={h.ppg} big />
          <Text style={styles.compareLabel}>hemma</Text>
          <FormRow list={h.form} size={20} />
        </View>
        <View style={{ flex: 1.3, alignItems: 'center', paddingHorizontal: 6 }}>
          {h.ppg === a.ppg ? (
            <Text style={styles.headline}>Lika bra i poäng per match</Text>
          ) : (
            <Text style={styles.headline}>
              <Text style={{ fontWeight: '800' }}>{better}</Text> är{' '}
              <Text style={{ color: colors.oddsUp, fontWeight: '800' }}>{diff === null ? 'klart' : `+${diff}%`}</Text>{' '}
              bättre i poäng per match
            </Text>
          )}
        </View>
        <View style={styles.compareSide}>
          <PpgChip value={a.ppg} big />
          <Text style={styles.compareLabel}>borta</Text>
          <FormRow list={a.form} size={20} />
        </View>
      </View>
    </View>
  );
}

const SPLITS: { key: Split; label: string }[] = [
  { key: 'overall', label: 'Alla' },
  { key: 'home', label: 'Hemma' },
  { key: 'away', label: 'Borta' },
];

function RecentMatches({ stats, defaultSplit }: { stats: TeamStats; defaultSplit: Split }) {
  const [split, setSplit] = useState<Split>(defaultSplit);
  const list = stats.matches.filter((m) => (split === 'overall' ? true : split === 'home' ? m.isHome : !m.isHome));
  const [page, setPage] = useState(0);
  const shown = list.slice(page * 5, page * 5 + 5);
  const bg = (m: PlayedMatch) => (m.result === 'W' ? colors.winSoft : m.result === 'D' ? colors.drawSoft : colors.lossSoft);
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.splitRow}>
        {SPLITS.map((s) => (
          <Pressable key={s.key} onPress={() => { setSplit(s.key); setPage(0); }} style={[styles.splitBtn, split === s.key && styles.splitBtnActive]}>
            <Text style={[styles.splitText, split === s.key && { color: colors.header }]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
      {shown.map((m) => {
        const f = m.fixture;
        return (
          <View key={f.fixture.id} style={styles.recentRow}>
            <Text style={[styles.recentTeam, { textAlign: 'right' }, m.isHome && styles.bold]} numberOfLines={1}>{f.teams.home.name}</Text>
            <View style={[styles.recentScore, { backgroundColor: bg(m) }]}>
              <Text style={styles.recentScoreText}>{f.goals.home}-{f.goals.away}</Text>
            </View>
            <Text style={[styles.recentTeam, !m.isHome && styles.bold]} numberOfLines={1}>{f.teams.away.name}</Text>
          </View>
        );
      })}
      {shown.length === 0 && <Text style={{ color: colors.muted, textAlign: 'center', padding: 12 }}>Inga matcher</Text>}
      <View style={styles.pager}>
        <Pressable disabled={(page + 1) * 5 >= list.length} onPress={() => setPage(page + 1)}>
          <Text style={[styles.pagerText, (page + 1) * 5 >= list.length && { opacity: 0.3 }]}>« Äldre</Text>
        </Pressable>
        <Pressable disabled={page === 0} onPress={() => setPage(page - 1)}>
          <Text style={[styles.pagerText, page === 0 && { opacity: 0.3 }]}>Nyare »</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StatsTable({ stats, highlight, xg }: { stats: TeamStats; highlight: Split; xg: XgState }) {
  const cols: [Split, string][] = [['overall', 'Totalt'], ['home', 'Hemma'], ['away', 'Borta']];
  const rows: [string, (s: SplitStats) => string][] = [
    ['Vinst %', (s) => `${s.winPct}%`],
    ['Snitt mål', (s) => f2(s.avgGoals)],
    ['Gjorda', (s) => f2(s.scored)],
    ['Insläppta', (s) => f2(s.conceded)],
    ['BTTS', (s) => `${s.bttsPct}%`],
    ['Hållen nolla', (s) => `${s.csPct}%`],
    ['Mållösa', (s) => `${s.ftsPct}%`],
    ['Över 2.5', (s) => `${s.over25Pct}%`],
  ];
  return (
    <View style={styles.table}>
      <View style={styles.tableRow}>
        <Text style={[styles.th, { flex: 1.3 }]}>Statistik</Text>
        {cols.map(([k, label]) => (
          <Text key={k} style={[styles.th, k === highlight && styles.hl]}>{label}</Text>
        ))}
      </View>
      <View style={styles.tableRow}>
        <Text style={[styles.tdLabel, { flex: 1.3 }]}>Form</Text>
        {cols.map(([k]) => (
          <View key={k} style={[styles.td, k === highlight && styles.hl]}>
            <PpgChip value={stats[k].ppg} />
          </View>
        ))}
      </View>
      {rows.map(([label, fn]) => (
        <View key={label} style={styles.tableRow}>
          <Text style={[styles.tdLabel, { flex: 1.3 }]}>{label}</Text>
          {cols.map(([k]) => (
            <Text key={k} style={[styles.tdText, k === highlight && styles.hl, k === highlight && styles.hlText]}>
              {stats[k].played ? fn(stats[k]) : '–'}
            </Text>
          ))}
        </View>
      ))}
      {(['xG', 'xGA'] as const).map((label) => (
        <View key={label} style={styles.tableRow}>
          <Text style={[styles.tdLabel, { flex: 1.3 }]}>{label}</Text>
          <Text style={[styles.tdText, { flex: 3 }]}>
            {xg.value ? `${f2(label === 'xG' ? xg.value.xg : xg.value.xga)}  (snitt senaste ${xg.value.matches})` : xg.loading ? '…' : xg.done ? 'saknas för ligan' : '–'}
          </Text>
        </View>
      ))}
    </View>
  );
}

interface XgState {
  value: { xg: number; xga: number; matches: number } | null;
  loading: boolean;
  done: boolean;
}

function Insight({ name, stats }: { name: string; stats: TeamStats }) {
  const s = stats.overall;
  if (s.played === 0) return null;
  const bttsTotal = stats.matches.filter((m) => m.scored > 0 && m.conceded > 0).length;
  const up = s.bttsPct >= 50;
  return (
    <View style={styles.insight}>
      <Ionicons name={up ? 'arrow-up' : 'arrow-down'} size={26} color={up ? colors.oddsUp : colors.live} />
      <Text style={styles.insightText}>
        {s.bttsLast5} av de senaste {Math.min(5, s.played)} matcherna för {name} har slutat med att båda lagen gjort mål. De har vunnit{' '}
        {s.winsLast5} av dem. Totalt har BTTS gått in i {bttsTotal}/{s.played} matcher den här säsongen.
      </Text>
    </View>
  );
}

export function Analysis({ f }: { f: Fixture }) {
  const { data, error, reload } = useAsync(
    () =>
      Promise.all([
        getTeamStats(f.teams.home.id, f.league.id, f.league.season),
        getTeamStats(f.teams.away.id, f.league.id, f.league.season),
      ]),
    [f.fixture.id],
  );
  const [team, setTeam] = useState<'home' | 'away'>('home');
  const [xg, setXg] = useState<Record<'home' | 'away', XgState>>({
    home: { value: null, loading: false, done: false },
    away: { value: null, loading: false, done: false },
  });

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const [home, away] = data;
  const stats = team === 'home' ? home : away;
  const name = f.teams[team].name;

  const loadXg = async () => {
    setXg((s) => ({ ...s, [team]: { value: null, loading: true, done: false } }));
    try {
      const v = await getTeamXg(stats);
      setXg((s) => ({ ...s, [team]: { value: v, loading: false, done: true } }));
    } catch {
      setXg((s) => ({ ...s, [team]: { value: null, loading: false, done: true } }));
    }
  };

  return (
    <View>
      <PpgCompare f={f} home={home} away={away} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>SENASTE MATCHER</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <RecentMatches stats={home} defaultSplit="home" />
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <RecentMatches stats={away} defaultSplit="away" />
        </View>
      </View>

      <View style={styles.card}>
        <Chips
          options={[
            { key: 'home', label: f.teams.home.name.toUpperCase() },
            { key: 'away', label: f.teams.away.name.toUpperCase() },
          ]}
          value={team}
          onChange={setTeam}
        />
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.th, { flex: 1 }]}>Form</Text>
            <Text style={[styles.th, { flex: 2 }]}>Resultat</Text>
            <Text style={[styles.th, { flex: 1 }]}>PPG</Text>
          </View>
          {SPLITS.map((s) => (
            <View key={s.key} style={styles.tableRow}>
              <Text style={[styles.tdLabel, { flex: 1 }]}>{s.key === 'overall' ? 'Totalt' : s.label}</Text>
              <View style={[styles.td, { flex: 2 }]}><FormRow list={stats[s.key].form} /></View>
              <View style={[styles.td, { flex: 1 }]}><PpgChip value={stats[s.key].ppg} /></View>
            </View>
          ))}
        </View>
        <StatsTable stats={stats} highlight={team === 'home' ? 'home' : 'away'} xg={xg[team]} />
        {!xg[team].value && !xg[team].loading && !xg[team].done && (
          <Pressable onPress={loadXg} style={styles.xgBtn}>
            <Text style={styles.xgBtnText}>Hämta xG/xGA för {name} (5 API-anrop)</Text>
          </Pressable>
        )}
        <Insight name={name} stats={stats} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, marginHorizontal: 10, marginTop: 10, borderRadius: 12, padding: 12 },
  cardTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, color: colors.muted, marginBottom: 6 },
  compareRow: { flexDirection: 'row', alignItems: 'center' },
  compareSide: { flex: 1, alignItems: 'center', gap: 6 },
  compareLabel: { fontSize: 12, color: colors.muted },
  headline: { fontSize: 17, textAlign: 'center', color: colors.text, lineHeight: 23 },
  ppg: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'center' },
  ppgBig: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  ppgText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  splitRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6 },
  splitBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  splitBtnActive: { backgroundColor: '#E3ECF7' },
  splitText: { color: '#7A8AA8', fontWeight: '700', fontSize: 13 },
  recentRow: { flexDirection: 'row', alignItems: 'center', minHeight: 30 },
  recentTeam: { flex: 1, fontSize: 12, color: '#374151', paddingHorizontal: 4 },
  bold: { fontWeight: '800' },
  recentScore: { width: 40, alignItems: 'center', paddingVertical: 6 },
  recentScoreText: { fontWeight: '800', fontSize: 13 },
  pager: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 },
  pagerText: { color: '#7A8AA8', fontWeight: '700' },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: 1, borderBottomColor: colors.border },
  th: { flex: 1, textAlign: 'center', paddingVertical: 8, fontWeight: '700', color: '#4B5563' },
  td: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  tdLabel: { flex: 1, textAlign: 'center', paddingVertical: 8, color: '#374151', fontWeight: '600' },
  tdText: { flex: 1, textAlign: 'center', paddingVertical: 8, color: colors.text },
  hl: { backgroundColor: colors.highlight },
  hlText: { color: '#1E4E79', fontWeight: '800' },
  xgBtn: { marginTop: 10, borderWidth: 1, borderColor: colors.accent, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  xgBtnText: { color: colors.accent, fontWeight: '700' },
  insight: { flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginTop: 10, alignItems: 'center' },
  insightText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.text },
});
