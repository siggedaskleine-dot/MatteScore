import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Fixture, League } from '../api/types';

interface FavState {
  leagues: Record<number, Pick<League, 'id' | 'name' | 'country' | 'logo'>>;
  matches: Record<number, Fixture>;
  teams: Record<number, { id: number; name: string; logo: string }>;
}

interface Ctx extends FavState {
  toggleLeague: (l: Pick<League, 'id' | 'name' | 'country' | 'logo'>) => void;
  toggleMatch: (f: Fixture) => void;
  toggleTeam: (t: { id: number; name: string; logo: string }) => void;
}

const KEY = 'ms-favorites-v1';
const FavContext = createContext<Ctx | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FavState>({ leagues: {}, matches: {}, teams: {} });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ leagues: {}, matches: {}, teams: {}, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  const toggleLeague = useCallback<Ctx['toggleLeague']>((l) => {
    setState((s) => {
      const leagues = { ...s.leagues };
      if (leagues[l.id]) delete leagues[l.id];
      else leagues[l.id] = { id: l.id, name: l.name, country: l.country, logo: l.logo };
      return { ...s, leagues };
    });
  }, []);

  const toggleMatch = useCallback<Ctx['toggleMatch']>((f) => {
    setState((s) => {
      const matches = { ...s.matches };
      if (matches[f.fixture.id]) delete matches[f.fixture.id];
      else matches[f.fixture.id] = f;
      return { ...s, matches };
    });
  }, []);

  const toggleTeam = useCallback<Ctx['toggleTeam']>((t) => {
    setState((s) => {
      const teams = { ...s.teams };
      if (teams[t.id]) delete teams[t.id];
      else teams[t.id] = t;
      return { ...s, teams };
    });
  }, []);

  const value = useMemo(
    () => ({ ...state, toggleLeague, toggleMatch, toggleTeam }),
    [state, toggleLeague, toggleMatch, toggleTeam],
  );
  return <FavContext.Provider value={value}>{children}</FavContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavContext);
  if (!ctx) throw new Error('useFavorites outside provider');
  return ctx;
}
