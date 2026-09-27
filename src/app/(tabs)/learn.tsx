import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CHAPTERS } from '@/features/learning/content';
import { GameHud } from '@/game/components/GameHud';
import { useGameStore } from '@/game/store/gameStore';
import { fontFamily } from '@/ui/theme';

export default function LearnScreen() {
  const router = useRouter();
  const completedLessons = useGameStore((s) => s.completedLessons);
  const completedChapters = useGameStore((s) => s.completedChapters);

  return <View style={styles.root}>
    <GameHud showHunger={false} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>Учёба</Text>
      <Text style={styles.lead}>Проходи короткие уроки, зарабатывай финники и открывай новые главы.</Text>
      {CHAPTERS.map((chapter, ci) => {
        const chapterUnlocked = ci === 0 || completedChapters.includes(CHAPTERS[ci-1]!.id);
        const doneCount = chapter.lessons.filter((id) => completedLessons.includes(id)).length;
        return <View key={chapter.id} style={styles.chapter}>
          <View style={[styles.chapterHeader,{ backgroundColor: chapter.color }]}>
            <Text style={styles.chapterNumber}>Глава {ci+1}</Text><Text style={styles.chapterTitle}>{chapter.title}</Text><Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text>
            <View style={styles.chapterProgress}><View style={[styles.chapterProgressFill,{ width: `${doneCount/4*100}%` }]} /></View>
            <Text style={styles.progressText}>{doneCount} из 4 уроков</Text>
          </View>
          <View style={styles.pathArea}>
            <View style={[styles.pathLine,{ backgroundColor: chapterUnlocked ? chapter.color : '#CFCFCF' }]} />
            {chapter.lessons.map((lessonId, li) => {
              const completed = completedLessons.includes(lessonId);
              const unlocked = chapterUnlocked && (li === 0 || completedLessons.includes(chapter.lessons[li-1]!));
              return <Pressable key={lessonId} disabled={!unlocked} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lessonId } })} style={[styles.nodeWrap, li % 2 ? styles.nodeRight : styles.nodeLeft]}>
                <View style={[styles.node, { borderColor: unlocked ? chapter.color : '#B9B9B9', backgroundColor: completed ? chapter.color : '#fff' }]}>
                  <Text style={[styles.nodeText,{ color: completed ? '#fff' : unlocked ? chapter.color : '#999' }]}>{completed ? '✓' : unlocked ? li+1 : '🔒'}</Text>
                </View>
                <View style={[styles.lessonLabel, !unlocked && styles.lockedLabel]}><Text style={styles.lessonTitle}>Урок {li+1}</Text><Text style={styles.lessonMeta}>{completed ? 'Пройден' : unlocked ? 'Нажми, чтобы начать' : 'Сначала пройди предыдущий'}</Text></View>
              </Pressable>;
            })}
          </View>
          {!chapterUnlocked ? <View style={styles.lockBox}><Text style={styles.lockText}>Глава откроется после завершения предыдущей.</Text></View> : null}
        </View>;
      })}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F3F0' }, content: { paddingTop: 128, paddingHorizontal: 18, paddingBottom: 130 },
  screenTitle: { fontFamily: fontFamily.bold, fontSize: 30, color: '#2A160A' }, lead: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20, color: '#6A5A50', marginTop: 8, marginBottom: 22 },
  chapter: { marginBottom: 24, borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3DED9' },
  chapterHeader: { padding: 18 }, chapterNumber: { fontFamily: fontFamily.semiBold, fontSize: 12, color: 'rgba(255,255,255,.78)' }, chapterTitle: { fontFamily: fontFamily.bold, fontSize: 25, color: '#fff', marginTop: 2 }, chapterSubtitle: { fontFamily: fontFamily.medium, color: '#fff', marginTop: 3 }, chapterProgress: { height: 7, marginTop: 16, backgroundColor: 'rgba(255,255,255,.35)', borderRadius: 4, overflow: 'hidden' }, chapterProgressFill: { height: '100%', backgroundColor: '#fff' }, progressText: { marginTop: 7, fontFamily: fontFamily.semiBold, fontSize: 11, color: '#fff' },
  pathArea: { minHeight: 530, paddingVertical: 24, position: 'relative' }, pathLine: { position: 'absolute', width: 5, left: '49.5%', top: 42, bottom: 44, borderRadius: 3, opacity: .28 }, nodeWrap: { height: 118, width: '86%', flexDirection: 'row', alignItems: 'center', gap: 12 }, nodeLeft: { alignSelf: 'flex-start', paddingLeft: 16 }, nodeRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse', paddingRight: 16 },
  node: { width: 72, height: 72, borderRadius: 36, borderWidth: 5, alignItems: 'center', justifyContent: 'center', zIndex: 2 }, nodeText: { fontFamily: fontFamily.bold, fontSize: 22 }, lessonLabel: { flex: 1, minHeight: 62, borderRadius: 12, backgroundColor: '#F7F5F2', padding: 10, justifyContent: 'center' }, lockedLabel: { opacity: .55 }, lessonTitle: { fontFamily: fontFamily.bold, color: '#2B1B12', fontSize: 14 }, lessonMeta: { marginTop: 3, fontFamily: fontFamily.medium, fontSize: 11, color: '#7A6D65' },
  lockBox: { margin: 14, marginTop: -4, padding: 12, borderRadius: 10, backgroundColor: '#F0EEEC' }, lockText: { fontFamily: fontFamily.medium, fontSize: 12, color: '#756C67', textAlign: 'center' },
});
