import dayActive from "@/assets/library/ui/calendar/day-active.png";
import dayCompleted from "@/assets/library/ui/calendar/day-completed.png";
import dayDefault from "@/assets/library/ui/calendar/day-default.png";
import fire from "@/assets/library/ui/effects/streak-fire.png";
import closeIcon from "@/assets/library/ui/icons/close.png";
import { useGameStore } from "@/game/store/gameStore";
import { fontFamily } from "@/ui/theme";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const localDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const yesterdayKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
};

const getRewardDates = (lastRewardDate: string, streak: number) => {
  const dates = new Set<string>();
  if (!lastRewardDate) return dates;

  const lastDate = new Date(`${lastRewardDate}T00:00:00`);
  if (Number.isNaN(lastDate.getTime())) return dates;

  for (let offset = 0; offset < Math.min(Math.max(streak, 1), 7); offset += 1) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() - offset);
    dates.add(localDateKey(date));
  }

  return dates;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onClaimed?: () => void;
  mandatory?: boolean;
};

export function DailyRewardModal({
  visible,
  onClose,
  onClaimed,
  mandatory = false,
}: Props) {
  const streak = useGameStore((s) => s.streakDays);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const lastRewardDate = useGameStore((s) => s.lastRewardDate);
  const canClaim = useGameStore((s) => s.canClaimDailyReward());
  const claim = useGameStore((s) => s.claimDailyReward);
  const continuesSeries = lastRewardDate === yesterdayKey();
  const displayStreak = canClaim
    ? continuesSeries
      ? streak + 1
      : 1
    : Math.max(1, streak);
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7;
  const todayKey = localDateKey(today);
  const rewardDates = getRewardDates(lastRewardDate, streak);

  const claimReward = () => {
    const amount = claim();
    if (amount) onClaimed?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!mandatory) onClose();
      }}
    >
      <View style={styles.backdrop}>
        <ScrollView
          style={[styles.sheet, { maxHeight: height * 0.86 }]}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 16) + 18,
          }}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {!mandatory ? (
            <Pressable
              style={styles.close}
              onPress={onClose}
              accessibilityLabel="Закрыть"
            >
              <Image
                source={closeIcon}
                style={styles.closeIcon}
                resizeMode="contain"
              />
            </Pressable>
          ) : null}

          <View style={styles.fireWrap}>
            <Image source={fire} style={styles.fire} resizeMode="contain" />
            <Text style={styles.streak}>{displayStreak}</Text>
          </View>

          <View style={styles.weekCard}>
            <View style={styles.weekRow}>
              {DAYS.map((day, index) => {
                const date = new Date(today);
                date.setDate(today.getDate() + index - todayIndex);
                const isToday = index === todayIndex;
                const isCompleted = rewardDates.has(localDateKey(date));
                const source = isToday
                  ? dayActive
                  : isCompleted
                    ? dayCompleted
                    : dayDefault;
                return (
                  <View key={day} style={styles.dayCol}>
                    <Text style={styles.dayLabel}>{day}</Text>
                    <View style={styles.dayIconWrap}>
                      <Image
                        source={source}
                        style={styles.dayState}
                        resizeMode="contain"
                      />
                      {isToday ? (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.rewardRow}>
            <Text style={styles.rewardTitle}>Ежедневная награда</Text>
            <Text style={styles.rewardValue}>
              +10 <Text style={styles.coin}>●</Text>
            </Text>
          </View>

          <Pressable
            disabled={!canClaim}
            style={[styles.cta, !canClaim && styles.ctaDisabled]}
            onPress={claimReward}
          >
            <Text style={styles.ctaText}>
              {canClaim ? "Забрать награду" : "Награда уже получена"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(40,14,0,0.30)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#F3F1EF",
    borderRadius: 24,
    padding: 16,
  },
  close: {
    position: "absolute",
    right: 14,
    top: 12,
    zIndex: 3,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: { width: 22, height: 22 },
  fireWrap: {
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  fire: { width: "80%", height: "100%" },
  streak: {
    position: "absolute",
    bottom: 55,
    fontFamily: fontFamily.bold,
    color: "#000000",
    fontSize: 26,
  },
  weekCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
  },
  dayCol: {
    width: 30,
    alignItems: "center",
    gap: 5,
  },
  dayLabel: {
    fontFamily: fontFamily.medium,
    color: "#55483F",
    fontSize: 10,
  },
  dayIconWrap: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  dayState: {
    width: 34,
    height: 34,
  },
  checkBadge: {
    position: "absolute",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: "#4B7A2C",
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fontFamily.bold,
  },
  rewardRow: {
    marginTop: 12,
    minHeight: 62,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  rewardTitle: {
    fontFamily: fontFamily.bold,
    color: "#2A1105",
    fontSize: 14,
    flexShrink: 1,
  },
  rewardValue: {
    fontFamily: fontFamily.bold,
    color: "#2A1105",
    fontSize: 19,
  },
  coin: { color: "#F2A900" },
  cta: {
    marginTop: 16,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#3B1606",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: {
    fontFamily: fontFamily.bold,
    color: "#fff",
    fontSize: 15,
  },
});
