# ThinkTank Mobile

ThinkTank Mobile is the iOS and Android app for ThinkTank. It is built with **React Native** and **Expo SDK 56**, using a **native development build** (not Expo Go) so features like Google Sign-In use the official iOS/Android SDKs.

## Tech stack

| Layer | Tools |
|-------|--------|
| Framework | React Native 0.85, Expo 56 |
| Language | TypeScript |
| Navigation | React Navigation (native stack) |
| State | Redux Toolkit |
| Forms | React Hook Form + Zod |
| HTTP | Axios |
| Auth | Native Google Sign-In, session persistence via AsyncStorage |
| UI | Custom components, light/dark theme |

## Prerequisites

- **Node.js** `>= 20.19.4` (recommended)
- **npm**
- **iOS:** Xcode + CocoaPods (`sudo gem install cocoapods`)
- **Android:** Android Studio + an emulator (AVD)

## Getting started

### 1. Install dependencies

```bash
git clone <repo-url>
cd thinktank_mobile
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_APP_ENV` | `development`, `staging`, or `production` |
| `EXPO_PUBLIC_API_URL` | Backend API base URL |
| `EXPO_PUBLIC_API_TIMEOUT_MS` | Request timeout in ms |
| `EXPO_PUBLIC_AUTH_SCHEME` | Deep link scheme (`thinktank`) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS OAuth client ID |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Web OAuth client ID (required on iOS for `idToken`) |
| `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` | `REVERSED_CLIENT_ID` from `GoogleService-Info.plist` |

### 3. Google Sign-In (native)

1. In [Google Cloud Console](https://console.cloud.google.com/), create OAuth clients for:
   - **iOS** — bundle ID: `com.thinktank.mobile`
   - **Web** — used by iOS to obtain an ID token
2. Download `GoogleService-Info.plist` → project root
3. Download `google-services.json` → project root (Android)
4. Copy values from the plist into `.env` (see `.env.example`)

Example files are provided as `GoogleService-Info.plist.example` and `google-services.json.example`.

### 4. Generate native projects

```bash
npm run prebuild
```

This creates `ios/` and `android/`. Re-run after adding native dependencies or changing `app.config.js` plugins.

> Do not run `npm run prebuild` with shell comments on the same line. Use:
> `npm run prebuild` — not `npm run prebuild # comment`

### 5. Run on a device or simulator

**iOS (first build may take several minutes):**

```bash
npm run ios
```

**Android:**

```bash
npm run android
```

**Metro only (after a dev build is installed):**

```bash
npm start
```

Clear cache if env or native config changes:

```bash
npx expo start --clear
```

## Important: Expo Go is not supported

This app uses native modules (`@react-native-google-signin/google-signin`, `expo-dev-client`, etc.). You must use a **development build** via `npm run ios` or `npm run android`. Scanning the QR code in Expo Go will not work.

## Project structure

```
src/
├── app/                 # Root providers (Redux, theme, navigation)
├── api/                 # Axios client (auto-attaches auth token)
├── components/
│   ├── auth/            # Login/signup UI
│   └── ui/              # Shared UI
├── constants/           # Env, theme, auth keys
├── contexts/            # Theme context
├── hooks/               # useAuth, typed Redux hooks
├── navigation/
│   ├── RootNavigator.tsx   # Auth guard
│   ├── AuthNavigator.tsx   # Public routes
│   ├── AppNavigator.tsx    # Protected routes
│   └── types.ts
├── screens/
│   ├── auth/            # Login, Signup (unauthenticated)
│   └── app/             # Home, etc. (authenticated only)
├── services/            # Auth session, Google Sign-In, storage
├── store/               # Redux store + auth slice
├── types/
└── utils/
```

## Authentication flow

```
App launch
    ↓
hydrateAuth() — restore session from storage
    ↓
┌──────────────────┬──────────────────┐
│ Unauthenticated  │ Authenticated    │
│ AuthNavigator    │ AppNavigator     │
│ Login / Signup   │ Home / app…      │
└──────────────────┴──────────────────┘
```

After a successful login, call `signIn()` from `useAuth`:

```ts
import { useAuth } from './src/hooks';

const { signIn } = useAuth();

await signIn({
  token: 'your-jwt-or-id-token',
  user: {
    id: 'user-id',
    email: 'user@example.com',
    name: 'Jane Doe',
  },
});
```

Sign out:

```ts
const { signOut } = useAuth();
await signOut();
```

### Adding protected screens

1. Create a screen under `src/screens/app/`
2. Register it in `src/navigation/AppNavigator.tsx`
3. Add the route to `AppStackParamList` in `src/navigation/types.ts`

Never add post-login screens to `AuthNavigator`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro for dev client |
| `npm run prebuild` | Generate `ios/` and `android/` |
| `npm run ios` | Build and run on iOS |
| `npm run android` | Build and run on Android |

## iOS CocoaPods note

Google Sign-In requires modular headers. The project includes `plugins/withIosModularHeaders.js`, which adds `use_modular_headers!` to the Podfile during prebuild.

If `pod install` fails after prebuild:

```bash
cd ios && pod install && cd ..
```

## Bundle identifiers

| Platform | ID |
|----------|-----|
| iOS | `com.thinktank.mobile` |
| Android | `com.thinktank.mobile` |

## License

See [LICENSE](LICENSE).
