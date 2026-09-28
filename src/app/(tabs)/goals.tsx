import piggy from '@/assets/library/learning/items/piggy-bank-5.png';
import partyHat from '@/assets/library/wardrobe/items/blue-dotted-hat.png';
import { GOAL_TEMPLATE_BY_ID } from '@/features/goals/catalog';
import { GameHud } from '@/game/components/GameHud';
import { useGameStore } from '@/game/store/gameStore';
import { fontFamily } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function GoalsScreen() {
  const router = useRouter();
  const goals = useGameStore((s) => s.goals);
  const transactions = useGameStore((s) => s.transactions);
  const completedChapters = useGameStore((s) => s.completedChapters);
  const tutorialStage = useGameStore((s) => s.tutorialStage);
  const setTutorialStage = useGameStore((s) => s.setTutorialStage);
  const milestonesSeen = useGameStore((s) => s.milestonesSeen);
  const markMilestoneSeen = useGameStore((s) => s.markMilestoneSeen);
  const purchaseGoal = useGameStore((s) => s.purchaseGoal);
  const coins = useGameStore((s) => s.coins);
  const piggyBalance = useGameStore((s) => s.piggy);
  const depositPiggy = useGameStore((s) => s.depositPiggy);
  const withdrawPiggy = useGameStore((s) => s.withdrawPiggy);
  const [firstGoalOpen, setFirstGoalOpen] = useState(false);
  const [goalReadyOpen, setGoalReadyOpen] = useState(false);
  const [transfer, setTransfer] = useState<'in' | 'out' | null>(null);
  const [amountText, setAmountText] = useState('');
  const [transferError, setTransferError] = useState('');
  const activeGoals = goals.filter((g) => !g.purchasedAt);
  const planUnlocked = completedChapters.includes('budget');
  const readyHatGoal = useMemo(() => activeGoals.find((g) => g.templateId === 'party-hat' && piggyBalance >= g.target), [activeGoals, piggyBalance]);

  useEffect(() => {
    if (tutorialStage === 7 && goals.some((g) => g.templateId === 'party-hat')) setFirstGoalOpen(true);
  }, [tutorialStage, goals]);

  useEffect(() => {
    if (readyHatGoal && !milestonesSeen.includes('party-hat-ready') && tutorialStage >= 8) setGoalReadyOpen(true);
  }, [readyHatGoal, milestonesSeen, tutorialStage]);

  const goToFirstLesson = () => {
    setFirstGoalOpen(false);
    setTutorialStage(8);
    router.push({ pathname: '/lesson/[id]', params: { id: 'budget-1' } });
  };

  const openTransfer = (kind: 'in' | 'out') => {
    setTransfer(kind);
    setAmountText('');
    setTransferError('');
  };

  const submitTransfer = () => {
    const value = Math.round(Number(amountText));
    const ok = transfer === 'in' ? depositPiggy(value) : transfer === 'out' ? withdrawPiggy(value) : false;
    if (!ok) {
      setTransferError(transfer === 'in' ? 'На счёте нет такой суммы.' : 'В копилке нет такой суммы.');
      return;
    }
    setTransfer(null);
  };

  const tryHat = () => {
    if (readyHatGoal) purchaseGoal(readyHatGoal.id);
    markMilestoneSeen('party-hat-ready');
    setGoalReadyOpen(false);
    router.replace('/(tabs)/shop');
  };

  return (
    <View style={styles.root}>
      <GameHud showHunger={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Копилка</Text>
        <View style={styles.walletCard}>
          <Image source={piggy} style={styles.piggy} resizeMode="contain" />
          <View style={styles.walletRight}>
            <Text style={styles.walletValue}>{piggyBalance} <Text style={styles.coin}>●</Text></Text>
            <Text style={styles.walletAccount}>На счёте {coins} ●</Text>
            <View style={styles.walletActions}>
              <Pressable style={styles.walletButton} onPress={() => openTransfer('in')}><Text style={styles.walletButtonText}>↑ Пополнить</Text></Pressable>
              <Pressable style={styles.walletButton} onPress={() => openTransfer('out')}><Text style={styles.walletButtonText}>↓ Снять</Text></Pressable>
            </View>
          </View>
        </View>

        <Pressable disabled={!planUnlocked} onPress={() => router.push('/budget-plan')} style={[styles.simpleRow, !planUnlocked && styles.locked]}>
          <View style={styles.planBars}><View style={[styles.planBar, { height: 24, backgroundColor: '#F8AE28' }]} /><View style={[styles.planBar, { height: 18, backgroundColor: '#D52C7D' }]} /><View style={[styles.planBar, { height: 12, backgroundColor: '#4E82DB' }]} /></View>
          <View style={styles.simpleText}><Text style={styles.simpleTitle}>План расходов</Text><Text style={styles.simpleSub}>{planUnlocked ? 'Нужно · Хочу · Отложу' : 'Откроется после первой главы'}</Text></View><Text style={styles.chev}>›</Text>
        </Pressable>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Цели</Text><Pressable style={styles.addButton} onPress={() => router.push('/goal-editor')}><Text style={styles.addButtonText}>Добавить цель</Text></Pressable></View>
        {activeGoals.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalRow}>
            {activeGoals.map((goal) => {
              const template = GOAL_TEMPLATE_BY_ID[goal.templateId];
              const affordable = piggyBalance >= goal.target;
              const pct = Math.min(100, Math.round((piggyBalance / goal.target) * 100));
              return <Pressable key={goal.id} onPress={() => router.push({ pathname: '/goal-detail', params: { id: goal.id } })} style={styles.goalCard}>
                <Image source={template.image} style={styles.goalImage} resizeMode="contain" />
                <View style={styles.goalInfo}><Text style={styles.goalName} numberOfLines={2}>{goal.name}</Text><Text style={styles.goalMoney}>{goal.target} <Text style={styles.coin}>●</Text></Text><Text style={styles.goalStatus}>{affordable ? 'Можно купить из копилки' : `Не хватает ${goal.target - piggyBalance}`}</Text><View style={styles.progress}><View style={[styles.progressFill, { width: `${pct}%` }]} /></View></View>
                <Text style={styles.chev}>›</Text>
              </Pressable>;
            })}
          </ScrollView>
        ) : (
          <Pressable onPress={() => router.push('/goal-editor')} style={styles.emptyGoal}><Text style={styles.emptyPlus}>＋</Text><Text style={styles.emptyTitle}>Добавь первую цель</Text></Pressable>
        )}

        <Pressable onPress={() => router.push('/history')} style={styles.simpleRow}>
          <View style={styles.historyIcon}><Text style={styles.historyIconText}>↻</Text></View>
          <View style={styles.simpleText}><Text style={styles.simpleTitle}>История покупок</Text><Text style={styles.simpleSub}>{transactions.length ? `${transactions.length} операций` : 'Пока операций нет'}</Text></View><Text style={styles.chev}>›</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={firstGoalOpen} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Image source={partyHat} style={styles.modalAsset} resizeMode="contain" />
          <Text style={styles.modalTitle}>Поздравляем, ты добавил свою первую цель!</Text>
          <Text style={styles.modalText}>Заработай монеты и переведи их со счёта в копилку. Когда суммы хватит, цель можно купить сразу оттуда.</Text>
          <Pressable style={styles.modalButton} onPress={goToFirstLesson}><Text style={styles.modalButtonText}>Перейти к урокам</Text></Pressable>
        </View></View>
      </Modal>

      <Modal visible={goalReadyOpen} transparent animationType="fade" onRequestClose={() => setGoalReadyOpen(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Image source={partyHat} style={styles.modalAsset} resizeMode="contain" />
          <Text style={styles.modalTitle}>В копилке хватает на колпак в точечку!</Text>
          <Text style={styles.modalText}>Покупка спишется из копилки, и колпак можно примерить.</Text>
          <Pressable style={styles.modalButton} onPress={tryHat}><Text style={styles.modalButtonText}>Купить из копилки</Text></Pressable>
        </View></View>
      </Modal>

      <Modal visible={transfer !== null} transparent animationType="fade" onRequestClose={() => setTransfer(null)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{transfer === 'in' ? 'Пополнить копилку' : 'Снять из копилки'}</Text>
          <Text style={styles.modalText}>{transfer === 'in' ? `Деньги уйдут со счёта. Сейчас там ${coins} ●.` : `Деньги вернутся на счёт. В копилке ${piggyBalance} ●.`}</Text>
          <TextInput value={amountText} onChangeText={(value) => { setAmountText(value.replace(/\D/g, '')); setTransferError(''); }} keyboardType="number-pad" placeholder="Сумма" style={styles.transferInput} />
          <Pressable onPress={() => { setAmountText(String(transfer === 'in' ? coins : piggyBalance)); setTransferError(''); }}><Text style={styles.transferAll}>Всю сумму</Text></Pressable>
          {transferError ? <Text style={styles.transferError}>{transferError}</Text> : null}
          <Pressable style={styles.modalButton} onPress={submitTransfer}><Text style={styles.modalButtonText}>{transfer === 'in' ? 'Перевести в копилку' : 'Вернуть на счёт'}</Text></Pressable>
          <Pressable onPress={() => setTransfer(null)}><Text style={styles.transferCancel}>Отмена</Text></Pressable>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F2' },
  content: { paddingTop: 126, paddingHorizontal: 16, paddingBottom: 130 },
  title: { fontFamily: fontFamily.bold, fontSize: 30, color: '#2B170B', marginBottom: 14 },
  walletCard: { minHeight: 150, borderRadius: 18, backgroundColor: '#1764B4', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, overflow: 'hidden' },
  piggy: { width: 132, height: 126 },
  walletRight: { flex: 1, alignItems: 'center' },
  walletValue: { fontFamily: fontFamily.bold, color: '#fff', fontSize: 30 },
  walletAccount: { fontFamily: fontFamily.medium, color: '#D6E6F6', fontSize: 11, marginTop: 2 },
  coin: { color: '#F2A900' },
  walletActions: { flexDirection: 'row', gap: 7, marginTop: 12 },
  walletButton: { minHeight: 36, borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  walletButtonText: { fontFamily: fontFamily.bold, color: '#204E7F', fontSize: 11 },
  simpleRow: { minHeight: 76, borderRadius: 14, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, marginTop: 12, borderWidth: 1, borderColor: '#E1DDDA' },
  locked: { opacity: .48 },
  planBars: { width: 50, height: 42, flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingHorizontal: 6 },
  planBar: { width: 7, borderRadius: 4 },
  simpleText: { flex: 1, paddingHorizontal: 10 },
  simpleTitle: { fontFamily: fontFamily.bold, color: '#2A1A11', fontSize: 15 },
  simpleSub: { fontFamily: fontFamily.medium, color: '#80736C', fontSize: 11, marginTop: 3 },
  chev: { fontSize: 30, color: '#8B7D74' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontFamily: fontFamily.bold, fontSize: 19, color: '#28170E' },
  addButton: { borderRadius: 10, backgroundColor: '#5B2E1D', paddingHorizontal: 12, paddingVertical: 9 },
  addButtonText: { fontFamily: fontFamily.bold, color: '#fff', fontSize: 11 },
  goalRow: { gap: 10, paddingRight: 12 },
  goalCard: { width: 272, minHeight: 110, borderRadius: 15, backgroundColor: '#fff', padding: 10, borderWidth: 1, borderColor: '#E2DEDB', flexDirection: 'row', alignItems: 'center' },
  goalImage: { width: 82, height: 82 },
  goalInfo: { flex: 1, paddingHorizontal: 8 },
  goalName: { fontFamily: fontFamily.bold, fontSize: 14, color: '#2A1B13' },
  goalMoney: { fontFamily: fontFamily.semiBold, color: '#745B49', fontSize: 11, marginTop: 6 },
  goalStatus: { fontFamily: fontFamily.medium, color: '#80736C', fontSize: 10, marginTop: 3 },
  progress: { height: 7, borderRadius: 4, backgroundColor: '#E6E1DD', marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#F4A91D' },
  goalPlus: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#EFE6DF', alignItems: 'center', justifyContent: 'center' },
  goalPlusText: { fontFamily: fontFamily.bold, color: '#5B2E1D', fontSize: 21, lineHeight: 22 },
  emptyGoal: { minHeight: 110, borderRadius: 15, backgroundColor: '#fff', borderWidth: 2, borderColor: '#D7D0CB', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  emptyPlus: { fontFamily: fontFamily.medium, fontSize: 30, color: '#1764B4' },
  emptyTitle: { fontFamily: fontFamily.bold, fontSize: 14, color: '#2A1B13' },
  historyIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#4E82DB', alignItems: 'center', justifyContent: 'center' },
  historyIconText: { color: '#fff', fontFamily: fontFamily.bold, fontSize: 24 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(40,20,10,.38)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 22, backgroundColor: '#F7F4F1', padding: 22, alignItems: 'center' },
  modalAsset: { width: 92, height: 92, marginBottom: 9 },
  modalTitle: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 27, color: '#2A160A', textAlign: 'center' },
  modalText: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20, color: '#6F6259', textAlign: 'center', marginTop: 10 },
  modalButton: { width: '100%', minHeight: 52, borderRadius: 12, backgroundColor: '#3B1606', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  modalButtonText: { fontFamily: fontFamily.bold, color: '#fff', fontSize: 14 },
  transferInput: { width: '100%', height: 52, borderRadius: 12, borderWidth: 2, borderColor: '#C9C0BA', backgroundColor: '#fff', marginTop: 16, paddingHorizontal: 14, fontFamily: fontFamily.bold, fontSize: 20, color: '#2A160A' },
  transferAll: { fontFamily: fontFamily.bold, color: '#5B2E1D', marginTop: 10 },
  transferError: { fontFamily: fontFamily.medium, color: '#A14432', marginTop: 8 },
  transferCancel: { fontFamily: fontFamily.bold, color: '#6D625B', marginTop: 14 },
});
