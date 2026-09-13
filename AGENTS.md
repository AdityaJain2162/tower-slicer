# Tower Slicer

A "Stack"-mechanic game built with Expo (managed workflow), TypeScript,
React Native Reanimated, and react-native-gesture-handler.

## Requirements

- **Node 20.x** (LTS). Node 22.18+ and 24 enable native TypeScript
  type-stripping by default, which breaks the Expo CLI (it loads `.ts`
  source from `node_modules`). Use Node 20 to run the Expo CLI / web
  export. With nvm-windows: `nvm install 20 && nvm use 20`.
- npm installs use `legacy-peer-deps=true` (see `.npmrc`) to resolve the
  SDK 57 peer-dependency graph.
- **Expo SDK 57** — compatible with Expo Go SDK 57 on devices.

## Commands

- `npm start` — start Expo dev server (Expo Go / simulator).
- `npm run typecheck` — `tsc --noEmit` (strict).
- `npm run lint` — `expo lint`.
- Web production build: `npx expo export --platform web --output-dir dist-web`.
- Runtime math/logic tests (no test runner; plain Node via tsx):
  - `npx tsx --tsconfig tsconfig.json src/utils/slicing.test.ts`
  - `npx tsx --tsconfig tsconfig.json src/utils/color.test.ts`
  - `npx tsx --tsconfig tsconfig.json src/hooks/useGameEngine.test.ts`
  - `npx tsx --tsconfig tsconfig.json src/config/ads.test.ts`

## Architecture

- `src/types` — framework-agnostic domain types.
- `src/constants` — `game.ts` (RN-free numeric constants) + `index.ts`
  (screen dimensions). Math/logic imports only from `game.ts` so it stays
  unit-testable in plain Node.
- `src/utils` — pure logic: `slicing.ts` (overlap + slice math),
  `color.ts` (HSL gradient), `engine.ts` (speed scaling + direction).
- `src/services/haptics.ts` — expo-haptics wrapper (all try/catch guarded).
- `src/services/ads.ts` / `ads.native.ts` — platform-split AdMob service
  (web stub vs native require) so Metro never bundles the native-only ads
  module on web.
- `src/config/ads.ts` — AdMob ad unit IDs (test IDs by default; swap in
  real IDs when you have an AdMob account — instructions in the file).
- `src/hooks` — `useHighScore` (AsyncStorage), `useGameEngine` (state
  machine + Reanimated SharedValues + combo expansion + revive),
  `useAudio` (expo-av SFX + persistent mute), `useRewardedAd` (AdMob
  rewarded video + mock fallback), `useFonts` (Press Start 2P + Inter).
- `src/components` — `Block`, `SlicedPiece`, `ActiveBlock`, `Tower`,
  `HUD`, `StartScreen`, `GameOverModal`, `FloatingComboText`, `Background`
  (gradient + grid), `BannerAd` (placeholder/real), `Game` (root).
- `src/assets/sounds` — four generated WAV SFX (regenerate via
  `node scripts/gen-sounds.js`).

## Dev client vs Expo Go

`expo-av` works in Expo Go. `react-native-google-mobile-ads` requires a
**dev client** (custom native code) — it is not available in Expo Go.
`useRewardedAd` detects this and falls back to mock mode (the revive button
still works and fires the reward instantly) so the game runs in Expo Go.
For real rewarded ads, build a dev client:
`npx expo run:android` (needs Android SDK) or
`eas build --profile development --platform android`.

All motion is driven by Reanimated SharedValues + animated styles on the
UI thread. No `setInterval` or JS-thread `requestAnimationFrame` is used
for block movement.

## CI/CD (GitHub Actions)

Two workflows live in `.github/workflows/`:

### ci.yml — runs on every push/PR to main
- Typecheck (`tsc --noEmit`)
- Runtime tests (slicing, color, engine, ad config validation)
- Web build verification (`expo export --platform web`)
- Uploads the web build as an artifact

### dev-build.yml — runs on push to main + manual trigger
- Builds a **debug APK** directly in the GitHub Actions runner using
  `expo prebuild` + Gradle — no EAS, no Expo account, no paid cloud builds
- Uses Google's official test ad unit IDs (`USE_TEST_ADS=true`)
- The APK includes the native `react-native-google-mobile-ads` module so
  real test ads render (unlike Expo Go where ads fall back to mock mode)
- The APK is uploaded as a workflow artifact (30-day retention)
- **No GitHub Secrets required** — builds entirely locally in the runner

### EAS build profiles (eas.json) — optional, for cloud builds
- `development` — dev client APK with test ads (for ad verification)
- `preview` — APK for internal testing
- `production` — AAB for Play Store submission
