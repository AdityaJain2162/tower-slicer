# Tower Slicer

A "Stack"-mechanic game built with Expo (managed workflow), TypeScript,
React Native Reanimated, and react-native-gesture-handler.

## Requirements

- **Node 20.x** (LTS). Node 22.18+ and 24 enable native TypeScript
  type-stripping by default, which breaks Expo SDK 53's CLI (it loads `.ts`
  source from `node_modules` like `expo-haptics`/`expo-modules-core`).
  Use Node 20 to run the Expo CLI / web export. With nvm-windows:
  `nvm install 20 && nvm use 20`.
- npm installs use `legacy-peer-deps=true` (see `.npmrc`) to resolve the
  SDK 53 peer-dependency graph.

## Commands

- `npm start` — start Expo dev server (Expo Go / simulator).
- `npm run typecheck` — `tsc --noEmit` (strict).
- `npm run lint` — `expo lint`.
- Web production build: `npx expo export --platform web --output-dir dist-web`.
- Runtime math/logic tests (no test runner; plain Node via tsx):
  - `npx tsx --tsconfig tsconfig.json src/utils/slicing.test.ts`
  - `npx tsx --tsconfig tsconfig.json src/utils/color.test.ts`
  - `npx tsx --tsconfig tsconfig.json src/hooks/useGameEngine.test.ts`

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
- `src/hooks` — `useHighScore` (AsyncStorage), `useGameEngine` (state
  machine + Reanimated SharedValues + combo expansion + revive),
  `useAudio` (expo-av SFX + persistent mute), `useRewardedAd` (AdMob
  rewarded video + mock fallback).
- `src/components` — `Block`, `SlicedPiece`, `ActiveBlock`, `Tower`,
  `HUD`, `StartScreen`, `GameOverModal`, `FloatingComboText`, `Game` (root).
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
