import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import fire from '@/assets/game/ui/streak-fire.png';
import { useGameStore } from '@/game/store/gameStore';
import { showGameDialog } from '@/game/services/dialogService';
import { fontFamily } from '@/ui/theme';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function DailyRewardModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const streak = useGameStore((s) => s.streakDays);
  const canClaim = useGameStore((s) => s.canClaimDailyReward());
  const claim = useGameStore((s) => s.claimDailyReward);
  const claimReward = () => {
    const amount = claim();
    onClose();
    if (amount) showGameDialog(`+${amount} монет! Серия входов продолжается.`, { title: 'Награда получена' });
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Pressable style={styles.close} onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
          <View style={styles.fireWrap}><Image source={fire} style={styles.fire} resizeMode="contain" /><Text style={styles.streak}>{streak}</Text></View>
          <View style={styles.weekRow}>
            {DAYS.map((day, index) => {
              const completed = index < Math.min(7, Math.max(0, streak - (canClaim ? 0 : 1)));
              return <View key={day} style={styles.dayCol}><Text style={styles.dayLabel}>{day}</Text><View style={[styles.dot, completed && styles.dotDone]}>{completed ? <Text style={styles.tick}>✓</Text> : null}</View></View>;
            })}
          </View>
          <View style={styles.rewardRow}><Text style={styles.rewardTitle}>Ежедневная награда</Text><Text style={styles.rewardValue}>+25 <Text style={styles.coin}>●</Text></Text></View>
          <Pressable disabled={!canClaim} style={[styles.cta, !canClaim && styles.ctaDisabled]} onPress={claimReward}><Text style={styles.ctaText}>{canClaim ? 'Погнали дальше!' : 'Награда уже получена'}</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(40,14,0,0.25)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#F7F4F1', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34, minHeight: 420 },
  close: { position: 'absolute', right: 14, top: 10, zIndex: 3, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: fontFamily.bold, fontSize: 26, color: '#3B1606', lineHeight: 28 },
  fireWrap: { height: 140, alignItems: 'center', justifyContent: 'center' },
  fire: { width: 105, height: 115 },
  streak: { position: 'absolute', bottom: 28, fontFamily: fontFamily.bold, color: '#9D360C', fontSize: 28 },
  weekRow: { backgroundColor: '#fff', borderRadius: 14, padding: 11, flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 }, dayLabel: { fontFamily: fontFamily.medium, color: '#4F433C', fontSize: 12 },
  dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#EEE5DB', alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: '#E9E4D0' }, tick: { color: '#5B7D37', fontFamily: fontFamily.bold },
  rewardRow: { marginTop: 12, height: 58, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rewardTitle: { fontFamily: fontFamily.bold, color: '#2A1105', fontSize: 14 }, rewardValue: { fontFamily: fontFamily.semiBold, color: '#2A1105' }, coin: { color: '#F2A900' },
  cta: { marginTop: 16, height: 52, borderRadius: 12, backgroundColor: '#3B1606', alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { opacity: 0.45 }, ctaText: { fontFamily: fontFamily.bold, color: '#fff', fontSize: 15 },
});
