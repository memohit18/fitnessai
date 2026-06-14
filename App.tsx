import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProviders } from './src/app/providers';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProviders />
    </SafeAreaProvider>
  );
}
