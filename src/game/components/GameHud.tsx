import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import fire from '@/assets/game/ui/streak-fire.png';
import { HungerMeter } from '@/game/components/HungerMeter';
import { TasksModal } from '@/game/components/TasksModal';
import { showGameDialog } from '@/game/services/dialogService';
import { useGameStore } from '@/game/store/gameStore';
import { fontFamily } from '@/ui/theme';

function SettingsGlyph() {
  return (
    <Svg width={38} height={38} viewBox="0 0 24 24">
      <Path fill="#2A1105" d="M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.2 7.2 0 0 0-1.69-.98L14.5 2.42A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42L9.13 5.07c-.61.25-1.17.59-1.69.98l-2.49-1a.49.49 0 0 0-.61.22l-2 3.46a.49.49 0 0 0 .12.64l2.11 1.65c-.05.32-.08.66-.08.98s.03.66.08.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.13.23.4.32.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.04.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.22.08.49 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
    </Svg>
  );
}

function LevelBadge({ value }: { value: number }) {
  const r = 25;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(0.82, 0.2 + ((value - 1) % 5) * 0.13);
  return (
    <View style={styles.levelBadge}>
      <Svg width={58} height={58} style={StyleSheet.absoluteFill} viewBox="0 0 58 58">
        <Circle cx="29" cy="29" r={r} stroke="#5C4B3D" strokeWidth="2" fill="#FFFFFF" />
        <Circle cx="29" cy="29" r={r} stroke="#3F771A" strokeWidth="6" fill="none" strokeDasharray={`${circumference * progress} ${circumference}`} strokeLinecap="butt" rotation={-92} originX={29} originY={29} />
      </Svg>
      <Text style={styles.levelText}>{value}</Text>
    </View>
  );
}

export function GameHud({ showHunger = true }: { showHunger?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tasksOpen, setTasksOpen] = useState(false);
  const coins = useGameStore((s) => s.coins);
  const level = useGameStore((s) => s.level);
  const streak = useGameStore((s) => s.streakDays);
  const hunger = useGameStore((s) => s.hunger);
  return (
    <View pointerEvents="box-none" style={[styles.layer, { paddingTop: Math.max(insets.top + 8, 50) }]}>
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          <LevelBadge value={level} />
          <View style={styles.coinBadge}><Text style={styles.number}>{coins}</Text><View style={styles.coinDot} /></View>
        </View>
        <View style={styles.topTools}>
          <Pressable style={styles.fireButton} onPress={() => showGameDialog(`Серия входов: ${streak} дн. Заходи каждый день, чтобы сохранить огонёк.`, { title: 'Серия входов' })}>
            <Image source={fire} style={styles.fire} resizeMode="contain" /><Text style={styles.fireText}>{streak}</Text>
          </Pressable>
          <Pressable style={styles.settings} onPress={() => router.push('/settings')} accessibilityLabel="Настройки"><SettingsGlyph /></Pressable>
        </View>
      </View>
      {showHunger ? (
        <View style={styles.side}>
          <HungerMeter value={hunger} />
          <Pressable style={styles.tasks} onPress={() => setTasksOpen(true)} accessibilityLabel="Задания"><View style={styles.taskSquare}><Text style={styles.taskIcon}>✓</Text></View></Pressable>
        </View>
      ) : null}
      <TasksModal visible={tasksOpen} onClose={() => setTasksOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, zIndex: 20, paddingHorizontal: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftGroup: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  levelBadge: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  levelText: { fontFamily: fontFamily.bold, fontSize: 18, color: '#2A1105' },
  coinBadge: { height: 54, minWidth: 72, paddingHorizontal: 11, borderRadius: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, shadowColor: '#534122', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  number: { fontFamily: fontFamily.medium, color: '#2A1105', fontSize: 16 },
  coinDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFB600' },
  topTools: { width: 116, height: 54, borderRadius: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', shadowColor: '#534122', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  fireButton: { width: 52, height: 50, alignItems: 'center', justifyContent: 'center' },
  fire: { width: 42, height: 42 },
  fireText: { position: 'absolute', fontFamily: fontFamily.bold, color: '#fff', fontSize: 14, top: 17 },
  settings: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  side: { position: 'absolute', right: 16, top: '46.5%', gap: 8, alignItems: 'center' },
  tasks: { width: 54, height: 54, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#534122', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  taskSquare: { width: 30, height: 30, borderRadius: 4, backgroundColor: '#2A1105', alignItems: 'center', justifyContent: 'center' },
  taskIcon: { fontFamily: fontFamily.bold, fontSize: 20, color: '#fff', lineHeight: 23 },
});
