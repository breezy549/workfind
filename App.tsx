import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={s.page}>
      <Text style={s.logo}>workfind</Text>
      <Text accessibilityRole="header" style={s.title}>Discover work worth learning.</Text>
      <Text style={s.subtitle}>High-paying hands-on jobs, what it takes to get in, and where to learn.</Text>
      <StatusBar style="dark" />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  logo: { fontSize: 16, fontWeight: '700', marginBottom: 24 },
  title: { fontSize: 34, fontWeight: '800', marginBottom: 12 },
  subtitle: { fontSize: 17, color: '#555' },
});
