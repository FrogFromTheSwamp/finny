import wallet from "@/assets/library/learning/items/wallet.png";
import { FinnyButton } from "@/components/FinnyButton";
import type { PetColorId } from "@/content/petColors";
import { BudgetDonut, PlanSliders } from "@/features/budget/BudgetControls";
import { CHAPTER_BY_ID, type ChapterId } from "@/features/learning/content";
import { PetWithHat } from "@/game/components/PetWithHat";
import { useGameStore, type BudgetPlan } from "@/game/store/gameStore";
import { useProfileStore } from "@/store/profileStore";
import { fontFamily } from "@/ui/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChapterCompleteScreen() {
  const router = useRouter();
  const { chapter: chapterParam } = useLocalSearchParams<{ chapter: string }>();
  const chapterId = String(chapterParam) as ChapterId;
  const chapter = CHAPTER_BY_ID[chapterId];
  const coins = useGameStore((s) => s.coins);
  const storedPlan = useGameStore((s) => s.budgetPlan);
  const savePlan = useGameStore((s) => s.setBudgetPlan);
  const completeChapter = useGameStore((s) => s.completeChapter);
  const claimChapterReward = useGameStore((s) => s.claimChapterReward);
  const completedChapters = useGameStore((s) => s.completedChapters);
  const claimedChapterRewards = useGameStore((s) => s.claimedChapterRewards);
  const lessonAccuracy = useGameStore((s) => s.lessonAccuracy);
  const depositPiggy = useGameStore((s) => s.depositPiggy);
  const milestones = useGameStore((s) => s.milestonesSeen);
  const markSeen = useGameStore((s) => s.markMilestoneSeen);
  const color = (useProfileStore((s) => s.petColorId) || "brown") as PetColorId;
  const petName = useProfileStore((s) => s.petName || "Финни");
  const distributionKey = `chapter-distribution-${chapterId}`;
  const growthKey = "pet-grown-after-budget";
  const alreadyDistributed = milestones.includes(distributionKey);
  const rewardClaimed = claimedChapterRewards.includes(chapterId);
  const [stage, setStage] = useState(0);
  const [sliderDragging, setSliderDragging] = useState(false);
  const [plan, setPlan] = useState<BudgetPlan>(storedPlan);
  const [distributionBalance, setDistributionBalance] = useState(coins);
  const stageActionRef = useRef(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    stageActionRef.current = false;
  }, [stage]);

  if (!chapter) return null;

  const accuracyValues = chapter.lessons
    .map((lessonId) => lessonAccuracy[lessonId])
    .filter((value): value is number => typeof value === "number");
  const chapterAccuracy = accuracyValues.length
    ? Math.round(
        accuracyValues.reduce((sum, value) => sum + value, 0) /
          accuracyValues.length,
      )
    : 100;

  const savedPart = Math.max(
    0,
    Math.round((distributionBalance * plan.save) / 100),
  );
  const needsGrowth = chapterId === "budget" && !milestones.includes(growthKey);

  const finish = () => {
    if (!completedChapters.includes(chapterId)) completeChapter(chapterId);
    router.replace("/(tabs)/learn");
  };

  const afterDistribution = () => {
    if (needsGrowth) {
      setStage(4);
      return;
    }
    finish();
  };

  const claimAndOpenDistribution = () => {
    if (!completedChapters.includes(chapterId)) completeChapter(chapterId);
    if (!rewardClaimed) claimChapterReward(chapterId);
    setDistributionBalance(useGameStore.getState().coins);
    setStage(1);
  };

  const saveDistribution = () => {
    savePlan(plan);
    if (savedPart > 0 && !alreadyDistributed) depositPiggy(savedPart);
    markSeen(distributionKey);
    afterDistribution();
  };

  const finishGrowth = () => {
    markSeen(growthKey);
    finish();
  };

  const advance = () => {
    if (stageActionRef.current) return;
    stageActionRef.current = true;
    if (stage === 0) claimAndOpenDistribution();
    else if (stage === 1) saveDistribution();
    else finishGrowth();
  };

  const distributionView = () => (
    <View>
      <Text style={styles.kicker}>Распределение бюджета</Text>
      <Text style={styles.title}>
        Распредели монеты так, как считаешь правильным
      </Text>
      <View style={styles.donut}>
        <BudgetDonut
          plan={plan}
          size={176}
          centerMain={`${distributionBalance}`}
          centerSub="монет"
        />
      </View>
      <PlanSliders
        plan={plan}
        onChange={setPlan}
        onDragChange={setSliderDragging}
      />
      <Text style={styles.note}>
        Отметки 50 / 30 / 20 — ориентир. Часть «Отложу», {savedPart} монет,
        переведётся со счёта в копилку.
      </Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <ScrollView
        scrollEnabled={!sliderDragging}
        canCancelContentTouches={!sliderDragging}
        contentContainerStyle={[
          styles.content,
          { paddingTop: 30 + insets.top, paddingBottom: 118 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {stage === 0 ? (
          <>
            <Text style={styles.kicker}>Конец главы!</Text>
            <Text style={styles.title}>Пришло время распределить бюджет</Text>
            <View style={styles.rewardHero}>
              <Image
                source={wallet}
                style={styles.wallet}
                resizeMode="contain"
              />
              <View style={styles.pet}>
                <PetWithHat
                  color={color}
                  emotion="happy"
                  forceChild={chapterId === "budget"}
                />
              </View>
            </View>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Заработано</Text>
                <Text style={styles.statValue}>30 ●</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Опыт</Text>
                <Text style={styles.statValue}>+25</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Точность</Text>
                <Text style={styles.statValue}>{chapterAccuracy}%</Text>
              </View>
            </View>
            <Text style={styles.body}>
              {chapter.title} пройдена. Забери награду и реши, какую часть
              баланса оставить на нужное, желания и копилку.
            </Text>
          </>
        ) : null}

        {stage === 1 ? distributionView() : null}

        {stage === 4 ? (
          <>
            <Text style={styles.kicker}>Новый этап</Text>
            <Text style={styles.title}>{petName} подрос!</Text>
            <View style={styles.petGrowth}>
              <PetWithHat color={color} emotion="happy" forceGrown />
            </View>
            <Text style={styles.big}>Первая глава позади</Text>
            <Text style={styles.body}>
              Ты научился планировать бюджет — и {petName} стал взрослее вместе
              с тобой. С этого момента взрослый образ сохранится во всём
              приложении.
            </Text>
            <Text style={styles.sparkles}>✦ ✦ ✦</Text>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.bottom, { bottom: insets.bottom + 24 }]}>
        <FinnyButton
          label={
            stage === 0
              ? rewardClaimed
                ? "Распределить бюджет"
                : "Забрать финники"
              : stage === 1
                ? "Готово!"
                : "Продолжить"
          }
          onPress={advance}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F7F7F7" },
  content: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 118,
    flexGrow: 1,
  },
  kicker: {
    fontFamily: fontFamily.semiBold,
    color: "#776A63",
    fontSize: 12,
    textAlign: "center",
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 27,
    lineHeight: 32,
    color: "#23150E",
    textAlign: "center",
    marginTop: 8,
  },
  rewardHero: {
    height: 230,
    marginTop: 6,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  wallet: {
    position: "absolute",
    width: 150,
    height: 120,
    right: 28,
    bottom: 22,
    transform: [{ rotate: "8deg" }],
  },
  pet: {
    width: 280,
    height: 215,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  stats: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 4,
  },
  stat: {
    flex: 1,
    minHeight: 82,
    borderRadius: 13,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E1DDDA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  statLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: "#796E68",
    textAlign: "center",
  },
  statValue: {
    marginTop: 6,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: "#28180F",
  },
  big: {
    fontFamily: fontFamily.bold,
    fontSize: 21,
    color: "#23150E",
    textAlign: "center",
    marginTop: 3,
  },
  body: {
    fontFamily: fontFamily.medium,
    color: "#5E514A",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 14,
  },
  donut: { alignItems: "center", marginVertical: 18 },
  note: {
    marginTop: 18,
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 16,
    color: "#7D716A",
    textAlign: "center",
  },
  bottom: { position: "absolute", left: 24, right: 24, bottom: 24 },
  distributionModalStage: { flex: 1, minHeight: 680, position: "relative" },
  dimmed: { opacity: 0.28 },
  modalShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(30,19,13,0.28)",
    marginHorizontal: -24,
    marginTop: -30,
  },
  goalModal: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 120,
    borderRadius: 22,
    backgroundColor: "#F7F7F7",
    padding: 20,
    shadowColor: "#24140B",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  goalModalTitle: {
    fontFamily: fontFamily.bold,
    color: "#23150E",
    fontSize: 23,
    lineHeight: 28,
    textAlign: "center",
  },
  goalModalText: {
    marginTop: 8,
    fontFamily: fontFamily.medium,
    color: "#695D56",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  goalRow: { gap: 10, paddingTop: 18, paddingBottom: 18, paddingRight: 10 },
  goalCard: {
    width: 138,
    minHeight: 170,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#DED9D5",
    backgroundColor: "#fff",
    padding: 9,
    alignItems: "center",
  },
  goalCardOn: { borderColor: "#3F7824", backgroundColor: "#EFF7EA" },
  goalImage: { width: 105, height: 100 },
  goalName: {
    fontFamily: fontFamily.bold,
    color: "#29190F",
    textAlign: "center",
    fontSize: 11,
  },
  goalMoney: {
    fontFamily: fontFamily.semiBold,
    color: "#765C49",
    fontSize: 10,
    marginTop: 4,
  },
  later: {
    fontFamily: fontFamily.bold,
    color: "#6D625B",
    textAlign: "center",
    textDecorationLine: "underline",
    marginTop: 14,
  },
  petGrowth: {
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  sparkles: {
    textAlign: "center",
    fontSize: 28,
    color: "#E5A124",
    marginTop: 16,
  },
});
