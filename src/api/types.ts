// Subset of the api-football v3 response shapes that MatteScore uses.

export interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean | null;
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round?: string;
}

export interface Fixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    venue?: { name: string | null; city: string | null };
    referee?: string | null;
    status: { long: string; short: string; elapsed: number | null };
  };
  league: League;
  teams: { home: Team; away: Team };
  goals: { home: number | null; away: number | null };
  score?: { halftime: { home: number | null; away: number | null } };
}

export interface OddValue {
  value: string;
  odd: string;
}

export interface Bet {
  id: number;
  name: string;
  values: OddValue[];
}

export interface Bookmaker {
  id: number;
  name: string;
  bets: Bet[];
}

export interface OddsResponse {
  fixture: { id: number };
  update: string;
  bookmakers: Bookmaker[];
}

export interface StandingSplit {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: { for: number; against: number };
}

export interface StandingRow {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  description: string | null;
  all: StandingSplit;
  home: StandingSplit;
  away: StandingSplit;
}

export interface StandingsResponse {
  league: League & { standings: StandingRow[][] };
}

export interface FixtureStatistic {
  team: { id: number; name: string; logo: string };
  statistics: { type: string; value: number | string | null }[];
}

export const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'];
export const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];

export const isLive = (f: Fixture) => LIVE_STATUSES.includes(f.fixture.status.short);
export const isFinished = (f: Fixture) => FINISHED_STATUSES.includes(f.fixture.status.short);
