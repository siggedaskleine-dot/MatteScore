// Demo data, used only when no API key is configured (e.g. the web preview).
// Everything here is invented and the UI labels it "Demoläge".
import type { Fixture, League, OddsResponse, StandingRow, StandingsResponse } from './types';

const SEASON = 2026;

const LEAGUES: { league: Omit<League, 'season'>; teams: string[] }[] = [
  { league: { id: 113, name: 'Allsvenskan', country: 'Sweden', logo: '', flag: null }, teams: ['Malmö FF', 'Hammarby', 'AIK', 'Djurgården', 'IFK Göteborg', 'Häcken', 'Elfsborg', 'Mjällby', 'Sirius', 'GAIS'] },
  { league: { id: 39, name: 'Premier League', country: 'England', logo: '', flag: null }, teams: ['Arsenal', 'Liverpool', 'Man City', 'Chelsea', 'Tottenham', 'Newcastle', 'Aston Villa', 'Brighton', 'West Ham', 'Everton'] },
  { league: { id: 140, name: 'La Liga', country: 'Spain', logo: '', flag: null }, teams: ['Real Madrid', 'Barcelona', 'Atlético Madrid', 'Sevilla', 'Real Sociedad', 'Villarreal', 'Betis', 'Valencia', 'Girona', 'Athletic Club'] },
  { league: { id: 135, name: 'Serie A', country: 'Italy', logo: '', flag: null }, teams: ['Inter', 'Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio', 'Atalanta', 'Fiorentina', 'Bologna', 'Torino'] },
  { league: { id: 78, name: 'Bundesliga', country: 'Germany', logo: '', flag: null }, teams: ['Bayern', 'Dortmund', 'Leverkusen', 'Leipzig', 'Stuttgart', 'Frankfurt', 'Freiburg', 'Wolfsburg', 'Mainz', 'Union Berlin'] },
  { league: { id: 72, name: 'Serie B', country: 'Brazil', logo: '', flag: null }, teams: ['Novorizontino', 'Juventude', 'Vila Nova', 'Criciúma', 'Fortaleza', 'CRB', 'Goiás', 'Atlético GO', 'Ponte Preta', 'Operário PR'] },
  { league: { id: 5, name: 'UEFA Nations League', country: 'World', logo: '', flag: null }, teams: ['Sverige', 'Norge', 'Danmark', 'Finland', 'Island', 'Polen', 'Skottland', 'Irland', 'Österrike', 'Schweiz'] },
];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function goals(r: () => number, strength: number) {
  const x = r() + strength * 0.25;
  if (x < 0.3) return 0;
  if (x < 0.65) return 1;
  if (x < 0.9) return 2;
  if (x < 1.05) return 3;
  return 4;
}

const teamId = (li: number, ti: number) => LEAGUES[li].league.id * 100 + ti + 1;
const BASE_TS = Date.UTC(2026, 2, 1) / 1000;

function makeFixture(
  li: number,
  hi: number,
  ai: number,
  id: number,
  ts: number,
  status: string,
  elapsed: number | null,
  gh: number | null,
  ga: number | null,
  round: string,
): Fixture {
  const L = LEAGUES[li];
  return {
    fixture: { id, date: new Date(ts * 1000).toISOString(), timestamp: ts, status: { long: status, short: status, elapsed } },
    league: { ...L.league, season: SEASON, round },
    teams: {
      home: { id: teamId(li, hi), name: L.teams[hi], logo: '' },
      away: { id: teamId(li, ai), name: L.teams[ai], logo: '' },
    },
    goals: { home: gh, away: ga },
  };
}

// A finished season of 18 rounds per league (double round robin of 10 teams).
const seasonCache = new Map<number, Fixture[]>();
function season(li: number): Fixture[] {
  const cached = seasonCache.get(li);
  if (cached) return cached;
  const r = rng(li * 977 + 13);
  const n = LEAGUES[li].teams.length;
  const strength = Array.from({ length: n }, (_, i) => (n - i) / n);
  const list: Fixture[] = [];
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let round = 0; round < (n - 1) * 2; round++) {
    const rot = [idx[0], ...idx.slice(1).map((_, k) => idx[1 + ((k + round) % (n - 1))])];
    for (let k = 0; k < n / 2; k++) {
      let h = rot[k];
      let a = rot[n - 1 - k];
      if (round % 2 === 1) [h, a] = [a, h];
      const ts = BASE_TS + round * 7 * 86400 + k * 3600;
      list.push(makeFixture(li, h, a, li * 100000 + round * 100 + k, ts, 'FT', 90, goals(r, strength[h] + 0.2), goals(r, strength[a]), `Regular Season - ${round + 1}`));
    }
  }
  seasonCache.set(li, list);
  return list;
}

