import { apiGet } from './client';
import {
  Fixture,
  FixtureStatistic,
  OddsResponse,
  StandingsResponse,
  isFinished,
  isLive,
} from './types';

export const TIMEZONE = 'Europe/Stockholm';

export function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getFixturesByDate(date: string) {
  const today = isoDate(new Date());
  const ttl = date === today ? 60 : date < today ? 6 * 3600 : 30 * 60;
  return apiGet<Fixture[]>('/fixtures', { date, timezone: TIMEZONE }, ttl);
}

export function getLiveFixtures() {
  return apiGet<Fixture[]>('/fixtures', { live: 'all', timezone: TIMEZONE }, 30);
}

export async function getFixture(id: number) {
  const list = await apiGet<Fixture[]>('/fixtures', { id, timezone: TIMEZONE }, 30);
  const f = list[0];
  if (!f) throw new Error('Matchen hittades inte');
  return f;
}

export async function getOdds(fixtureId: number) {
  const list = await apiGet<OddsResponse[]>('/odds', { fixture: fixtureId }, 30 * 60);
  return list[0] ?? null;
}

export async function getStandings(league: number, season: number) {
  const list = await apiGet<StandingsResponse[]>('/standings', { league, season }, 3 * 3600);
  return list[0]?.league.standings ?? [];
}

export function getHeadToHead(home: number, away: number) {
  return apiGet<Fixture[]>(
    '/fixtures/headtohead',
    { h2h: `${home}-${away}`, last: 10, timezone: TIMEZONE },
    12 * 3600,
  );
}

export function getTeamSeasonFixtures(team: number, league: number, season: number) {
  return apiGet<Fixture[]>(
    '/fixtures',
    { team, league, season, timezone: TIMEZONE },
    3 * 3600,
  );
}

export function getFixtureStatistics(fixtureId: number) {
  return apiGet<FixtureStatistic[]>('/fixtures/statistics', { fixture: fixtureId }, 7 * 86400);
}

// ---------- Team form & statistics (the MatteScore twist) ----------

export type Result = 'W' | 'D' | 'L';
export type Split = 'overall' | 'home' | 'away';

export interface PlayedMatch {
  fixture: Fixture;
  isHome: boolean;
  scored: number;
  conceded: number;
  result: Result;
}

export interface SplitStats {
  played: number;
  ppg: number;
  winPct: number;
  avgGoals: number;
  scored: number;
  conceded: number;
  bttsPct: number;
  csPct: number;
  ftsPct: number;
  over25Pct: number;
  form: PlayedMatch[]; // last 5, oldest first
  bttsLast5: number;
  winsLast5: number;
}

export interface TeamStats {
  teamId: number;
  matches: PlayedMatch[]; // all finished, newest first
  overall: SplitStats;
  home: SplitStats;
  away: SplitStats;
}

export function toPlayed(f: Fixture, teamId: number): PlayedMatch | null {
  if (!isFinished(f) || f.goals.home === null || f.goals.away === null) return null;
  const isHome = f.teams.home.id === teamId;
  const scored = isHome ? f.goals.home : f.goals.away;
  const conceded = isHome ? f.goals.away : f.goals.home;
  const result: Result = scored > conceded ? 'W' : scored === conceded ? 'D' : 'L';
  return { fixture: f, isHome, scored, conceded, result };
}

const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));
const avg = (n: number, d: number) => (d === 0 ? 0 : n / d);

function splitStats(list: PlayedMatch[]): SplitStats {
  const n = list.length;
  const wins = list.filter((m) => m.result === 'W').length;
  const draws = list.filter((m) => m.result === 'D').length;
  const scored = list.reduce((s, m) => s + m.scored, 0);
  const conceded = list.reduce((s, m) => s + m.conceded, 0);
  const btts = list.filter((m) => m.scored > 0 && m.conceded > 0).length;
  const cs = list.filter((m) => m.conceded === 0).length;
  const fts = list.filter((m) => m.scored === 0).length;
  const over25 = list.filter((m) => m.scored + m.conceded > 2.5).length;
  const last5 = list.slice(0, 5);
  return {
    played: n,
    ppg: avg(wins * 3 + draws, n),
    winPct: pct(wins, n),
    avgGoals: avg(scored + conceded, n),
    scored: avg(scored, n),
    conceded: avg(conceded, n),
    bttsPct: pct(btts, n),
    csPct: pct(cs, n),
    ftsPct: pct(fts, n),
    over25Pct: pct(over25, n),
    form: [...last5].reverse(),
    bttsLast5: last5.filter((m) => m.scored > 0 && m.conceded > 0).length,
    winsLast5: last5.filter((m) => m.result === 'W').length,
  };
}

export function buildTeamStats(fixtures: Fixture[], teamId: number): TeamStats {
  const matches = fixtures
    .map((f) => toPlayed(f, teamId))
    .filter((m): m is PlayedMatch => m !== null)
    .sort((a, b) => b.fixture.fixture.timestamp - a.fixture.fixture.timestamp);
  return {
    teamId,
    matches,
    overall: splitStats(matches),
    home: splitStats(matches.filter((m) => m.isHome)),
    away: splitStats(matches.filter((m) => !m.isHome)),
  };
}

export async function getTeamStats(team: number, league: number, season: number) {
  const fixtures = await getTeamSeasonFixtures(team, league, season);
  return buildTeamStats(fixtures, team);
}

/** Average xG for / against over a team's last `n` finished matches (costs n requests). */
export async function getTeamXg(stats: TeamStats, n = 5) {
  const recent = stats.matches.slice(0, n);
  let xg = 0;
  let xga = 0;
  let counted = 0;
  for (const m of recent) {
    const rows = await getFixtureStatistics(m.fixture.fixture.id);
    const mine = rows.find((r) => r.team.id === stats.teamId);
    const theirs = rows.find((r) => r.team.id !== stats.teamId);
    const read = (r?: FixtureStatistic) => {
      const v = r?.statistics.find((s) => s.type === 'expected_goals')?.value;
      return v === null || v === undefined ? null : Number(v);
    };
    const a = read(mine);
    const b = read(theirs);
    if (a !== null && b !== null && !Number.isNaN(a) && !Number.isNaN(b)) {
      xg += a;
      xga += b;
      counted++;
    }
  }
  return counted === 0 ? null : { xg: xg / counted, xga: xga / counted, matches: counted };
}

export { isLive, isFinished };
