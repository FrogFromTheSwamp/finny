import happy from "@/assets/game/characters/pet-brown-eating-hd.png";
import piggy from "@/assets/learning/savings/piggy-bank.png";
import { FinnyButton } from "@/components/FinnyButton";
import { BudgetDonut, PlanSliders } from "@/features/budget/BudgetControls";
import { GOAL_TEMPLATE_BY_ID } from "@/features/goals/catalog";
import { CHAPTER_BY_ID, type ChapterId } from "@/features/learning/content";
import { useGameStore, type BudgetPlan } from "@/game/store/gameStore";
import { fontFamily } from "@/ui/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

export default function ChapterCompleteScreen() {
  const router = useRouter();
  const { chapter: chapterParam } = useLocalSearchParams<{ chapter: string }>();
  const chapterId = String(chapterParam) as ChapterId;
  const chapter = CHAPTER_BY_ID[chapterId];
  const claimed = useGameStore((s) =>
    s.claimedChapterRewards.includes(chapterId),
  );
  const claim = useGameStore((s) => s.claimChapterReward);
  const storedPlan = useGameStore((s) => s.budgetPlan);
  const savePlan = useGameStore((s) => s.setBudgetPlan);
  const goals = useGameStore(
    useShallow((s) =>
      s.goals.filter((g) => !g.purchasedAt && g.saved < g.target),
    ),
  );
  const depositGoal = useGameStore((s) => s.depositGoal);
  const milestones = useGameStore((s) => s.milestonesSeen);
  const markSeen = useGameStore((s) => s.markMilestoneSeen);
  const distributionKey = `chapter-distribution-${chapterId}`;
  const alreadyDistributed = milestones.includes(distributionKey);
  const [stage, setStage] = useState(claimed ? 2 : 0);
  const [plan, setPlan] = useState<BudgetPlan>(storedPlan);
  const [selectedGoal, setSelectedGoal] = useState(goals[0]?.id ?? "");
  if (!chapter) return null;
  const savedPart = Math.max(0, Math.round((60 * plan.save) / 100));
  const finish = () => router.replace("/(tabs)/learn");
  const next = () => {
    if (stage === 0) return setStage(1);
    if (stage === 1) {
      if (!claimed) claim(chapterId);
      return setStage(2);
    }
    if (stage === 2) {
      savePlan(plan);
      if (goals.length && savedPart > 0 && !alreadyDistributed)
        return setStage(3);
      return finish();
    }
    if (selectedGoal && savedPart > 0) depositGoal(selectedGoal, savedPart);
    markSeen(distributionKey);
    finish();
  };
  return (
    <SafeAreaView style={styles.root}>
      {stage === 0 ? (
        <>
          <Text style={styles.kicker}>Глава завершена</Text>
          <Text style={styles.title}>{chapter.title}</Text>
          <Image source={happy} style={styles.hero} resizeMode="contain" />
          <Text style={styles.big}>Отличная работа!</Text>
          <Text style={styles.body}>
            Ты прошёл все 4 урока главы. Теперь знания можно применить в копилке
            и следующих заданиях.
          </Text>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>4/4 урока</Text>
            <Text style={styles.summaryText}>+60 🟡</Text>
            <Text style={styles.summaryText}>+60 XP</Text>
          </View>
        </>
      ) : null}
      {stage === 1 ? (
        <>
          <Text style={styles.kicker}>Награда за главу</Text>
          <Text style={styles.title}>Забери финники</Text>
          <Image source={piggy} style={styles.hero} resizeMode="contain" />
          <Text style={styles.reward}>+60 🟡</Text>
          <Text style={styles.body}>
            Часть награды можно распределить на обязательное, желания и
            накопления.
          </Text>
        </>
      ) : null}
      {stage === 2 ? (
        <>
          <Text style={styles.kicker}>План расходов</Text>
          <Text style={styles.title}>Как распределим бюджет?</Text>
          <View style={styles.donut}>
            <BudgetDonut plan={plan} size={172} />
          </View>
          <PlanSliders plan={plan} onChange={setPlan} />
          <Text style={styles.note}>
            Серые отметки показывают ориентир 50 / 30 / 20. В «Отложу» сейчас
            попадает {savedPart} из 60 монет награды.
          </Text>
        </>
      ) : null}
      {stage === 3 ? (
        <>
          <Text style={styles.kicker}>Отложу · {savedPart} 🟡</Text>
          <Text style={styles.title}>На какую цель?</Text>
          <Text style={styles.body}>
            Выбери цель — эта часть награды сразу попадёт в её копилку. Можно
            нажать «Позже», тогда монеты останутся на общем балансе.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.goalRow}
          >
            {goals.map((goal) => (
              <Pressable
                key={goal.id}
                onPress={() => setSelectedGoal(goal.id)}
                style={[
                  styles.goalCard,
                  selectedGoal === goal.id && styles.goalCardOn,
                ]}
              >
                <Image
                  source={GOAL_TEMPLATE_BY_ID[goal.templateId].image}
                  style={styles.goalImage}
                  resizeMode="contain"
                />
                <Text style={styles.goalName}>{goal.name}</Text>
                <Text style={styles.goalMoney}>
                  {goal.saved}/{goal.target} 🟡
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            onPress={() => {
              markSeen(distributionKey);
              finish();
            }}
          >
            <Text style={styles.later}>Позже</Text>
          </Pressable>
        </>
      ) : null}
      <View style={styles.bottom}>
        <FinnyButton
          label={
            stage === 0
              ? "Продолжить"
              : stage === 1
                ? claimed
                  ? "Дальше"
                  : "Забрать финники"
                : stage === 2
                  ? "Сохранить план"
                  : "Отложить на цель"
          }
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 24,
    paddingTop: 32,
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
    fontSize: 28,
    color: "#23150E",
    textAlign: "center",
    marginTop: 8,
  },
  hero: { width: 230, height: 210, alignSelf: "center", marginTop: 22 },
  big: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: "#23150E",
    textAlign: "center",
    marginTop: 4,
  },
  body: {
    fontFamily: fontFamily.medium,
    color: "#5E514A",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 10,
  },
  summary: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  summaryText: {
    fontFamily: fontFamily.bold,
    color: "#2B1B13",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  reward: {
    fontFamily: fontFamily.bold,
    fontSize: 36,
    color: "#C47A00",
    textAlign: "center",
    marginTop: 4,
  },
  donut: { alignItems: "center", marginVertical: 14 },
  note: {
    marginTop: 20,
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 16,
    color: "#7D716A",
    textAlign: "center",
  },
  bottom: { position: "absolute", left: 24, right: 24, bottom: 24 },
  goalRow: { gap: 12, paddingTop: 26, paddingBottom: 14, paddingRight: 15 },
  goalCard: {
    width: 155,
    minHeight: 190,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#DED9D5",
    backgroundColor: "#fff",
    padding: 10,
    alignItems: "center",
  },
  goalCardOn: { borderColor: "#3F7824", backgroundColor: "#EFF7EA" },
  goalImage: { width: 118, height: 112 },
  goalName: {
    fontFamily: fontFamily.bold,
    color: "#29190F",
    textAlign: "center",
    fontSize: 12,
  },
  goalMoney: {
    fontFamily: fontFamily.semiBold,
    color: "#765C49",
    fontSize: 11,
    marginTop: 4,
  },
  later: {
    fontFamily: fontFamily.bold,
    color: "#6D625B",
    textAlign: "center",
    textDecorationLine: "underline",
    marginTop: 12,
  },
});