function dayFixtures(date: string): Fixture[] {
  const [y, m, d] = date.split('-').map(Number);
  const dayStart = Date.UTC(y, m - 1, d) / 1000;
  const seed = y * 10000 + m * 100 + d;
  const r = rng(seed);
  const now = Date.now() / 1000;
  const out: Fixture[] = [];
  LEAGUES.forEach((L, li) => {
    if (r() < 0.25) return;
    const order = [...L.teams.keys()].sort(() => r() - 0.5);
    const count = 1 + Math.floor(r() * 4);
    for (let k = 0; k < count; k++) {
      const h = order[k * 2];
      const a = order[k * 2 + 1];
      const ts = dayStart + (12 + Math.floor(r() * 9)) * 3600 + (r() < 0.5 ? 0 : 1800) - 3600;
      const id = 9000000 + (seed % 100000) * 100 + li * 10 + k;
      const mins = Math.floor((now - ts) / 60);
      const gh = goals(r, 0.3);
      const ga = goals(r, 0.2);
      let f: Fixture;
      if (mins < 0) f = makeFixture(li, h, a, id, ts, 'NS', null, null, null, 'Regular Season - 19');
      else if (mins > 110) f = makeFixture(li, h, a, id, ts, 'FT', 90, gh, ga, 'Regular Season - 19');
      else {
        const el = Math.min(90, mins > 45 && mins < 60 ? 45 : mins > 60 ? mins - 15 : mins);
        const frac = el / 90;
        f = makeFixture(li, h, a, id, ts, mins > 45 && mins < 60 ? 'HT' : mins < 45 ? '1H' : '2H', el, Math.round(gh * frac), Math.round(ga * frac), 'Regular Season - 19');
      }
      out.push(f);
    }
  });
  return out;
}

function findFixture(id: number): Fixture | undefined {
  if (id >= 9000000) {
    const rest = id - 9000000;
    const dayPart = Math.floor(rest / 100);
    const today = new Date();
    for (let off = -7; off <= 7; off++) {
      const d = new Date(today.getTime() + off * 86400000);
      const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      if (seed % 100000 === dayPart) {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dayFixtures(iso).find((f) => f.fixture.id === id);
      }
    }
    return undefined;
  }
  const li = Math.floor(id / 100000);
  return li < LEAGUES.length ? season(li).find((f) => f.fixture.id === id) : undefined;
}

function standings(li: number): StandingsResponse {
  const L = LEAGUES[li];
  const rows = new Map<number, StandingRow>();
  const empty = () => ({ played: 0, win: 0, draw: 0, lose: 0, goals: { for: 0, against: 0 } });
  L.teams.forEach((name, i) =>
    rows.set(teamId(li, i), { rank: 0, team: { id: teamId(li, i), name, logo: '' }, points: 0, goalsDiff: 0, group: L.league.name, form: '', description: null, all: empty(), home: empty(), away: empty() }),
  );
  for (const f of season(li)) {
    const gh = f.goals.home!;
    const ga = f.goals.away!;
    for (const side of ['home', 'away'] as const) {
      const row = rows.get(f.teams[side].id)!;
      const sc = side === 'home' ? gh : ga;
      const co = side === 'home' ? ga : gh;
      for (const s of [row.all, row[side]]) {
        s.played++;
        s.goals.for += sc;
        s.goals.against += co;
        if (sc > co) s.win++;
        else if (sc === co) s.draw++;
        else s.lose++;
      }
      row.form = ((sc > co ? 'W' : sc === co ? 'D' : 'L') + (row.form ?? '')).slice(0, 5);
    }
  }
  const sorted = [...rows.values()]
    .map((r) => ({ ...r, points: r.all.win * 3 + r.all.draw, goalsDiff: r.all.goals.for - r.all.goals.against }))
    .sort((a, b) => b.points - a.points || b.goalsDiff - a.goalsDiff);
  sorted.forEach((r, i) => {
    r.rank = i + 1;
    r.description = i < 2 ? 'Promotion' : i >= sorted.length - 2 ? 'Relegation' : null;
  });
  return { league: { ...L.league, season: SEASON, standings: [sorted] } };
}

