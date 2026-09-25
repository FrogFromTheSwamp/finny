import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import homeRoom from '@/assets/game/rooms/home-room.png';
import { GameHud } from '@/game/components/GameHud';
import { fontFamily } from '@/ui/theme';

export function ComingSoonScreen({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.root}>
      <ImageBackground source={homeRoom} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.dim} />
      <GameHud showHunger={false} />
      <View style={styles.card}>
        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
        <View style={styles.pill}><Text style={styles.pillText}>Скоро</Text></View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#B89B7A' },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(58,34,20,0.18)' },
  card: { position: 'absolute', left: 28, right: 28, top: '31%', borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 2, borderColor: '#5A3B28', alignItems: 'center', padding: 24, shadowColor: '#3C271A', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6 },
  emoji: { fontSize: 38 }, title: { marginTop: 8, fontFamily: fontFamily.bold, fontSize: 24, color: '#2A1105' },
  text: { marginTop: 8, fontFamily: fontFamily.medium, fontSize: 15, lineHeight: 21, color: '#67564C', textAlign: 'center' },
  pill: { marginTop: 16, borderRadius: 14, backgroundColor: '#E9E1D8', paddingHorizontal: 16, paddingVertical: 8 }, pillText: { fontFamily: fontFamily.bold, color: '#4B382C' },
});
