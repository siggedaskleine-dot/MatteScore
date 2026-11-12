# MatteScore

Android-app (Expo / React Native) för fotbollsresultat från hela världen, med en matchvy full av analys:
PPG-jämförelse hemma/borta, form, statistik (vinst %, BTTS, hållna nollor, mållösa, över 2.5, xG/xGA),
odds från flera spelbolag, tabell och inbördes möten. Data hämtas från [api-football](https://www.api-football.com/).

## API-nyckel

Lägg in nyckeln i appen under Inställningar (kugghjulet). Den sparas bara i telefonen.
Vid lokal utveckling kan den i stället ligga i `.env.local` (checkas inte in):

```
EXPO_PUBLIC_API_FOOTBALL_KEY=din-nyckel
```

Utan nyckel visar appen påhittad demodata med en orange "DEMOLÄGE"-rad.

## Köra lokalt

```
npm install
npx expo start
```

## Bygga APK

Varje push till `main` bygger en APK med GitHub Actions och lägger den som en release
(se fliken Releases). Filen heter `MatteScore.apk`.
