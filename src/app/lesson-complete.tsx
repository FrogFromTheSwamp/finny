import confetti from '@/assets/library/ui/effects/confetti.png';
import { FinnyButton } from '@/components/FinnyButton';
import type { PetColorId } from '@/content/petColors';
import { CHAPTER_BY_ID, LESSON_BY_ID } from '@/features/learning/content';
import { PetWithHat } from '@/game/components/PetWithHat';
import { useGameStore } from '@/game/store/gameStore';
import { useProfileStore } from '@/store/profileStore';
import { fontFamily } from '@/ui/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LessonCompleteScreen() {
  const router = useRouter();
  const { lesson: lessonId } = useLocalSearchParams<{ lesson: string }>();
  const lesson = LESSON_BY_ID[String(lessonId)];
  const color = (useProfileStore((s) => s.petColorId) || 'brown') as PetColorId;
  const accuracy = useGameStore((s) => s.lessonAccuracy[String(lessonId)] ?? 100);
  const claimed = useGameStore((s) => s.claimedLessonRewards.includes(String(lessonId)));
  const claim = useGameStore((s) => s.claimLessonReward);
  if (!lesson) return null;
  const chapter = CHAPTER_BY_ID[lesson.chapter];
  const isLast = chapter.lessons[chapter.lessons.length - 1] === lesson.id;
  const go = () => {
    if (!claimed) claim(lesson.id);
    if (isLast) router.replace({ pathname: '/chapter-complete', params: { chapter: lesson.chapter } });
    else router.replace('/(tabs)/learn');
  };
  return <SafeAreaView style={styles.root}>
    <Image source={confetti} style={styles.confetti} resizeMode="contain" />
    <Text style={styles.title}>Урок пройден!</Text>
    <View style={styles.pet}><PetWithHat color={color} emotion="happy" /></View>
    <View style={styles.stats}>
      <View style={styles.stat}><Text style={styles.statLabel}>Монеты</Text><Text style={styles.statValue}>+30 ●</Text></View>
      <View style={styles.stat}><Text style={styles.statLabel}>Опыт</Text><Text style={styles.statValue}>+25</Text></View>
      <View style={styles.stat}><Text style={styles.statLabel}>Точность</Text><Text style={styles.statValue}>{accuracy}%</Text></View>
    </View>
    <View style={styles.bottom}><FinnyButton label={claimed ? (isLast ? 'Завершить главу' : 'Продолжить') : 'Забрать финники'} onPress={go}/></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7', alignItems: 'center', paddingHorizontal: 22, paddingTop: 52 },
  confetti: { position: 'absolute', top: 92, width: '100%', height: 190, opacity: .75 },
  title: { fontFamily: fontFamily.bold, fontSize: 28, color: '#24160F', marginTop: 18 },
  pet: { width: 280, height: 220, alignItems: 'center', justifyContent: 'center', marginTop: 35 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 20 },
  stat: { width: 105, minHeight: 82, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E1DDDA', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontFamily: fontFamily.medium, fontSize: 11, color: '#796E68' },
  statValue: { marginTop: 6, fontFamily: fontFamily.bold, fontSize: 18, color: '#28180F' },
  bottom: { position: 'absolute', left: 22, right: 22, bottom: 26 },
});