const BOOKIES = ['NordOdds', 'SpelHuset', 'KickBet', 'MålBet', 'Tipsboden', 'LiraSpel'];

function odds(fixtureId: number): OddsResponse {
  const r = rng(fixtureId);
  const base = [1.6 + r() * 3, 3 + r() * 1.2, 1.6 + r() * 3];
  const fmt = (x: number) => x.toFixed(2);
  return {
    fixture: { id: fixtureId },
    update: new Date().toISOString(),
    bookmakers: BOOKIES.map((name, i) => {
      const j = () => 1 + (r() - 0.5) * 0.12;
      return {
        id: i + 1,
        name,
        bets: [
          { id: 1, name: 'Match Winner', values: [{ value: 'Home', odd: fmt(base[0] * j()) }, { value: 'Draw', odd: fmt(base[1] * j()) }, { value: 'Away', odd: fmt(base[2] * j()) }] },
          { id: 5, name: 'Goals Over/Under', values: [1.5, 2.5, 3.5].flatMap((l) => [{ value: `Over ${l}`, odd: fmt((1.2 + (l - 1.5) * 0.7) * j()) }, { value: `Under ${l}`, odd: fmt((3.2 - (l - 1.5) * 0.9) * j()) }]) },
          { id: 8, name: 'Both Teams Score', values: [{ value: 'Yes', odd: fmt(1.75 * j()) }, { value: 'No', odd: fmt(1.98 * j()) }] },
          { id: 4, name: 'Asian Handicap', values: [{ value: 'Home -0.5', odd: fmt(base[0] * 0.95 * j()) }, { value: 'Away -0.5', odd: fmt(base[2] * 0.95 * j()) }, { value: 'Home +0.5', odd: fmt(1.35 * j()) }, { value: 'Away +0.5', odd: fmt(1.35 * j()) }] },
        ],
      };
    }),
  };
}

const leagueIndex = (id: number) => LEAGUES.findIndex((L) => L.league.id === id);

export function demoRequest(path: string, p: Record<string, string | number>): unknown {
  if (path === '/fixtures') {
    if (p.date) return dayFixtures(String(p.date));
    if (p.live) {
      const d = new Date();
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return dayFixtures(iso).filter((f) => ['1H', 'HT', '2H'].includes(f.fixture.status.short));
    }
    if (p.id) {
      const f = findFixture(Number(p.id));
      return f ? [f] : [];
    }
    if (p.team) {
      const li = leagueIndex(Number(p.league));
      return li < 0 ? [] : season(li).filter((f) => f.teams.home.id === Number(p.team) || f.teams.away.id === Number(p.team));
    }
  }
  if (path === '/fixtures/headtohead') {
    const [a, b] = String(p.h2h).split('-').map(Number);
    const li = LEAGUES.findIndex((_, i) => Math.floor(a / 100) === LEAGUES[i].league.id);
    if (li < 0) return [];
    return season(li)
      .filter((f) => [a, b].includes(f.teams.home.id) && [a, b].includes(f.teams.away.id))
      .reverse();
  }
  if (path === '/odds') return [odds(Number(p.fixture))];
  if (path === '/standings') {
    const li = leagueIndex(Number(p.league));
    return li < 0 ? [] : [standings(li)];
  }
  if (path === '/fixtures/statistics') {
    const f = findFixture(Number(p.fixture));
    if (!f) return [];
    const r = rng(Number(p.fixture) + 7);
    return (['home', 'away'] as const).map((s) => ({
      team: f.teams[s],
      statistics: [{ type: 'expected_goals', value: ((f.goals[s] ?? 1) * 0.7 + r() * 0.9).toFixed(2) }],
    }));
  }
  return [];
}
