import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '@/game/store/gameStore';
import { showGameDialog } from '@/game/services/dialogService';
import { fontFamily } from '@/ui/theme';

type Props = { visible: boolean; onClose: () => void };
type Task = { id: string; title: string; reward: number; done: boolean };

const todayKey = () => new Date().toISOString().slice(0, 10);

export function TasksModal({ visible, onClose }: Props) {
  const activity = useGameStore((s) => s.dailyActivity);
  const lastRewardDate = useGameStore((s) => s.lastRewardDate);
  const claimed = useGameStore((s) => s.taskRewardsClaimed);
  const claimTaskReward = useGameStore((s) => s.claimTaskReward);
  const today = todayKey();
  const todayActivity = activity.date === today ? activity : { date: today, fed: 0, purchased: 0 };
  const tasks: Task[] = [
    { id: 'feed', title: 'Покорми Финни', reward: 10, done: todayActivity.fed > 0 },
    { id: 'shop', title: 'Купи продукт в магазине', reward: 10, done: todayActivity.purchased > 0 },
    { id: 'reward', title: 'Забери ежедневную награду', reward: 5, done: lastRewardDate === today },
  ];

  const claim = (task: Task) => {
    if (!task.done) return;
    const key = `${today}:${task.id}`;
    if (claimTaskReward(key, task.reward)) {
      onClose();
      setTimeout(() => showGameDialog(`+${task.reward} монет за задание «${task.title}».`, { title: 'Задание выполнено' }), 120);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.head}>
            <View><Text style={styles.title}>Задания на сегодня</Text><Text style={styles.subtitle}>Выполняй действия и забирай монетки</Text></View>
            <Pressable style={styles.close} onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
          </View>
          {tasks.map((task) => {
            const taskClaimed = claimed.includes(`${today}:${task.id}`);
            return (
              <View key={task.id} style={styles.taskRow}>
                <View style={[styles.status, task.done && styles.statusDone]}><Text style={styles.statusText}>{task.done ? '✓' : '·'}</Text></View>
                <View style={styles.taskCopy}><Text style={styles.taskTitle}>{task.title}</Text><Text style={styles.reward}>+{task.reward} ●</Text></View>
                <Pressable disabled={!task.done || taskClaimed} onPress={() => claim(task)} style={[styles.claim, (!task.done || taskClaimed) && styles.claimMuted]}>
                  <Text style={styles.claimText}>{taskClaimed ? 'Готово' : task.done ? 'Забрать' : 'В процессе'}</Text>
                </Pressable>
              </View>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(40,14,0,0.25)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card: { width: '100%', maxWidth: 372, borderRadius: 20, backgroundColor: '#F8F5F1', padding: 16, borderWidth: 2, borderColor: '#40200F', shadowColor: '#2A1105', shadowOffset: { width: 4, height: 5 }, shadowOpacity: 0.28, shadowRadius: 0, elevation: 8 },
  head: { minHeight: 54, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: fontFamily.bold, fontSize: 18, color: '#2A1105' },
  subtitle: { marginTop: 3, fontFamily: fontFamily.medium, fontSize: 11, color: '#766A61' },
  close: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 25, color: '#2A1105' },
  taskRow: { minHeight: 72, marginTop: 9, borderRadius: 14, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 10, gap: 9 },
  status: { width: 34, height: 34, borderRadius: 9, borderWidth: 2, borderColor: '#907C6D', alignItems: 'center', justifyContent: 'center' },
  statusDone: { borderColor: '#4C7A2C', backgroundColor: '#EDF3E8' },
  statusText: { fontFamily: fontFamily.bold, fontSize: 19, color: '#3E681F' },
  taskCopy: { flex: 1 },
  taskTitle: { fontFamily: fontFamily.semiBold, fontSize: 12, color: '#2A1105' },
  reward: { marginTop: 4, fontFamily: fontFamily.bold, fontSize: 11, color: '#C48200' },
  claim: { minWidth: 72, height: 34, paddingHorizontal: 8, borderRadius: 9, backgroundColor: '#3B1606', alignItems: 'center', justifyContent: 'center' },
  claimMuted: { backgroundColor: '#B8ADA5' },
  claimText: { fontFamily: fontFamily.bold, fontSize: 10, color: '#fff' },
});
