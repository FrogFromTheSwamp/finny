import {
  CHAPTERS,
  LESSON_BY_ID,
  type LessonType,
} from "@/features/learning/content";
import { GameHud } from "@/game/components/GameHud";
import { useGameStore } from "@/game/store/gameStore";
import { fontFamily } from "@/ui/theme";
import { useRouter } from "expo-router";
import type { ImageSourcePropType } from "react-native";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ChapterBookIcon from "@/assets/game/learn/chapter-book.svg";
import repeatOff from "@/assets/game/learn/icon-repeat-off.png";
import repeatOn from "@/assets/game/learn/icon-repeat-on.png";
import testOff from "@/assets/game/learn/icon-test-off.png";
import testOn from "@/assets/game/learn/icon-test-on.png";
import theoryOff from "@/assets/game/learn/icon-theory-off.png";
import theoryOn from "@/assets/game/learn/icon-theory-on.png";

const LESSON_ICONS: Record<
  LessonType,
  { on: ImageSourcePropType; off: ImageSourcePropType }
> = {
  theory: { on: theoryOn, off: theoryOff },
  test: { on: testOn, off: testOff },
  repetition: { on: repeatOn, off: repeatOff },
};

const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  theory: "Теория",
  test: "Тест",
  repetition: "Повторение",
};

export default function LearnScreen() {
  const router = useRouter();
  const completedLessons = useGameStore((s) => s.completedLessons);
  const completedChapters = useGameStore((s) => s.completedChapters);

  const firstUnfinishedIndex = CHAPTERS.findIndex(
    (c) => !completedChapters.includes(c.id),
  );
  const currentChapterIndex =
    firstUnfinishedIndex === -1 ? CHAPTERS.length - 1 : firstUnfinishedIndex;

  return (
    <View style={styles.root}>
      <GameHud showHunger={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Учёба</Text>
        <Text style={styles.lead}>
          Проходи короткие уроки, зарабатывай финники и открывай новые главы.
        </Text>

        {CHAPTERS.map((chapter, ci) => {
          const chapterUnlocked =
            ci === 0 || completedChapters.includes(CHAPTERS[ci - 1]!.id);
          const isActiveHeader = ci === currentChapterIndex;

          return (
            <View key={chapter.id}>
              {isActiveHeader ? (
                <View style={styles.chapterBox}>
                  <View>
                    <Text style={styles.chapterBoxLabel}>Глава {ci + 1}</Text>
                    <Text style={styles.chapterBoxTitle}>{chapter.title}</Text>
                  </View>
                  <ChapterBookIcon width={34} height={34} />
                </View>
              ) : (
                <View style={styles.chapterDashed}>
                  <View style={styles.dashedLine} />
                  <Text style={styles.dashedLabel} numberOfLines={1}>
                    {chapter.title}
                  </Text>
                  <View style={styles.dashedLine} />
                </View>
              )}

              <View style={styles.pathArea}>
                {chapter.lessons.map((lessonId, li) => {
                  const lesson = LESSON_BY_ID[lessonId];
                  const type = lesson?.type ?? "theory";
                  const unlocked =
                    chapterUnlocked &&
                    (li === 0 ||
                      completedLessons.includes(chapter.lessons[li - 1]!));
                  const icons = LESSON_ICONS[type];
                  const offsetX = Math.round(Math.sin((li + 0.5) * 1.4) * 55);

                  return (
                    <Pressable
                      key={lessonId}
                      disabled={!unlocked}
                      onPress={() =>
                        router.push({
                          pathname: "/lesson/[id]",
                          params: { id: lessonId },
                        })
                      }
                      style={[
                        styles.nodeWrap,
                        { transform: [{ translateX: offsetX }] },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${LESSON_TYPE_LABEL[type]}${unlocked ? "" : " (заблокировано)"}`}
                    >
                      <Image
                        source={unlocked ? icons.on : icons.off}
                        style={styles.nodeIcon}
                        resizeMode="contain"
                      />
                    </Pressable>
                  );
                })}
              </View>

              {!chapterUnlocked ? (
                <View style={styles.lockBox}>
                  <Text style={styles.lockText}>
                    Глава откроется после завершения предыдущей.
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F3F0" },
  content: { paddingTop: 128, paddingHorizontal: 18, paddingBottom: 130 },
  screenTitle: { fontFamily: fontFamily.bold, fontSize: 30, color: "#2A160A" },
  lead: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: "#6A5A50",
    marginTop: 8,
    marginBottom: 22,
  },

  chapterBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 20,
    shadowColor: "#534122",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  chapterBoxLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: "#8A7C72",
  },
  chapterBoxTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: "#2A160A",
    marginTop: 2,
  },

  chapterDashed: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#C9BEB3",
  },
  dashedLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: "#8A7C72",
    marginHorizontal: 10,
    flexShrink: 1,
    textAlign: "center",
  },

  pathArea: {
    paddingVertical: 4,
    alignItems: "center",
  },
  nodeWrap: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
  },
  nodeIcon: { width: 104, height: 104 },

  lockBox: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F0EEEC",
  },
  lockText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: "#756C67",
    textAlign: "center",
  },
});