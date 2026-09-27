import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FinnyButton } from '@/components/FinnyButton';
import { GOAL_TEMPLATES } from '@/features/goals/catalog';
import { LESSON_BY_ID } from '@/features/learning/content';
import { useGameStore } from '@/game/store/gameStore';
import { fontFamily } from '@/ui/theme';

const budgetItems = [
  { id: 'food', label: 'Еда', price: 45, important: true },
  { id: 'bus', label: 'Проезд', price: 15, important: true },
  { id: 'toy', label: 'Игрушка', price: 30, important: false },
  { id: 'key', label: 'Брелок', price: 20, important: false },
];
const tripItems = [
  { id: 'water', label: 'Вода', price: 20, emoji: '🥤', important: true },
  { id: 'sandwich', label: 'Сэндвич', price: 25, emoji: '🥪', important: true },
  { id: 'raincoat', label: 'Дождевик', price: 20, emoji: '🧥', important: true },
  { id: 'ticket', label: 'Билет домой', price: 30, emoji: '🎫', important: true },
  { id: 'stickers', label: 'Наклейки', price: 15, emoji: '😺', important: false },
  { id: 'juice', label: 'Сок', price: 15, emoji: '🧃', important: false },
];

const truthSets: Record<string, { text: string; answer: boolean }[]> = {
  'budget-4': [
    { text: 'Бюджет — это план, который помогает распределить деньги на разные цели', answer: true },
    { text: 'Если хочешь купить дорогую игрушку, можно заранее откладывать на неё деньги', answer: true },
    { text: 'Желание и необходимость — это одно и то же', answer: false },
  ],
  'savings-4': [
    { text: 'Накопления — это деньги, которые мы откладываем на будущую цель', answer: true },
    { text: 'Перед накоплением полезно понять, зачем ты откладываешь и сколько нужно собрать', answer: true },
    { text: 'Чтобы накопить большую сумму, можно откладывать понемногу и регулярно', answer: true },
  ],
  'payments-4': [
    { text: 'Перед покупкой полезно проверить цену товара', answer: true },
    { text: 'Если товар стоит 300, а ты даёшь 500, тебе должны вернуть 200 сдачи', answer: true },
    { text: 'PIN-код можно сообщить продавцу, если он просит', answer: false },
  ],
};

const classifyItems = [
  { id: 'lunch', label: 'Обед', correct: 'need' }, { id: 'notebook', label: 'Тетрадь', correct: 'need' },
  { id: 'sticker', label: 'Наклейки', correct: 'want' }, { id: 'game', label: 'Игра', correct: 'want' },
];

