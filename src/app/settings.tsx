import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { checkApiKey, getApiKey, isDemo, saveApiKey } from '../api/client';
import { Header } from '../components/Header';
import { colors } from '../theme';

export default function Settings() {
  const [key, setKey] = useState(getApiKey());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (key.trim()) {
        const s = await checkApiKey(key);
        await saveApiKey(key);
        setMsg({ ok: true, text: `Nyckeln fungerar. Plan: ${s.plan ?? 'okänd'}${s.limit ? `, ${s.used ?? 0} av ${s.limit} anrop använda idag` : ''}.` });
      } else {
        await saveApiKey('');
        setMsg({ ok: true, text: 'Nyckeln är borttagen.' });
      }
    } catch (e) {
      setMsg({ ok: false, text: `Nyckeln fungerade inte: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={styles.title}>Inställningar</Text>
        <View style={styles.card}>
          <Text style={styles.label}>API-nyckel för api-football</Text>
          <Text style={styles.help}>
            MatteScore hämtar matcher, odds, tabeller och statistik från api-football. Klistra in din nyckel från dashboard.api-football.com. Den sparas bara i din telefon.
          </Text>
          <TextInput
            value={key}
            onChangeText={setKey}
            placeholder="Klistra in nyckeln här"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            placeholderTextColor="#9CA3AF"
          />
          <Pressable onPress={save} style={styles.btn} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Spara och testa</Text>}
          </Pressable>
          {msg && <Text style={{ color: msg.ok ? colors.oddsUp : colors.live, marginTop: 4 }}>{msg.text}</Text>}
          <Text style={styles.help}>Läge just nu: {isDemo() ? 'demo (påhittad data)' : 'riktig data'}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Om gratisplanen</Text>
          <Text style={styles.help}>
            Gratisplanen ger 100 anrop per dygn. Appen sparar svar i telefonen så att samma sak inte hämtas två gånger i onödan. Antal anrop kvar visas uppe i hörnet.
          </Text>
          <Pressable onPress={() => Linking.openURL('https://dashboard.api-football.com')}>
            <Text style={{ color: colors.accent, fontWeight: '700' }}>Öppna api-football dashboard</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, gap: 10 },
  label: { fontSize: 16, fontWeight: '700', color: colors.text },
  help: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text },
  btn: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
