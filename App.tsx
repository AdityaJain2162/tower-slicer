import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f1a' }}>
      <Text style={{ color: '#fff' }}>Tower Slicer - scaffolding...</Text>
      <StatusBar style="light" />
    </View>
  );
}