export default function LessonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = LESSON_BY_ID[String(id)];
  const completeLesson = useGameStore((s) => s.completeLesson);
  const addGoal = useGameStore((s) => s.addGoal);
  const goals = useGameStore((s) => s.goals);
  const [page, setPage] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [numberValue, setNumberValue] = useState('');
  const [classify, setClassify] = useState<Record<string, 'need' | 'want'>>({});
  const [coinTotal, setCoinTotal] = useState(0);
  const [allocation, setAllocation] = useState({ first: 20, second: 10 });
  const [goalTemplate, setGoalTemplate] = useState(GOAL_TEMPLATES[0]!.id);
  const [truthIndex, setTruthIndex] = useState(0);

  const totalPages = lesson ? lesson.theory.length + 2 : 1;
  const progress = Math.max(0.06, (page + 1) / totalPages);
  const isTask = lesson ? page === lesson.theory.length + 1 : false;
  const theory = lesson && page > 0 && !isTask ? lesson.theory[page - 1] : null;

  const toggle = (value: string) => setSelected((items) => items.includes(value) ? items.filter((x) => x !== value) : [...items, value]);
  const fail = (message: string) => { setMistakes((m) => m + 1); setFeedback(message); };
  const finish = () => {
    if (!lesson) return;
    completeLesson(lesson.id, Math.max(60, 100 - mistakes * 20));
    router.replace({ pathname: '/lesson-complete', params: { lesson: lesson.id } });
  };

  const checkTask = () => {
    if (!lesson) return;
    setFeedback('');
    if (lesson.id === 'budget-1') {
      const total = budgetItems.filter((x) => selected.includes(x.id)).reduce((s, x) => s + x.price, 0);
      const hasImportant = ['food', 'bus'].every((x) => selected.includes(x));
      if (total <= 100 && hasImportant && total < 100) return finish();
      return fail(total > 100 ? 'Бюджет превышен. Убери одну покупку.' : 'Сначала добавь еду и проезд и оставь небольшой запас.');
    }
    if (lesson.id === 'budget-2') {
      if (classifyItems.every((item) => classify[item.id] === item.correct)) return finish();
      return fail('Проверь: обязательные траты — «Нужно», развлечения — «Хочу».');
    }
    if (lesson.id === 'budget-3') {
      const total = tripItems.filter((x) => selected.includes(x.id)).reduce((s, x) => s + x.price, 0);
      const essentials = tripItems.filter((x) => x.important).every((x) => selected.includes(x.id));
      if (essentials && total <= 95) return finish();
      if (!essentials) return fail('Кажется, забыл что-то важное. Нужны вода, еда, дождевик и билет домой.');
      return fail('Оставь 30 монет на дорогу домой. Убери лишнюю покупку.');
    }
    if (lesson.id === 'savings-1') {
      const tpl = GOAL_TEMPLATES.find((x) => x.id === goalTemplate)!;
      if (!goals.some((g) => !g.purchasedAt)) addGoal(tpl.id, tpl.name, tpl.target);
      return finish();
    }
    if (lesson.id === 'savings-2') {
      if (Number(numberValue) === 20) return finish();
      return fail('120 ÷ 6 = 20 монет в неделю.');
    }
    if (lesson.id === 'savings-3') {
      if (allocation.first + allocation.second === 30 && allocation.first > allocation.second) return finish();
      return fail('Распредели ровно 30 монет и дай ближайшей цели больше.');
    }
    if (lesson.id === 'payments-1') {
      if (Number(numberValue) === 50) return finish();
      return fail('150 − 100 = 50.');
    }
    if (lesson.id === 'payments-2') {
      if (selected[0] === '50') return finish();
      return fail('При балансе 70 монет покупка за 90 уже не подходит.');
    }
    if (lesson.id === 'payments-3') {
      if (coinTotal === 15) return finish();
      return fail(coinTotal > 15 ? 'Получилось больше 15. Сбрось сумму и попробуй ещё раз.' : 'Пока не хватает монет.');
    }
    if (truthSets[lesson.id]) {
      const statement = truthSets[lesson.id]![truthIndex]!;
      if (!selected.length) return fail('Выбери: верно или неверно.');
      const answer = selected[0] === 'true';
      if (answer !== statement.answer) return fail('Почти. Вспомни правило из урока и попробуй ещё раз.');
      if (truthIndex >= truthSets[lesson.id]!.length - 1) return finish();
      setTruthIndex((i) => i + 1);
      setSelected([]);
      setFeedback('Верно! Следующая карточка.');
      return;
    }
  };

  const task = useMemo(() => {
    if (!lesson) return null;
    if (lesson.id === 'budget-1') {
      const limit = 100;
      const total = budgetItems.filter((x) => selected.includes(x.id)).reduce((s, x) => s + x.price, 0);
      return <>
        <Text style={styles.taskTitle}>Твой бюджет: {limit} 🟡</Text>
        <Text style={styles.helper}>Выбери покупки. Потрачено: {total} · Остаток: {limit - total}</Text>
        <View style={styles.grid}>{budgetItems.map((item) => <Pressable key={item.id} onPress={() => toggle(item.id)} style={[styles.optionCard, selected.includes(item.id) && styles.optionSelected]}><Text style={styles.emoji}>{item.important ? '🧺' : '🎁'}</Text><Text style={styles.optionTitle}>{item.label}</Text><Text style={styles.price}>{item.price} 🟡</Text></Pressable>)}</View>
      </>;
    }
    if (lesson.id === 'budget-3') {
      const total = tripItems.filter((x) => selected.includes(x.id)).reduce((sum, x) => sum + x.price, 0);
      return <>
        <Text style={styles.taskTitle}>Баланс: {125 - total} 🟡</Text>
        <Text style={styles.helper}>Собери всё необходимое и оставь не меньше 30 монет на дорогу домой.</Text>
        <View style={styles.grid}>{tripItems.map((item) => <Pressable key={item.id} onPress={() => toggle(item.id)} style={[styles.optionCard, selected.includes(item.id) && styles.optionSelected]}><Text style={styles.emoji}>{item.emoji}</Text><Text style={styles.optionTitle}>{item.label}</Text><Text style={styles.price}>{item.price} 🟡</Text></Pressable>)}</View>
      </>;
    }
    if (lesson.id === 'budget-2') return <>
      <Text style={styles.taskTitle}>Разложи покупки</Text>
      {classifyItems.map((item) => <View key={item.id} style={styles.classifyRow}><Text style={styles.optionTitle}>{item.label}</Text><View style={styles.segment}><Pressable onPress={() => setClassify((x) => ({ ...x, [item.id]: 'need' }))} style={[styles.segmentBtn, classify[item.id] === 'need' && styles.segmentOn]}><Text style={styles.segmentText}>Нужно</Text></Pressable><Pressable onPress={() => setClassify((x) => ({ ...x, [item.id]: 'want' }))} style={[styles.segmentBtn, classify[item.id] === 'want' && styles.segmentOn]}><Text style={styles.segmentText}>Хочу</Text></Pressable></View></View>)}
    </>;
    if (lesson.id === 'savings-1') return <>
      <Text style={styles.taskTitle}>Давай поставим цель</Text><Text style={styles.helper}>Выбери предмет, на который хочешь копить. Он появится во вкладке «Копилка».</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalRow}>{GOAL_TEMPLATES.slice(0,4).map((g) => <Pressable key={g.id} onPress={() => setGoalTemplate(g.id)} style={[styles.goalPick, goalTemplate === g.id && styles.optionSelected]}><Image source={g.image} style={styles.goalImage} resizeMode="contain"/><Text style={styles.optionTitle}>{g.name}</Text><Text style={styles.price}>{g.target} 🟡</Text></Pressable>)}</ScrollView>
    </>;
    if (lesson.id === 'savings-2' || lesson.id === 'payments-1') return <>
      <Text style={styles.taskTitle}>{lesson.id === 'savings-2' ? '120 ÷ 6 = ?' : '150 − 100 = ?'}</Text><TextInput value={numberValue} onChangeText={setNumberValue} keyboardType="number-pad" placeholder="Ответ" style={styles.input}/>
    </>;
    if (lesson.id === 'savings-3') return <>
      <Text style={styles.taskTitle}>Распредели 30 монет</Text>
      <AllocationRow label="Велосипед — раньше" value={allocation.first} onMinus={() => setAllocation((a) => ({ first: Math.max(0,a.first-5), second: a.second+5 }))} onPlus={() => setAllocation((a) => ({ first: Math.min(30,a.first+5), second: Math.max(0,a.second-5) }))}/>
      <AllocationRow label="Гаджет — позже" value={allocation.second} onMinus={() => setAllocation((a) => ({ first: a.first+5, second: Math.max(0,a.second-5) }))} onPlus={() => setAllocation((a) => ({ first: Math.max(0,a.first-5), second: Math.min(30,a.second+5) }))}/>
    </>;
    if (lesson.id === 'payments-2') return <><Text style={styles.taskTitle}>Баланс: 70 🟡</Text><View style={styles.grid}>{['50','90'].map((v) => <Pressable key={v} onPress={() => setSelected([v])} style={[styles.optionCard, selected[0] === v && styles.optionSelected]}><Text style={styles.emoji}>{v === '50' ? '🧸' : '🚗'}</Text><Text style={styles.optionTitle}>Покупка за {v}</Text></Pressable>)}</View></>;
    if (lesson.id === 'payments-3') return <><Text style={styles.taskTitle}>Нужно ровно 15 🟡</Text><Text style={styles.coinSum}>{coinTotal}</Text><View style={styles.coinRow}>{[1,3,5].map((v) => <Pressable key={v} onPress={() => setCoinTotal((x) => x + v)} style={styles.coin}><Text style={styles.coinText}>{v}</Text></Pressable>)}</View><Pressable onPress={() => setCoinTotal(0)}><Text style={styles.reset}>Сбросить сумму</Text></Pressable></>;
    const statements = truthSets[lesson.id] ?? [];
    const current = statements[truthIndex];
    return <><Text style={styles.helper}>Карточка {Math.min(truthIndex + 1, statements.length)} из {statements.length}</Text><Text style={styles.taskTitle}>{current?.text ?? 'Выбери правильный ответ'}</Text><View style={styles.truthRow}><Pressable onPress={() => setSelected(['true'])} style={[styles.truthBtn, selected[0] === 'true' && styles.truthOn]}><Text style={styles.truthText}>✓ Верно</Text></Pressable><Pressable onPress={() => setSelected(['false'])} style={[styles.truthBtn, selected[0] === 'false' && styles.truthOn]}><Text style={styles.truthText}>✕ Неверно</Text></Pressable></View></>;
  }, [lesson, selected, classify, numberValue, coinTotal, allocation, goalTemplate, goals, truthIndex]);

  if (!lesson) return <SafeAreaView style={styles.root}><Text style={styles.title}>Урок не найден</Text></SafeAreaView>;
  const currentTitle = page === 0 ? lesson.introTitle : theory?.title;
  const currentText = page === 0 ? lesson.introText : theory?.text;
  const currentImage = page === 0 ? lesson.image : theory?.image;

  return <SafeAreaView style={styles.root} edges={['top','bottom']}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable><View style={styles.progressTrack}><View style={[styles.progressFill,{ width: `${Math.round(progress*100)}%` }]} /></View></View>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.kicker}>{lesson.kicker}</Text>
      {!isTask ? <><Text style={styles.title}>{currentTitle}</Text><Text style={styles.body}>{currentText}</Text>{currentImage ? <View style={styles.heroBox}><Image source={currentImage} style={styles.heroImage} resizeMode="contain"/></View> : null}</> : <>{task}{feedback ? <View style={styles.feedback}><Text style={styles.feedbackText}>{feedback}</Text></View> : null}</>}
    </ScrollView>
    <View style={styles.footer}><FinnyButton label={isTask ? 'Проверить' : page === 0 ? 'Начать' : page === lesson.theory.length ? 'К заданию' : 'Дальше'} onPress={isTask ? checkTask : () => setPage((p) => p+1)} /></View>
  </SafeAreaView>;
}

