# Tower Slicer

A production-ready clone of the classic **"Stack"** mechanic, built with Expo (managed workflow), TypeScript, React Native Reanimated, and react-native-gesture-handler. Tap to slice the moving block, stack perfect overlaps, and climb as high as you can.

<p align="center"><strong>TOWER SLICER — Stack the perfect tower</strong></p>

---

## Features

- **UI-thread animations** — all block motion is driven by Reanimated `SharedValue`s and animated styles. No `setInterval` or JS-thread `requestAnimationFrame`.
- **Zero-latency input** — `Gesture.Tap().runOnJS(true)` from `react-native-gesture-handler`.
- **Slicing math** — overlap calculation, perfect-snap tolerance (≤3px), and left/right leftover pieces that fall with gravity + rotation.
- **Procedural HSL gradient** — hue advances 6° per layer so the tower reads as a continuous rainbow as it rises.
- **Speed scaling** — oscillation cycle shrinks every 5 placed blocks (1800ms → 800ms floor).
- **Streak combo** — consecutive perfect snaps build a flame combo multiplier.
- **Persistent high score** — personal best stored in `@react-native-async-storage/async-storage` (all ops try/catch guarded).
- **Haptics** — `expo-haptics` Light impact on hit, Medium on perfect, Error notification on miss.
- **Game states** — IDLE (title + best), PLAYING (HUD + streak), GAMEOVER (tower shake, red flash, modal with restart).

## Tech Stack

| Concern        | Library                                   |
| -------------- | ----------------------------------------- |
| Framework      | Expo (managed workflow, SDK 53)           |
| Language       | TypeScript (strict)                       |
| Animation      | `react-native-reanimated`                 |
| Gestures       | `react-native-gesture-handler`            |
| Persistence    | `@react-native-async-storage/async-storage`|
| Haptics        | `expo-haptics`                            |
| Icons          | `@expo/vector-icons`                      |

## Requirements

- **Node 20.x** (LTS). Node 22.18+ and 24 enable native TypeScript type-stripping by default, which breaks the Expo CLI (it loads `.ts` source from `node_modules`). Use Node 20. With nvm-windows:
  ```bash
  nvm install 20
  nvm use 20
  ```
- npm installs use `legacy-peer-deps=true` (see `.npmrc`) to resolve the SDK 53 peer-dependency graph.

## Getting Started

```bash
# 1. Use the right Node version
nvm use 20

# 2. Install dependencies
npm install

# 3. Start the dev server
npm start
```

Then scan the QR code with the **Expo Go** app (Android) or press `a` / `i` to launch on a connected emulator/simulator.

## Scripts

| Command              | Description                                  |
| -------------------- | --------------------------------------------- |
| `npm start`          | Start Expo dev server                         |
| `npm run android`   | Launch on Android device/emulator             |
| `npm run ios`        | Launch on iOS simulator (macOS only)          |
| `npm run web`        | Launch in browser                             |
| `npm run typecheck`  | `tsc --noEmit` (strict mode)                   |
| `npm run lint`       | `expo lint`                                   |

## Testing the Math/Logic

Pure logic (slicing, color, speed scaling) is unit-tested with a lightweight tsx-based runtime harness — no test-runner dependency.

```bash
npx tsx --tsconfig tsconfig.json src/utils/slicing.test.ts       # 27 cases
npx tsx --tsconfig tsconfig.json src/utils/color.test.ts         # 6 cases
npx tsx --tsconfig tsconfig.json src/hooks/useGameEngine.test.ts # 6 cases
```

## Building an Android APK

### Quick test with Expo Go
1. Install **Expo Go** from the Play Store on your phone.
2. Run `npm start` and scan the QR code.
3. The game loads live with hot-reload.

### Installable .apk via EAS (cloud build)
```bash
npm install -g eas-cli
eas login                       # free Expo account
eas build:configure             # links project to your account
eas build --profile preview --platform android
```
EAS builds in the cloud and returns a download URL for the `.apk`. Install it on your phone (allow "unknown sources" the first time).

## Architecture

```
src/
├── types/            # Framework-agnostic domain types
├── constants/
│   ├── game.ts       # RN-free numeric constants (unit-testable)
│   └── index.ts      # Screen dimensions (RN-dependent)
├── utils/
│   ├── slicing.ts    # Pure overlap + slice math
│   ├── color.ts      # Procedural HSL gradient
│   └── engine.ts     # Speed scaling + direction alternation
├── services/
│   └── haptics.ts    # expo-haptics wrapper (try/catch guarded)
├── hooks/
│   ├── useHighScore.ts   # AsyncStorage persistence
│   └── useGameEngine.ts  # State machine + Reanimated SharedValues
└── components/
    ├── Block.tsx         # Placed tower block
    ├── SlicedPiece.tsx   # Falling leftover (gravity + rotation)
    ├── ActiveBlock.tsx   # UI-thread oscillation loop
    ├── Tower.tsx         # Shifting container
    ├── HUD.tsx           # Score + streak
    ├── StartScreen.tsx   # IDLE overlay
    ├── GameOverModal.tsx # GAMEOVER modal
    └── Game.tsx          # Root (GestureHandlerRootView)
```

### Design principles
- **Math/logic is decoupled from UI** — pure functions in `src/utils` take primitives and return `SliceResult`/colors. No React, no RN.
- **Constants split** — numeric constants live in `constants/game.ts` (RN-free) so the logic layer is unit-testable in plain Node; screen dimensions live in `constants/index.ts`.
- **All motion on the UI thread** — `withRepeat`/`withSequence`/`withTiming` drive positioning. The JS thread only handles state transitions on tap.
- **Safe persistence** — every AsyncStorage call is wrapped in try/catch so a corrupt/unavailable store degrades to an in-memory best.

## Game Rules

1. A block oscillates horizontally across the screen.
2. Tap to place it. The overlap with the block below becomes the new block's width.
3. The leftover slice falls away with gravity + rotation.
4. Within **3px** of the previous block's X → **perfect snap** (no slice, streak combo).
5. **No overlap → game over.**
6. Each placement shifts the tower down so the active layer stays centered.
7. Speed increases every 5 blocks; hue shifts 6° per layer.

## License

MIT
