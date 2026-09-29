import closeIcon from '@/assets/library/ui/icons/close.png';
import dayActive from '@/assets/library/ui/calendar/day-active.png';
import dayCompleted from '@/assets/library/ui/calendar/day-completed.png';
import dayDefault from '@/assets/library/ui/calendar/day-default.png';
import fire from '@/assets/library/ui/effects/streak-fire.png';
import { useGameStore } from '@/game/store/gameStore';
import { fontFamily } from '@/ui/theme';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const localDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const yesterdayKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onClaimed?: () => void;
  mandatory?: boolean;
};

export function DailyRewardModal({ visible, onClose, onClaimed, mandatory = false }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const streak = useGameStore((s) => s.streakDays);
  const lastRewardDate = useGameStore((s) => s.lastRewardDate);
  const canClaim = useGameStore((s) => s.canClaimDailyReward());
  const claim = useGameStore((s) => s.claimDailyReward);
  const continuesSeries = lastRewardDate === yesterdayKey();
  const displayStreak = canClaim ? (continuesSeries ? streak + 1 : 1) : Math.max(1, streak);
  const completedDays = canClaim ? (continuesSeries ? Math.min(6, Math.max(0, streak)) : 0) : Math.min(7, Math.max(0, streak));
  const activeDay = canClaim ? Math.min(6, completedDays) : -1;

  const claimReward = () => {
    const amount = claim();
    if (amount) onClaimed?.();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { if (!mandatory) onClose(); }}>
      <View style={styles.backdrop}>
        <ScrollView style={[styles.sheet, { maxHeight: height * 0.86 }]} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 18 }} bounces={false} showsVerticalScrollIndicator={false}>
          {!mandatory ? (
            <Pressable style={styles.close} onPress={onClose} accessibilityLabel="Закрыть"><Image source={closeIcon} style={styles.closeIcon} resizeMode="contain" /></Pressable>
          ) : null}

          <Text style={styles.title}>Заходи каждый день</Text>
          <Text style={styles.subtitle}>Серия входов растёт, а сегодня тебя ждут 10 монет.</Text>
          <View style={styles.fireWrap}>
            <Image source={fire} style={styles.fire} resizeMode="contain" />
            <Text style={styles.streak}>{displayStreak}</Text>
          </View>

          <View style={styles.weekCard}>
            <View style={styles.weekRow}>
              {DAYS.map((day, index) => {
                const source = index < completedDays ? dayCompleted : index === activeDay ? dayActive : dayDefault;
                return (
                  <View key={day} style={styles.dayCol}>
                    <Text style={styles.dayLabel}>{day}</Text>
                    <Image source={source} style={styles.dayState} resizeMode="contain" />
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.rewardRow}>
            <View><Text style={styles.rewardTitle}>Награда за сегодня</Text><Text style={styles.rewardSub}>Добавится на общий баланс</Text></View>
            <Text style={styles.rewardValue}>+10 <Text style={styles.coin}>●</Text></Text>
          </View>

          <Pressable disabled={!canClaim} style={[styles.cta, !canClaim && styles.ctaDisabled]} onPress={claimReward}>
            <Text style={styles.ctaText}>{canClaim ? 'Забрать награду' : 'Награда уже получена'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(40,14,0,0.30)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#F3F1EF', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 22 },
  close: { position: 'absolute', right: 14, top: 12, zIndex: 3, width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  closeIcon: { width: 22, height: 22 },
  title: { fontFamily: fontFamily.bold, color: '#2A160A', fontSize: 24, textAlign: 'center' },
  subtitle: { fontFamily: fontFamily.medium, color: '#776A62', fontSize: 12, lineHeight: 17, textAlign: 'center', paddingHorizontal: 34, marginTop: 6 },
  fireWrap: { height: 112, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  fire: { width: 92, height: 100 },
  streak: { position: 'absolute', bottom: 20, fontFamily: fontFamily.bold, color: '#9D360C', fontSize: 26 },
  weekCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 8, paddingVertical: 10 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4 },
  dayLabel: { fontFamily: fontFamily.medium, color: '#55483F', fontSize: 10 },
  dayState: { width: 38, height: 38 },
  rewardRow: { marginTop: 12, minHeight: 62, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rewardTitle: { fontFamily: fontFamily.bold, color: '#2A1105', fontSize: 14 },
  rewardSub: { fontFamily: fontFamily.medium, color: '#81736B', fontSize: 10, marginTop: 2 },
  rewardValue: { fontFamily: fontFamily.bold, color: '#2A1105', fontSize: 19 },
  coin: { color: '#F2A900' },
  cta: { marginTop: 16, height: 52, borderRadius: 12, backgroundColor: '#3B1606', alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { fontFamily: fontFamily.bold, color: '#fff', fontSize: 15 },
});
