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
- `src/hooks` — `useHighScore` (AsyncStorage), `useGameEngine` (state
  machine + Reanimated SharedValues).
- `src/components` — `Block`, `SlicedPiece`, `ActiveBlock`, `Tower`,
  `HUD`, `StartScreen`, `GameOverModal`, `Game` (root).

All motion is driven by Reanimated SharedValues + animated styles on the
UI thread. No `setInterval` or JS-thread `requestAnimationFrame` is used
for block movement.
