import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Header } from '../../components/Header';
import { DemoBanner, Empty } from '../../components/ui';
import { colors } from '../../theme';

export default function News() {
  return (
    <View style={styles.screen}>
      <Header />
      <DemoBanner />
      <Empty text={'Nyheter kommer i en senare version.\napi-football har inga nyheter, så det behövs en egen nyhetskälla.'} icon="newspaper-outline" />
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.bg } });
