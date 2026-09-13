import { ActivityIndicator, View } from 'react-native';
import { useFonts } from '@/hooks/useFonts';
import Game from '@/components/Game';

export default function App() {
  const { loaded } = useFonts();

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f1a' }}>
        <ActivityIndicator size="large" color="#ffd166" />
      </View>
    );
  }

  return <Game />;
}
