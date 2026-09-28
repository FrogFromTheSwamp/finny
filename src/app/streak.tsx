import fire from '@/assets/library/ui/effects/streak-fire.png';
import { useGameStore } from '@/game/store/gameStore';
import { fontFamily } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function StreakScreen() {
  const router = useRouter();
  const streak = useGameStore((s) => s.streakDays);
  const lastRewardDate = useGameStore((s) => s.lastRewardDate);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthTitle = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(now);

  const streakDates = useMemo(() => {
    const dates = new Set<string>();
    if (!lastRewardDate || streak <= 0) return dates;
    const [y, m, d] = lastRewardDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    for (let i = 0; i < streak; i += 1) {
      dates.add(localDateKey(date));
      date.setDate(date.getDate() - 1);
    }
    return dates;
  }, [lastRewardDate, streak]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹</Text></Pressable>
        <Text style={styles.title}>Дни подряд</Text>
      </View>
      <View style={styles.fireWrap}>
        <Image source={fire} style={styles.fire} resizeMode="contain" />
        <Text style={styles.fireNumber}>{streak}</Text>
      </View>
      <View style={styles.lessonCard}>
        <Text style={styles.lessonText}>Серия растёт, если на следующий день забрать ежедневную награду.</Text>
        <Pressable style={styles.lessonButton} onPress={() => router.replace('/(tabs)/home')}><Text style={styles.lessonButtonText}>На главную</Text></Pressable>
      </View>
      <View style={styles.calendarCard}>
        <Text style={styles.calendarTitle}>Календарь</Text>
        <View style={styles.monthRow}><Text style={styles.monthArrow}>‹</Text><Text style={styles.month}>{monthTitle}</Text><Text style={styles.monthArrow}>›</Text></View>
        <View style={styles.weekRow}>{WEEKDAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}</View>
        <View style={styles.daysGrid}>
          {Array.from({ length: firstWeekday }).map((_, i) => <View key={`blank-${i}`} style={styles.dayCell} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = localDateKey(new Date(year, month, day));
            const active = streakDates.has(key);
            const today = day === now.getDate();
            return <View key={day} style={[styles.dayCell, active && styles.dayActive, today && !active && styles.dayToday]}><Text style={[styles.dayText, active && styles.dayActiveText]}>{day}</Text></View>;
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F4', paddingHorizontal: 14 },
  header: { height: 62, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 38, height: 44, justifyContent: 'center' },
  back: { fontSize: 38, lineHeight: 40, color: '#24150D' },
  title: { fontFamily: fontFamily.bold, fontSize: 18, color: '#24150D' },
  fireWrap: { height: 150, alignItems: 'center', justifyContent: 'center' },
  fire: { width: 128, height: 128 },
  fireNumber: { position: 'absolute', bottom: 30, fontFamily: fontFamily.bold, color: '#8B2D0D', fontSize: 30 },
  lessonCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 2 },
  lessonText: { fontFamily: fontFamily.medium, color: '#3B2D25', fontSize: 12, lineHeight: 17 },
  lessonButton: { height: 42, borderRadius: 6, backgroundColor: '#431600', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  lessonButtonText: { fontFamily: fontFamily.bold, color: '#fff', fontSize: 12 },
  calendarCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 14 },
  calendarTitle: { fontFamily: fontFamily.bold, color: '#2B1B13', fontSize: 15 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12 },
  month: { fontFamily: fontFamily.medium, color: '#3A302A', fontSize: 12, textTransform: 'capitalize' },
  monthArrow: { fontFamily: fontFamily.regular, fontSize: 27, color: '#8A817B' },
  weekRow: { flexDirection: 'row' },
  weekday: { width: '14.285%', textAlign: 'center', fontFamily: fontFamily.medium, color: '#5F554E', fontSize: 10 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  dayCell: { width: '14.285%', aspectRatio: 1.15, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  dayActive: { backgroundColor: '#431600' },
  dayToday: { borderWidth: 1, borderColor: '#BFA99D' },
  dayText: { fontFamily: fontFamily.medium, color: '#3A302A', fontSize: 10 },
  dayActiveText: { color: '#fff', fontFamily: fontFamily.bold },
});
