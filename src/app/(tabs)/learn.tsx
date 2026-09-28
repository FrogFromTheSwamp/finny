import marker1 from '@/assets/library/learning/chapter-markers/1.png';
import marker2 from '@/assets/library/learning/chapter-markers/2.png';
import marker3 from '@/assets/library/learning/chapter-markers/3.png';
import repeatOff from '@/assets/library/learning/nodes/repetition-unavailable.png';
import repeatOn from '@/assets/library/learning/nodes/repetition-available.png';
import testOff from '@/assets/library/learning/nodes/test-unavailable.png';
import testOn from '@/assets/library/learning/nodes/test-available.png';
import theoryOff from '@/assets/library/learning/nodes/theory-unavailable.png';
import theoryOn from '@/assets/library/learning/nodes/theory-available.png';
import { CHAPTERS, LESSON_BY_ID, type LessonType } from '@/features/learning/content';
import { GameHud } from '@/game/components/GameHud';
import { useGameStore } from '@/game/store/gameStore';
import { fontFamily } from '@/ui/theme';
import { useRouter } from 'expo-router';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const LESSON_ICONS: Record<LessonType, { on: ImageSourcePropType; off: ImageSourcePropType }> = {
  theory: { on: theoryOn, off: theoryOff },
  test: { on: testOn, off: testOff },
  repetition: { on: repeatOn, off: repeatOff },
};
const CHAPTER_MARKERS = [marker1, marker2, marker3];
const LESSON_TYPE_LABEL: Record<LessonType, string> = { theory: 'Теория', test: 'Задание', repetition: 'Повторение' };

export default function LearnScreen() {
  const router = useRouter();
  const completedLessons = useGameStore((s) => s.completedLessons);
  const tutorialStage = useGameStore((s) => s.tutorialStage);
  const completedChapters = useGameStore((s) => s.completedChapters);
  const firstUnfinishedIndex = CHAPTERS.findIndex((c) => !completedChapters.includes(c.id));
  const currentChapterIndex = firstUnfinishedIndex === -1 ? CHAPTERS.length - 1 : firstUnfinishedIndex;

  return (
    <View style={styles.root}>
      <GameHud showHunger={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Учёба</Text>
        <Text style={styles.lead}>{tutorialStage < 8 ? 'Сначала помоги Финни с едой и создай первую цель — после этого откроется первый урок.' : completedChapters.includes('budget') ? 'Проходи уроки по порядку.' : 'Проходи уроки по порядку. После первой главы Финни повзрослеет.'}</Text>

        {CHAPTERS.map((chapter, ci) => {
          const chapterUnlocked = tutorialStage >= 8 && (ci === 0 || completedChapters.includes(CHAPTERS[ci - 1]!.id));
          const isActiveHeader = ci === currentChapterIndex;
          const marker = CHAPTER_MARKERS[ci] ?? marker1;

          return (
            <View key={chapter.id} style={styles.chapterSection}>
              <View style={[styles.chapterBox, !isActiveHeader && styles.chapterBoxQuiet]}>
                <Image source={marker} style={styles.chapterMarker} resizeMode="contain" />
                <View style={styles.chapterCopy}>
                  <Text style={styles.chapterBoxLabel}>Глава {ci + 1}</Text>
                  <Text style={styles.chapterBoxTitle}>{chapter.title}</Text>
                  <Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text>
                </View>
              </View>

              <View style={styles.pathArea}>
                {chapter.lessons.map((lessonId, li) => {
                  const lesson = LESSON_BY_ID[lessonId];
                  const type = lesson?.type ?? 'theory';
                  const unlocked = chapterUnlocked && (li === 0 || completedLessons.includes(chapter.lessons[li - 1]!));
                  const icons = LESSON_ICONS[type];
                  const offsetX = Math.round(Math.sin((li + 0.5) * 1.4) * 55);
                  const done = completedLessons.includes(lessonId);

                  return (
                    <View key={lessonId} style={[styles.lessonLine, { transform: [{ translateX: offsetX }] }]}>
                      <Pressable
                        disabled={!unlocked}
                        onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lessonId } })}
                        style={[styles.nodeWrap, done && styles.nodeDone]}
                        accessibilityRole="button"
                        accessibilityLabel={`${LESSON_TYPE_LABEL[type]}${unlocked ? '' : ' (заблокировано)'}`}
                      >
                        <Image source={unlocked ? icons.on : icons.off} style={styles.nodeIcon} resizeMode="contain" />
                      </Pressable>
                      <View style={styles.lessonLabel}><Text style={styles.lessonLabelTop}>Урок {li + 1}</Text><Text style={styles.lessonLabelText}>{lesson?.title}</Text></View>
                    </View>
                  );
                })}
              </View>

              {!chapterUnlocked ? <View style={styles.lockBox}><Text style={styles.lockText}>{ci === 0 ? 'Откроется после первой цели' : 'Откроется после завершения предыдущей главы'}</Text></View> : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F3F0' },
  content: { paddingTop: 128, paddingHorizontal: 18, paddingBottom: 130 },
  screenTitle: { fontFamily: fontFamily.bold, fontSize: 30, color: '#2A160A' },
  lead: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20, color: '#6A5A50', marginTop: 8, marginBottom: 22 },
  chapterSection: { marginBottom: 16 },
  chapterBox: { minHeight: 96, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingRight: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E6E0DB' },
  chapterBoxQuiet: { opacity: 0.78 },
  chapterMarker: { width: 82, height: 82, marginHorizontal: 2 },
  chapterCopy: { flex: 1 },
  chapterBoxLabel: { fontFamily: fontFamily.medium, fontSize: 11, color: '#8A7C72' },
  chapterBoxTitle: { fontFamily: fontFamily.bold, fontSize: 19, color: '#2A160A', marginTop: 1 },
  chapterSubtitle: { fontFamily: fontFamily.medium, fontSize: 11, color: '#76675D', marginTop: 3 },
  pathArea: { paddingVertical: 2, alignItems: 'center' },
  lessonLine: { width: 250, minHeight: 96, flexDirection: 'row', alignItems: 'center' },
  nodeWrap: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  nodeDone: { opacity: 0.88 },
  nodeIcon: { width: 96, height: 96 },
  lessonLabel: { flex: 1, marginLeft: 4 },
  lessonLabelTop: { fontFamily: fontFamily.semiBold, fontSize: 10, color: '#9A8D84' },
  lessonLabelText: { fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 16, color: '#45342A', marginTop: 2 },
  lockBox: { marginTop: 4, marginBottom: 10, padding: 11, borderRadius: 10, backgroundColor: '#ECE9E6' },
  lockText: { fontFamily: fontFamily.medium, fontSize: 11, color: '#756C67', textAlign: 'center' },
});
