import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { getLiveFixtures } from '../../api/endpoints';
import { Header } from '../../components/Header';
import { LeagueSections } from '../../components/MatchList';
import { DemoBanner, Empty, ErrorView, Loading, SectionHeader } from '../../components/ui';
import { colors } from '../../theme';
import { useAsync } from '../../useAsync';

export default function Live() {
  const { data, error, loading, reload } = useAsync(getLiveFixtures, [], 45000);
  return (
    <View style={styles.screen}>
      <Header />
      <DemoBanner />
      <ScrollView refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={reload} />}>
        <SectionHeader title={`LIVE JUST NU${data ? ` · ${data.length}` : ''}`} />
        {error && !data ? (
          <ErrorView message={error} onRetry={reload} />
        ) : !data ? (
          <Loading />
        ) : data.length === 0 ? (
          <Empty text="Inga matcher pågår just nu" icon="radio-outline" />
        ) : (
          <LeagueSections fixtures={data} expandAll />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.bg } });
