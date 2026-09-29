import {
  CHAPTERS,
  LESSON_BY_ID,
  type LessonType,
} from "@/features/learning/content";
import { GameHud } from "@/game/components/GameHud";
import { useGameStore } from "@/game/store/gameStore";
import { sessionUi } from "@/game/sessionUi";
import { fontFamily } from "@/ui/theme";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ChapterBookIcon from "@/assets/library/ui/icons/book-open.png";
import repeatOff from "@/assets/library/learning/nodes/repetition-unavailable.png";
import repeatOn from "@/assets/library/learning/nodes/repetition-available.png";
import testOff from "@/assets/library/learning/nodes/test-unavailable.png";
import testOn from "@/assets/library/learning/nodes/test-available.png";
import theoryOff from "@/assets/library/learning/nodes/theory-unavailable.png";
import theoryOn from "@/assets/library/learning/nodes/theory-available.png";

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
  test: "Задание",
  repetition: "Повторение",
};

export default function LearnScreen() {
  const router = useRouter();
  const completedLessons = useGameStore((s) => s.completedLessons);
  const completedChapters = useGameStore((s) => s.completedChapters);
  const tutorialStage = useGameStore((s) => s.tutorialStage);
  const setTutorialStage = useGameStore((s) => s.setTutorialStage);
  const hasGoal = useGameStore((s) => s.goals.length > 0);
  const lessonsOpen = tutorialStage >= 8 || hasGoal;

  const firstUnfinishedIndex = CHAPTERS.findIndex(
    (c) => !completedChapters.includes(c.id),
  );
  const currentChapterIndex =
    firstUnfinishedIndex === -1 ? CHAPTERS.length - 1 : firstUnfinishedIndex;

  const openingRef = useRef(false);
  const [openingLessonId, setOpeningLessonId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      openingRef.current = false;
      setOpeningLessonId(null);
    }, []),
  );

  useEffect(() => {
    if (hasGoal && tutorialStage < 8) setTutorialStage(8);
  }, [hasGoal, tutorialStage, setTutorialStage]);

  useEffect(() => {
    if (!lessonsOpen) return;
    // Подгружаем содержимое уроков и связанные ассеты заранее, пока
    // пользователь просто листает карту, чтобы сам урок открывался мгновенно.
    void import("@/features/learning/lessonFlows");
    const nextChapter = CHAPTERS.find(
      (chapter, index) =>
        (index === 0 || completedChapters.includes(CHAPTERS[index - 1]!.id)) &&
        chapter.lessons.some((id) => !completedLessons.includes(id)),
    );
    const nextLessonId = nextChapter?.lessons.find(
      (id) => !completedLessons.includes(id),
    );
    if (nextLessonId) {
      router.prefetch({ pathname: "/lesson/[id]", params: { id: nextLessonId } });
    }
  }, [completedChapters, completedLessons, lessonsOpen, router]);

  const openLesson = (lessonId: string) => {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpeningLessonId(lessonId);
    router.navigate({ pathname: "/lesson/[id]", params: { id: lessonId } });
  };

  return (
    <View style={styles.root}>
      <GameHud showHunger={false} />
      <ScrollView
        contentOffset={{ x: 0, y: sessionUi.learnScrollY }}
        onScroll={(event) => {
          sessionUi.learnScrollY = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={32}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Учёба</Text>
        <Text style={styles.lead}>
          {lessonsOpen
            ? completedChapters.includes("budget")
              ? "Проходи уроки по порядку."
              : "Проходи уроки по порядку. После первой главы Финни повзрослеет."
            : "Сначала помоги Финни с едой и создай первую цель — после этого откроется первый урок."}
        </Text>

        {CHAPTERS.map((chapter, ci) => {
          const chapterUnlocked =
            lessonsOpen &&
            (ci === 0 || completedChapters.includes(CHAPTERS[ci - 1]!.id));
          const isActiveHeader = ci === currentChapterIndex;

          return (
            <View key={chapter.id}>
              {isActiveHeader ? (
                <View style={styles.chapterBox}>
                  <View style={{width:'80%'}}>
                    <Text style={styles.chapterBoxLabel}>Глава {ci + 1}</Text>
                    <Text style={styles.chapterBoxTitle}>{chapter.title}</Text>
                  </View>
                  <Image
                        source={ChapterBookIcon}
                        style={styles.ChapterBookIconStyle}
                        resizeMode="contain"
                      />
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
                  const isOpening = openingLessonId === lessonId;

                  return (
                    <Pressable
                      key={lessonId}
                      disabled={!unlocked || openingLessonId !== null}
                      onPress={() => openLesson(lessonId)}
                      style={({ pressed }) => [
                        styles.nodeWrap,
                        {
                          transform: [
                            { translateX: offsetX },
                            { scale: pressed || isOpening ? 0.96 : 1 },
                          ],
                        },
                        (pressed || isOpening) && styles.nodeDim,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{
                        disabled: !unlocked || openingLessonId !== null,
                        busy: isOpening,
                      }}
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
                    {ci === 0
                      ? "Откроется после первой цели"
                      : "Глава откроется после завершения предыдущей."}
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
  ChapterBookIconStyle: {width: 44},

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
  nodeDim: {
    opacity: 0.65,
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