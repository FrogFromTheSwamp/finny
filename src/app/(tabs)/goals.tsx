import piggy from '@/assets/learning/savings/piggy-bank.png';
import { GOAL_TEMPLATE_BY_ID } from '@/features/goals/catalog';
import { GameHud } from '@/game/components/GameHud';
import { useGameStore } from '@/game/store/gameStore';
import { fontFamily } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { showGameDialog } from '@/game/services/dialogService';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function GoalsScreen() {
  const router = useRouter();
  const goals = useGameStore((s) => s.goals);
  const transactions = useGameStore((s) => s.transactions);
  const completedChapters = useGameStore((s) => s.completedChapters);
  const milestonesSeen = useGameStore((s) => s.milestonesSeen);
  const markMilestoneSeen = useGameStore((s) => s.markMilestoneSeen);
  const totalSaved = goals.filter((g) => !g.purchasedAt).reduce((sum,g) => sum + g.saved, 0);
  const activeGoals = goals.filter((g) => !g.purchasedAt);
  const planUnlocked = completedChapters.includes('budget');
  useEffect(() => {
    if (!goals.length || milestonesSeen.includes('first-goal')) return;
    markMilestoneSeen('first-goal');
    showGameDialog('Поздравляем! Ты добавил первую финансовую цель. Пополняй её понемногу — прогресс сохранится.', { title: 'Первая цель!' });
  }, [goals.length, milestonesSeen, markMilestoneSeen]);
  return <View style={styles.root}>
    <GameHud showHunger={false}/>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Копилка</Text>
      <View style={styles.walletCard}>
        <Image source={piggy} style={styles.piggy} resizeMode="contain"/>
        <View style={styles.walletInfo}><Text style={styles.walletLabel}>В целях накоплено</Text><Text style={styles.walletValue}>{totalSaved} 🟡</Text><Text style={styles.walletHint}>Пополняй цели из общего баланса Финни.</Text></View>
      </View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Цели</Text><Pressable onPress={() => router.push('/goal-editor')}><Text style={styles.link}>+ Добавить</Text></Pressable></View>
      {activeGoals.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalRow}>
        {activeGoals.map((goal) => {
          const template = GOAL_TEMPLATE_BY_ID[goal.templateId];
          const pct = Math.min(100, Math.round(goal.saved / goal.target * 100));
          return <Pressable key={goal.id} onPress={() => router.push({ pathname: '/goal-detail', params: { id: goal.id } })} style={styles.goalCard}>
            <Image source={template.image} style={styles.goalImage} resizeMode="contain"/>
            <Text style={styles.goalName} numberOfLines={2}>{goal.name}</Text>
            <Text style={styles.goalMoney}>{goal.saved} из {goal.target} 🟡</Text>
            <View style={styles.progress}><View style={[styles.progressFill,{ width: `${pct}%` }]} /></View>
          </Pressable>;
        })}
      </ScrollView> : <Pressable onPress={() => router.push('/goal-editor')} style={styles.emptyGoal}><Text style={styles.emptyPlus}>＋</Text><Text style={styles.emptyTitle}>Добавь первую цель</Text><Text style={styles.emptyText}>Выбери вещь и начни копить на неё небольшими шагами.</Text></Pressable>}

      <Text style={styles.sectionTitle}>Инструменты</Text>
      <Pressable disabled={!planUnlocked} onPress={() => router.push('/budget-plan')} style={[styles.toolCard,!planUnlocked && styles.toolLocked]}>
        <View style={[styles.toolIcon,{ backgroundColor: '#F8AE28' }]}><Text style={styles.toolEmoji}>◔</Text></View><View style={styles.toolText}><Text style={styles.toolTitle}>План расходов</Text><Text style={styles.toolSub}>{planUnlocked ? 'Настрой доли «Нужно / Хочу / Отложу»' : 'Откроется после главы «Бюджет»'}</Text></View><Text style={styles.chev}>›</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/history')} style={styles.toolCard}>
        <View style={[styles.toolIcon,{ backgroundColor: '#4E82DB' }]}><Text style={styles.toolEmoji}>↻</Text></View><View style={styles.toolText}><Text style={styles.toolTitle}>История покупок</Text><Text style={styles.toolSub}>{transactions.length ? `${transactions.length} операций · последняя: ${transactions[0]?.title}` : 'Здесь появятся покупки, награды и накопления'}</Text></View><Text style={styles.chev}>›</Text>
      </Pressable>
      {goals.some((g) => g.purchasedAt) ? <View style={styles.bought}><Text style={styles.sectionTitle}>Куплено благодаря накоплениям</Text>{goals.filter((g)=>g.purchasedAt).map((g)=><View key={g.id} style={styles.boughtRow}><Image source={GOAL_TEMPLATE_BY_ID[g.templateId].image} style={styles.boughtImg} resizeMode="contain"/><Text style={styles.boughtText}>{g.name}</Text><Text style={styles.done}>✓</Text></View>)}</View> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F2' }, content: { paddingTop: 126, paddingHorizontal: 16, paddingBottom: 130 }, title: { fontFamily: fontFamily.bold, fontSize: 30, color: '#2B170B', marginBottom: 14 },
  walletCard: { minHeight: 156, borderRadius: 16, backgroundColor: '#1764B4', flexDirection: 'row', alignItems: 'center', padding: 16, overflow: 'hidden' }, piggy: { width: 120, height: 120 }, walletInfo: { flex: 1, paddingLeft: 6 }, walletLabel: { fontFamily: fontFamily.medium, color: '#DCEBFA', fontSize: 12 }, walletValue: { fontFamily: fontFamily.bold, color: '#fff', fontSize: 30, marginTop: 3 }, walletHint: { fontFamily: fontFamily.medium, color: '#fff', fontSize: 11, lineHeight: 15, marginTop: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 10 }, sectionTitle: { fontFamily: fontFamily.bold, fontSize: 18, color: '#28170E', marginTop: 22, marginBottom: 10 }, sectionHeaderTitle: {}, link: { fontFamily: fontFamily.bold, color: '#1764B4', marginTop: 22 },
  goalRow: { gap: 12, paddingRight: 12 }, goalCard: { width: 178, minHeight: 218, borderRadius: 15, backgroundColor: '#fff', padding: 12, borderWidth: 1, borderColor: '#E2DEDB' }, goalImage: { width: '100%', height: 118 }, goalName: { fontFamily: fontFamily.bold, fontSize: 14, color: '#2A1B13', minHeight: 35 }, goalMoney: { fontFamily: fontFamily.semiBold, color: '#745B49', fontSize: 11, marginTop: 5 }, progress: { height: 8, borderRadius: 4, backgroundColor: '#E6E1DD', marginTop: 9, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: '#F4A91D' },
  emptyGoal: { minHeight: 175, borderRadius: 15, backgroundColor: '#fff', borderWidth: 2, borderColor: '#D7D0CB', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', padding: 20 }, emptyPlus: { fontFamily: fontFamily.medium, fontSize: 35, color: '#1764B4' }, emptyTitle: { fontFamily: fontFamily.bold, fontSize: 16, color: '#2A1B13' }, emptyText: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 17, color: '#7A6D65', textAlign: 'center', marginTop: 5 },
  toolCard: { minHeight: 86, borderRadius: 14, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E1DDDA' }, toolLocked: { opacity: .5 }, toolIcon: { width: 54, height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, toolEmoji: { fontSize: 25, color: '#fff', fontFamily: fontFamily.bold }, toolText: { flex: 1, paddingHorizontal: 12 }, toolTitle: { fontFamily: fontFamily.bold, color: '#2A1A11', fontSize: 14 }, toolSub: { fontFamily: fontFamily.medium, color: '#80736C', fontSize: 11, lineHeight: 15, marginTop: 4 }, chev: { fontSize: 32, color: '#8B7D74' },
  bought: { marginTop: 2 }, boughtRow: { minHeight: 64, borderRadius: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginBottom: 8 }, boughtImg: { width: 52, height: 52 }, boughtText: { flex: 1, fontFamily: fontFamily.semiBold, color: '#2A1B13', paddingHorizontal: 8 }, done: { color: '#3E7B24', fontFamily: fontFamily.bold, fontSize: 20 },
});
