import fireIcon from "@/assets/library/ui/icons/fire-solid.png";
import settingsIcon from "@/assets/library/ui/icons/settings-alt.png";
import bookIcon from "@/assets/library/ui/icons/book-open.png";
import { AnimatedNumber } from "@/game/components/AnimatedNumber";
import { HungerMeter } from "@/game/components/HungerMeter";
import { TasksModal } from "@/game/components/TasksModal";
import { useGameStore } from "@/game/store/gameStore";
import { fontFamily } from "@/ui/theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

function LevelBadge({ value, xp }: { value: number; xp: number }) {
  const r = 25;
  const circumference = 2 * Math.PI * r;
  const progress = ((Math.max(0, xp) % 100) / 100);
  return (
    <View style={styles.levelBadge}>
      <Svg
        width={58}
        height={58}
        style={StyleSheet.absoluteFill}
        viewBox="0 0 58 58"
      >
        <Circle
          cx="29"
          cy="29"
          r={r}
          stroke="#5C4B3D"
          strokeWidth="2"
          fill="#FFFFFF"
        />
        <Circle
          cx="29"
          cy="29"
          r={r}
          stroke="#3F771A"
          strokeWidth="6"
          fill="none"
          strokeDasharray={`${circumference * progress} ${circumference}`}
          strokeLinecap="butt"
          transform="rotate(-92 29 29)"
        />
      </Svg>
      <AnimatedNumber value={value} style={styles.levelText} />
    </View>
  );
}

export function GameHud({ showHunger = true }: { showHunger?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tasksOpen, setTasksOpen] = useState(false);
  const coins = useGameStore((s) => s.coins);
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streakDays);
  const hunger = useGameStore((s) => s.hunger);
  return (
    <View
      pointerEvents="box-none"
      style={[styles.layer, { paddingTop: Math.max(insets.top + 8, 50) }]}
    >
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          <LevelBadge value={level} xp={xp} />
          <View style={styles.coinBadge}>
            <AnimatedNumber value={coins} style={styles.number} />
            <View style={styles.coinDot} />
          </View>
        </View>
        <View style={styles.topTools}>
          <Pressable
            style={styles.fireButton}
            onPress={() => router.navigate("/streak")}
            accessibilityLabel={`Серия входов: ${streak}`}
          >
            <Image source={fireIcon} style={styles.fire} resizeMode="contain" />
            <Text style={styles.fireText}>{streak}</Text>
          </Pressable>
          <Pressable
            style={styles.settings}
            onPress={() => router.navigate("/settings")}
            accessibilityLabel="Настройки"
          >
            <Image source={settingsIcon} style={styles.settingsIcon} resizeMode="contain" />
          </Pressable>
        </View>
      </View>
      {showHunger ? (
        <View style={styles.side}>
          <HungerMeter value={hunger} />
          <Pressable
            style={styles.tasks}
            onPress={() => setTasksOpen(true)}
            accessibilityLabel="Задания"
          >
            <Image source={bookIcon} style={styles.taskBook} resizeMode="contain" />
          </Pressable>
        </View>
      ) : null}
      <TasksModal visible={tasksOpen} onClose={() => setTasksOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, zIndex: 20, paddingHorizontal: 16 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftGroup: { flexDirection: "row", gap: 8, alignItems: "center" },
  levelBadge: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  levelText: { fontFamily: fontFamily.bold, fontSize: 18, color: "#2A1105" },
  coinBadge: {
    height: 54,
    minWidth: 72,
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowColor: "#534122",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  number: { fontFamily: fontFamily.medium, color: "#2A1105", fontSize: 16 },
  coinDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFB600",
  },
  topTools: {
    width: 116,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#534122",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  fireButton: {
    width: 52,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  fire: { width: 42, height: 42 },
  fireText: {
    position: "absolute",
    fontFamily: fontFamily.bold,
    color: "#fff",
    fontSize: 14,
    top: 17,
  },
  settingsIcon: { width: 32, height: 32 },
  settings: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  side: {
    position: "absolute",
    right: 16,
    top: "40%",
    gap: 8,
    alignItems: "center",
  },
  taskBook: { width: 34, height: 34 },
  tasks: {
    width: 54,
    height: 54,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#534122",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
});
