import sparkBlue from '@/assets/library/ui/effects/spark-blue.png';
import sparkDiamond from '@/assets/library/ui/effects/spark-diamond.png';
import sparkGold from '@/assets/library/ui/effects/spark-gold.png';
import sparkPink from '@/assets/library/ui/effects/spark-pink.png';
import sparkPurple from '@/assets/library/ui/effects/spark-purple.png';
import sparkRose from '@/assets/library/ui/effects/spark-rose.png';
import coin from '@/assets/library/learning/lesson/coin-1.png';
import { FinnyButton } from '@/components/FinnyButton';
import type { PetColorId } from '@/content/petColors';
import { CHAPTER_BY_ID, LESSON_BY_ID } from '@/features/learning/content';
import { PetWithHat } from '@/game/components/PetWithHat';
import { useGameStore } from '@/game/store/gameStore';
import { useProfileStore } from '@/store/profileStore';
import { fontFamily } from '@/ui/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef } from 'react';
import type { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SPARKS: { source: ImageSourcePropType; style: StyleProp<ImageStyle> }[] = [
  { source: sparkPink, style: { top: 128, left: 18, width: 46, height: 46 } },
  { source: sparkBlue, style: { top: 168, right: 22, width: 40, height: 40 } },
  { source: sparkDiamond, style: { top: 236, right: 48, width: 26, height: 26 } },
  { source: sparkPurple, style: { top: 292, left: 12, width: 52, height: 52 } },
  { source: sparkGold, style: { top: 214, left: 58, width: 18, height: 18 } },
  { source: sparkRose, style: { top: 330, right: 78, width: 16, height: 16 } },
];

export default function LessonCompleteScreen() {
  const router = useRouter();
  const { lesson: lessonId } = useLocalSearchParams<{ lesson: string }>();
  const lesson = LESSON_BY_ID[String(lessonId)];
  const color = (useProfileStore((s) => s.petColorId) || 'brown') as PetColorId;
  const accuracy = useGameStore((s) => s.lessonAccuracy[String(lessonId)] ?? 100);
  const claimed = useGameStore((s) => s.claimedLessonRewards.includes(String(lessonId)));
  const claim = useGameStore((s) => s.claimLessonReward);
  const leavingRef = useRef(false);
  if (!lesson) return null;
  const chapter = CHAPTER_BY_ID[lesson.chapter];
  const isLast = chapter.lessons[chapter.lessons.length - 1] === lesson.id;
  const go = () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    if (!claimed) claim(lesson.id);
    if (isLast) router.replace({ pathname: '/chapter-complete', params: { chapter: lesson.chapter } });
    else router.replace('/(tabs)/learn');
  };
  return (
    <SafeAreaView style={styles.root}>
      {SPARKS.map((spark, index) => (
        <Image key={index} source={spark.source} style={[styles.spark, spark.style]} resizeMode="contain" />
      ))}
      <Text style={styles.title}>Конец урока!</Text>
      <View style={styles.pet}><PetWithHat color={color} emotion="happy" /></View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Заработано</Text>
          <View style={styles.coinRow}>
            <Text style={styles.statValue}>30</Text>
            <Image source={coin} style={styles.coin} resizeMode="contain" />
          </View>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Опыт</Text>
          <Text style={styles.statValue}>+25</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Точность</Text>
          <Text style={styles.statValue}>{accuracy}%</Text>
        </View>
      </View>
      <View style={styles.bottom}>
        <FinnyButton label={claimed ? (isLast ? 'Завершить главу' : 'Продолжить') : 'Забрать финники'} onPress={go} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7', alignItems: 'center', paddingHorizontal: 22 },
  spark: { position: 'absolute' },
  title: { fontFamily: fontFamily.bold, fontSize: 32, color: '#24160F', marginTop: 54 },
  pet: { width: 280, height: 250, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 8 },
  stat: { width: 108, minHeight: 86, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  statLabel: { fontFamily: fontFamily.medium, fontSize: 12, color: '#796E68' },
  statValue: { marginTop: 6, fontFamily: fontFamily.bold, fontSize: 20, color: '#28180F' },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coin: { width: 22, height: 22, marginTop: 6 },
  bottom: { position: 'absolute', left: 22, right: 22, bottom: 26 },
});