function AllocationRow({ label, value, onMinus, onPlus }: { label: string; value: number; onMinus: () => void; onPlus: () => void }) {
  return <View style={styles.allocRow}><Text style={styles.allocLabel}>{label}</Text><View style={styles.stepper}><Pressable onPress={onMinus} style={styles.stepBtn}><Text>−</Text></Pressable><Text style={styles.stepValue}>{value} 🟡</Text><Pressable onPress={onPlus} style={styles.stepBtn}><Text>+</Text></Pressable></View></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' }, header: { height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 14 }, close: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }, closeText: { fontSize: 30, color: '#231710', lineHeight: 30 }, progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#D9D9D9', overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: '#3A1A0B' },
  scroll: { flex: 1 }, content: { padding: 24, paddingBottom: 30 }, kicker: { fontFamily: fontFamily.semiBold, color: '#3B302A', fontSize: 12, textAlign: 'right', marginBottom: 24 }, title: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 32, color: '#1D1410', marginBottom: 18 }, body: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 23, color: '#302721' }, heroBox: { marginTop: 28, minHeight: 235, borderRadius: 12, backgroundColor: '#1761AD', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, heroImage: { width: '88%', height: 220 }, footer: { paddingHorizontal: 22, paddingVertical: 12, backgroundColor: '#F7F7F7' },
  taskTitle: { fontFamily: fontFamily.bold, fontSize: 24, color: '#241710', marginBottom: 12 }, helper: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20, color: '#5D514B', marginBottom: 18 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, optionCard: { width: '47%', minHeight: 132, padding: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 2, borderColor: '#E1E1E1', alignItems: 'center', justifyContent: 'center' }, optionSelected: { borderColor: '#3D741C', backgroundColor: '#F0F8EA' }, emoji: { fontSize: 40, marginBottom: 8 }, optionTitle: { fontFamily: fontFamily.bold, fontSize: 14, color: '#2B1C14', textAlign: 'center' }, price: { marginTop: 7, fontFamily: fontFamily.semiBold, color: '#64442E' },
  feedback: { marginTop: 18, padding: 14, borderRadius: 10, backgroundColor: '#FFF0E9', borderWidth: 1, borderColor: '#E8A98D' }, feedbackText: { fontFamily: fontFamily.semiBold, color: '#7A3217', lineHeight: 20 }, classifyRow: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 }, segment: { flexDirection: 'row', marginTop: 10, gap: 8 }, segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, borderWidth: 1, borderColor: '#CFC7C2', alignItems: 'center' }, segmentOn: { backgroundColor: '#E6F0DF', borderColor: '#47792B' }, segmentText: { fontFamily: fontFamily.semiBold, color: '#2D1A10' },
  input: { marginTop: 22, height: 60, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#BEB5AF', fontFamily: fontFamily.bold, fontSize: 26, paddingHorizontal: 18, color: '#2A160A' }, goalRow: { gap: 12, paddingVertical: 8, paddingRight: 12 }, goalPick: { width: 155, minHeight: 190, borderWidth: 2, borderColor: '#DFDFDF', backgroundColor: '#fff', borderRadius: 14, padding: 10, alignItems: 'center' }, goalImage: { width: 120, height: 110 },
  truthRow: { gap: 12, marginTop: 26 }, truthBtn: { minHeight: 60, borderRadius: 12, borderWidth: 2, borderColor: '#D5D0CC', backgroundColor: '#fff', justifyContent: 'center', paddingHorizontal: 18 }, truthOn: { backgroundColor: '#EAF4E4', borderColor: '#3D741C' }, truthText: { fontFamily: fontFamily.bold, fontSize: 16, color: '#2B1B13' }, coinSum: { fontFamily: fontFamily.bold, fontSize: 58, textAlign: 'center', marginVertical: 28, color: '#2A160A' }, coinRow: { flexDirection: 'row', justifyContent: 'center', gap: 18 }, coin: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#FFB51B', borderWidth: 4, borderColor: '#D88900', alignItems: 'center', justifyContent: 'center' }, coinText: { fontFamily: fontFamily.bold, fontSize: 22, color: '#5B3000' }, reset: { marginTop: 22, textAlign: 'center', fontFamily: fontFamily.semiBold, textDecorationLine: 'underline', color: '#5D514B' },
  allocRow: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 12 }, allocLabel: { fontFamily: fontFamily.bold, color: '#2A160A', marginBottom: 12 }, stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, stepBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EFE8E3', alignItems: 'center', justifyContent: 'center' }, stepValue: { fontFamily: fontFamily.bold, fontSize: 18, color: '#2A160A' },
});
