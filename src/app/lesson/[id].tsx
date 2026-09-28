import closeIcon from '@/assets/library/ui/icons/close.png';
import meal from '@/assets/library/food/meals/meal-1.png';
import sandwich from '@/assets/library/food/ready/sandwich.png';
import candy from '@/assets/library/food/sweets/candy.png';
import cake from '@/assets/library/food/sweets/cake.png';
import lollipop from '@/assets/library/food/sweets/lollipop.png';
import vitamin from '@/assets/library/food/vitamins/vitamin-c.png';
import juice from '@/assets/library/food/drinks/orange-juice.png';
import car from '@/assets/library/learning/items/car.png';
import bicycle from '@/assets/library/learning/items/bicycle.png';
import iceCream from '@/assets/library/learning/items/ice-cream.png';
import laptop from '@/assets/library/learning/items/laptop.png';
import notebook from '@/assets/library/learning/items/notebook.png';
import pen from '@/assets/library/learning/items/pen.png';
import phone from '@/assets/library/learning/items/phone.png';
import teddy from '@/assets/library/learning/items/teddy.png';
import raincoat from '@/assets/library/learning/items/raincoat.png';
import rollerSkates from '@/assets/library/learning/items/roller-skates.png';
import stickers from '@/assets/library/learning/items/stickers.png';
import ticket from '@/assets/library/learning/items/ticket.png';
import water from '@/assets/library/learning/items/water.png';
import coin1 from '@/assets/library/learning/items/coin-1.png';
import coin3 from '@/assets/library/learning/items/coin-3.png';
import coin5 from '@/assets/library/learning/items/coin-5.png';
import piggy1 from '@/assets/library/learning/items/piggy-bank-1.png';
import piggy3 from '@/assets/library/learning/items/piggy-bank-3.png';
import piggy5 from '@/assets/library/learning/items/piggy-bank-5.png';
import { FinnyButton } from '@/components/FinnyButton';
import { GOAL_TEMPLATES, type GoalTemplateId } from '@/features/goals/catalog';
import { CHAPTER_BY_ID, LESSON_BY_ID } from '@/features/learning/content';
import { useGameStore } from '@/game/store/gameStore';
import { fontFamily } from '@/ui/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Animated, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type VisualItem = { id: string; label: string; price: number; image: ImageSourcePropType };

const budgetBuyItems: (VisualItem & { type: 'need' | 'want' })[] = [
  { id: 'food', label: 'Еда', price: 45, image: meal, type: 'need' },
  { id: 'vitamins', label: 'Витамины', price: 15, image: vitamin, type: 'need' },
  { id: 'cake', label: 'Пирожное', price: 15, image: cake, type: 'want' },
  { id: 'sweets', label: 'Леденец', price: 20, image: lollipop, type: 'want' },
];

const priorityItems: VisualItem[] = [
  { id: 'bicycle', label: 'Велосипед', price: 50, image: bicycle },
  { id: 'notebook', label: 'Тетрадь', price: 20, image: notebook },
  { id: 'candy', label: 'Конфета', price: 10, image: candy },
  { id: 'pen', label: 'Ручка', price: 5, image: pen },
  { id: 'stickers', label: 'Наклейки', price: 15, image: stickers },
];

const tripItems: (VisualItem & { important: boolean })[] = [
  { id: 'water', label: 'Вода', price: 20, image: water, important: true },
  { id: 'sandwich', label: 'Сэндвич', price: 25, image: sandwich, important: true },
  { id: 'raincoat', label: 'Дождевик', price: 20, image: raincoat, important: true },
  { id: 'ticket', label: 'Билет', price: 30, image: ticket, important: true },
  { id: 'stickers', label: 'Наклейки', price: 15, image: stickers, important: false },
  { id: 'juice', label: 'Сок', price: 15, image: juice, important: false },
];

const truthSets: Record<string, { text: string; answer: boolean; correct: string; wrong: string }[]> = {
  'budget-4': [
    { text: 'Бюджет — это план, который помогает распределить деньги на разные цели', answer: true, correct: 'Правильно! Бюджет помогает заранее понять, на что пойдут деньги.', wrong: 'Бюджет как раз нужен, чтобы заранее распределять деньги между важным, желаниями и целями.' },
    { text: 'Если хочешь купить дорогую вещь, можно заранее откладывать на неё деньги', answer: true, correct: 'Правильно! Большую покупку легче сделать, если копить постепенно.', wrong: 'На дорогую покупку можно откладывать заранее — так не придётся тратить весь бюджет сразу.' },
    { text: 'Желание и необходимость — это одно и то же', answer: false, correct: 'Верно! Необходимое нужно в первую очередь, а желание обычно может подождать.', wrong: 'Необходимость и желание отличаются: без необходимого трудно обойтись, а желаемое можно перенести.' },
  ],
  'savings-4': [
    { text: 'Накопления — это деньги, которые мы откладываем на будущую цель', answer: true, correct: 'Правильно! Накопления помогают собрать деньги на будущую цель.', wrong: 'Накопления — это именно та часть денег, которую оставляют на будущую цель.' },
    { text: 'Перед накоплением полезно решить, на что именно ты хочешь накопить', answer: true, correct: 'Правильно! Понятная цель помогает узнать нужную сумму и срок.', wrong: 'Сначала лучше выбрать цель — тогда понятно, сколько и как долго откладывать.' },
    { text: 'Чтобы накопить большую сумму, можно откладывать понемногу и регулярно', answer: true, correct: 'Да! Регулярные небольшие взносы постепенно складываются в большую сумму.', wrong: 'Не обязательно откладывать всё сразу: регулярные небольшие суммы тоже приводят к цели.' },
  ],
  'payments-3': [
    { text: 'Перед покупкой полезно проверить цену товара', answer: true, correct: 'Правильно! Так можно сравнить цену с балансом и не потратить больше, чем есть.', wrong: 'Перед оплатой цену лучше проверить — это помогает понять, хватает ли денег.' },
    { text: 'Если товар стоит 300 рублей, а ты даёшь 500 рублей, тебе должны вернуть 200 рублей сдачи', answer: true, correct: 'Правильно! 500 − 300 = 200 рублей сдачи.', wrong: 'Проверим ещё раз: 500 − 300 = 200 рублей. Именно столько должны вернуть.' },
    { text: 'Никому нельзя сообщать PIN-код своей банковской карты', answer: true, correct: 'Правильно! PIN-код — секретная информация.', wrong: 'PIN-код нельзя сообщать другим людям — даже если они представляются помощником.' },
  ],
};

const savingsGoals = [
  { id: 'bicycle', name: 'Велосипед', image: bicycle },
  { id: 'laptop', name: 'Ноутбук', image: laptop },
  { id: 'phone', name: 'Телефон', image: phone },
] as const;

const paymentItems: VisualItem[] = [
  { id: 'icecream', label: 'Мороженое', price: 30, image: iceCream },
  { id: 'car', label: 'Машинка', price: 120, image: car },
  { id: 'teddy', label: 'Мишка', price: 70, image: teddy },
];

const coinImages: Record<1 | 3 | 5, ImageSourcePropType> = { 1: coin1, 3: coin3, 5: coin5 };
const piggyImages: Record<1 | 3 | 5, ImageSourcePropType> = { 1: piggy1, 3: piggy3, 5: piggy5 };

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
  const [feedbackGood, setFeedbackGood] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [numberValue, setNumberValue] = useState('');
  const [goalTemplate, setGoalTemplate] = useState<GoalTemplateId>('bicycle');
  const [savingsPick, setSavingsPick] = useState<(typeof savingsGoals)[number]['id']>('bicycle');
  const [truthIndex, setTruthIndex] = useState(0);
  const [coinSortDone, setCoinSortDone] = useState(false);
  const [paidTotal, setPaidTotal] = useState(0);
  const [changeMode, setChangeMode] = useState(false);
  const [changeTotal, setChangeTotal] = useState(0);
  const priorityNowRef = useRef<View | null>(null);
  const priorityLaterRef = useRef<View | null>(null);

  if (!lesson) return <SafeAreaView style={styles.root}><Text style={styles.title}>Урок не найден</Text></SafeAreaView>;

  const totalPages = lesson.theory.length + 2;
  const progress = Math.max(0.06, (page + 1) / totalPages);
  const isTask = page === lesson.theory.length + 1;
  const theory = page > 0 && !isTask ? lesson.theory[page - 1] : null;
  const toggle = (value: string) => setSelected((items) => items.includes(value) ? items.filter((x) => x !== value) : [...items, value]);

  const finish = (extraMistakes = 0) => {
    const accuracy = Math.max(60, 100 - (mistakes + extraMistakes) * 20);
    completeLesson(lesson.id, accuracy);
    const chapter = CHAPTER_BY_ID[lesson.chapter];
    const isLastLesson = chapter.lessons[chapter.lessons.length - 1] === lesson.id;
    if (isLastLesson) {
      router.replace({ pathname: '/chapter-complete', params: { chapter: lesson.chapter } });
      return;
    }
    router.replace({ pathname: '/lesson-complete', params: { lesson: lesson.id } });
  };
  const fail = (message: string) => { setMistakes((m) => m + 1); setFeedbackGood(false); setFeedback(message); };
  const successThen = (message: string, action: () => void) => { setFeedbackGood(true); setFeedback(message); setTimeout(action, 550); };

  const checkTask = () => {
    setFeedback('');
    if (lesson.id === 'budget-1') {
      const chosen = budgetBuyItems.filter((x) => selected.includes(x.id));
      const total = chosen.reduce((sum, x) => sum + x.price, 0);
      const hasNeeds = ['food', 'vitamins'].every((x) => selected.includes(x));
      const wants = chosen.filter((x) => x.type === 'want').length;
      if (!hasNeeds) return fail('Сначала выбери еду и витамины — это обязательные расходы.');
      if (total > 100) return fail('Бюджет превышен. Убери одну покупку и снова проверь остаток.');
      if (wants === 1 && 100 - total >= 20) return successThen('Отлично! Важное куплено, одно желание осталось в бюджете, а часть монет можно отложить.', () => finish());
      if (wants === 2) return successThen('На важное хватило, но на цель осталось мало. Это допустимо, хотя можно спланировать экономнее.', () => finish(1));
      return fail('После обязательных покупок выбери одно небольшое желание и оставь часть монет на цель.');
    }
    if (lesson.id === 'budget-2') {
      const now = priorityItems.filter((x) => selected.includes(x.id));
      const total = now.reduce((sum, x) => sum + x.price, 0);
      const correctNow = ['bicycle', 'notebook', 'pen'];
      if (!correctNow.every((itemId) => selected.includes(itemId))) return fail('До учёбы нужны велосипед, тетрадь и ручка. Перенеси их в раздел «Сейчас».');
      if (selected.some((itemId) => !correctNow.includes(itemId))) return fail('Конфета и наклейки могут подождать. Оставь их в разделе «Позже».');
      if (total !== 75) return fail('Покупки «Сейчас» должны ровно уложиться в 75 монет.');
      return successThen('Отлично! Велосипед, тетрадь и ручка стоят ровно 75 монет, а конфету и наклейки можно купить позже.', () => finish());
    }
    if (lesson.id === 'budget-3') {
      const chosen = tripItems.filter((x) => selected.includes(x.id));
      const total = chosen.reduce((sum, x) => sum + x.price, 0);
      const essentials = tripItems.filter((x) => x.important).every((x) => selected.includes(x.id));
      if (!essentials) return fail('Кажется, забыл что-то важное. В поход нужны вода, еда, дождевик и билет.');
      if (125 - total < 30) return fail('Денег не хватит на дорогу домой. После покупок должно остаться 30 монет.');
      return successThen('Верно! Необходимое стоит 95 монет, и ровно 30 остаётся на дорогу домой.', () => finish());
    }
    if (lesson.id === 'savings-1') {
      const tpl = GOAL_TEMPLATES.find((x) => x.id === goalTemplate)!;
      if (!goals.some((g) => !g.purchasedAt && g.templateId === tpl.id)) addGoal(tpl.id, tpl.name, tpl.target);
      return successThen('Готово! Мечта превратилась в финансовую цель и появилась в копилке.', () => finish());
    }
    if (lesson.id === 'savings-2') {
      if (Number(numberValue) === 10) {
        const name = savingsGoals.find((g) => g.id === savingsPick)?.name.toLowerCase();
        return successThen(`Верно! Если откладывать по 10 монет в неделю, Финни накопит на ${name}.`, () => finish());
      }
      return fail('70 − 20 = 50 монет осталось накопить. 50 ÷ 5 = 10 монет в неделю.');
    }
    if (lesson.id === 'savings-3') {
      if (coinSortDone) return successThen('Все номиналы разложены верно!', () => finish());
      return fail('Рассортируй все монеты: 1 к копилке «1», 3 к «3», 5 к «5».');
    }
    if (lesson.id === 'payments-1') {
      const chosen = paymentItems.filter((x) => selected.includes(x.id));
      if (!chosen.length) return fail('Сначала выбери хотя бы одну покупку.');
      const total = chosen.reduce((sum, item) => sum + item.price, 0);
      if (total > 100) return fail('На эти покупки не хватает 100 монет. Убери слишком дорогой товар или одну из покупок.');
      const expected = 100 - total;
      if (Number(numberValue) === expected) return successThen('Верно! Ты проверил стоимость покупок и правильно посчитал остаток.', () => finish());
      return fail(`Попробуй ещё раз: 100 − ${total}.`);
    }
    if (lesson.id === 'payments-2') {
      if (!changeMode) {
        if (paidTotal < 75) return fail('Пока не хватает монет. Ролики стоят 75.');
        if (paidTotal === 75) return successThen('Покупка оплачена ровно: 75 монет.', () => finish());
        setChangeMode(true); setChangeTotal(0); setFeedbackGood(false); setFeedback(`Ты заплатил ${paidTotal}. Собери сдачу: ${paidTotal - 75} монет.`); return;
      }
      const expected = paidTotal - 75;
      if (changeTotal === expected) return successThen('Отлично! Сдача посчитана правильно.', () => finish());
      return fail(changeTotal > expected ? 'Сдача получилась слишком большой.' : 'Сдачи пока не хватает.');
    }
    if (truthSets[lesson.id]) {
      const statement = truthSets[lesson.id]![truthIndex]!;
      if (!selected.length) return fail('Выбери: верно или неверно.');
      const answer = selected[0] === 'true';
      if (answer !== statement.answer) return fail(statement.wrong);
      if (truthIndex >= truthSets[lesson.id]!.length - 1) return successThen(statement.correct, () => finish());
      setFeedbackGood(true); setFeedback(statement.correct);
      setTimeout(() => { setTruthIndex((i) => i + 1); setSelected([]); setFeedback(''); }, 650);
    }
  };

  const renderVisualCard = (item: VisualItem, onPress: () => void, isSelected: boolean) => (
    <Pressable key={item.id} onPress={onPress} style={[styles.optionCard, isSelected && styles.optionSelected]}>
      <Image source={item.image} style={styles.optionImage} resizeMode="contain" />
      <Text style={styles.optionTitle}>{item.label}</Text>
      <Text style={styles.price}>{item.price} ●</Text>
    </Pressable>
  );

  const renderTask = () => {
    if (lesson.id === 'budget-1') {
      const total = budgetBuyItems.filter((x) => selected.includes(x.id)).reduce((sum, x) => sum + x.price, 0);
      return <>
        <Text style={styles.taskTitle}>У Финни есть 100 монет на неделю</Text>
        <Text style={styles.helper}>Сначала выбери необходимое, затем одно желание. Постарайся оставить хотя бы 20 монет на цель.</Text>
        <View style={styles.budgetPill}><Text style={styles.budgetPillText}>Осталось: {100 - total} ●</Text></View>
        <View style={styles.grid}>{budgetBuyItems.map((item) => renderVisualCard(item, () => toggle(item.id), selected.includes(item.id)))}</View>
      </>;
    }
    if (lesson.id === 'budget-2') {
      const now = priorityItems.filter((x) => selected.includes(x.id));
      const later = priorityItems.filter((x) => !selected.includes(x.id));
      const nowTotal = now.reduce((sum, x) => sum + x.price, 0);
      const movePriority = (itemId: string) => toggle(itemId);
      const renderLane = (title: string, items: VisualItem[], nowLane: boolean) => (
        <View ref={nowLane ? priorityNowRef : priorityLaterRef} style={styles.lane}>
          <View style={styles.laneHeader}>
            <Text style={styles.laneTitle}>{title}</Text>
            {nowLane ? <Text style={styles.laneMoney}>{nowTotal}/75 ●</Text> : null}
          </View>
          <View style={styles.laneItems}>
            {items.length ? items.map((item) => (
              <DraggablePriorityItem
                key={item.id}
                item={item}
                nowLane={nowLane}
                targetRef={() => nowLane ? priorityLaterRef.current : priorityNowRef.current}
                onMove={() => movePriority(item.id)}
              />
            )) : <Text style={styles.laneEmpty}>Перетащи сюда покупку</Text>}
          </View>
        </View>
      );
      return <>
        <Text style={styles.taskTitle}>Что купить сейчас?</Text>
        <Text style={styles.helper}>Перетаскивай покупки между «Сейчас» и «Позже». Если удобнее, карточку можно просто нажать. До учёбы — 2 дня.</Text>
        {renderLane('Сейчас', now, true)}
        {renderLane('Позже', later, false)}
      </>;
    }
    if (lesson.id === 'budget-3') {
      const total = tripItems.filter((x) => selected.includes(x.id)).reduce((sum, x) => sum + x.price, 0);
      return <>
        <Text style={styles.taskTitle}>Собираемся в поход!</Text>
        <Text style={styles.helper}>Баланс: {125 - total} ● · на обратную дорогу нужно оставить 30.</Text>
        <View style={styles.grid}>{tripItems.map((item) => renderVisualCard(item, () => toggle(item.id), selected.includes(item.id)))}</View>
      </>;
    }
    if (lesson.id === 'savings-1') {
      const picks = GOAL_TEMPLATES.filter((g) => g.id !== 'party-hat').slice(0, 4);
      return <>
        <Text style={styles.taskTitle}>Преврати мечту в цель</Text>
        <Text style={styles.helper}>Выбери покупку. После подтверждения она появится во вкладке «Копилка».</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalRow}>
          {picks.map((g) => <Pressable key={g.id} onPress={() => setGoalTemplate(g.id)} style={[styles.goalPick, goalTemplate === g.id && styles.optionSelected]}><Image source={g.image} style={styles.goalImage} resizeMode="contain"/><Text style={styles.optionTitle}>{g.name}</Text><Text style={styles.price}>{g.target} ●</Text></Pressable>)}
        </ScrollView>
      </>;
    }
    if (lesson.id === 'savings-2') return <>
      <Text style={styles.taskTitle}>Сколько откладывать каждую неделю?</Text>
      <Text style={styles.helper}>Цель: 70 ● · уже есть: 20 ● · срок: 5 недель.</Text>
      <View style={styles.goalChoiceRow}>{savingsGoals.map((g) => <Pressable key={g.id} onPress={() => setSavingsPick(g.id)} style={[styles.miniGoal, savingsPick === g.id && styles.optionSelected]}><Image source={g.image} style={styles.miniGoalImage} resizeMode="contain"/><Text style={styles.miniGoalText}>{g.name}</Text></Pressable>)}</View>
      <Text style={styles.formula}>(70 − 20) ÷ 5 = ?</Text>
      <TextInput value={numberValue} onChangeText={setNumberValue} keyboardType="number-pad" placeholder="Ответ" style={styles.input}/>
    </>;
    if (lesson.id === 'savings-3') return <>
      <Text style={styles.taskTitle}>Рассортируй монеты</Text>
      <Text style={styles.helper}>Перетащи каждую монету в копилку с таким же номиналом.</Text>
      <CoinSortTask onComplete={() => setCoinSortDone(true)} />
      {coinSortDone ? <Text style={styles.doneText}>Все монеты на своих местах ✓</Text> : null}
    </>;
    if (lesson.id === 'payments-1') {
      const chosen = paymentItems.filter((x) => selected.includes(x.id));
      const total = chosen.reduce((sum, item) => sum + item.price, 0);
      return <>
        <Text style={styles.taskTitle}>Что Финни может купить?</Text>
        <Text style={styles.helper}>На балансе 100 монет. Можно выбрать один или несколько товаров, если денег хватает. Затем посчитай остаток.</Text>
        <View style={styles.paymentRow}>{paymentItems.map((item) => <Pressable key={item.id} onPress={() => toggle(item.id)} style={[styles.paymentCard, selected.includes(item.id) && styles.optionSelected]}><Image source={item.image} style={styles.paymentImage} resizeMode="contain"/><Text style={styles.optionTitle}>{item.label}</Text><Text style={styles.price}>{item.price} ●</Text></Pressable>)}</View>
        <Text style={styles.formula}>{chosen.length ? `100 − ${total} = ?` : 'Выбери товар'}</Text>
        <TextInput value={numberValue} onChangeText={setNumberValue} keyboardType="number-pad" placeholder="Остаток" style={styles.input}/>
      </>;
    }
    if (lesson.id === 'payments-2') {
      const total = changeMode ? changeTotal : paidTotal;
      const setTotal = changeMode ? setChangeTotal : setPaidTotal;
      return <>
        <Text style={styles.taskTitle}>{changeMode ? 'Собери сдачу' : 'Ролики стоят 75 монет'}</Text>
        <Image source={rollerSkates} style={styles.skatesHero} resizeMode="contain"/>
        <Text style={styles.helper}>{changeMode ? `Оплачено ${paidTotal}. Сдача должна быть ${paidTotal - 75}.` : 'Нажимай на монеты, чтобы собрать сумму оплаты.'}</Text>
        <View style={styles.paymentTray}><Text style={styles.coinSum}>{total}</Text><Text style={styles.trayLabel}>монет</Text></View>
        <View style={styles.coinRow}>{([1, 3, 5, 10, 50] as const).map((v) => <Pressable key={v} onPress={() => setTotal((x) => x + v)} style={styles.coinButton}>{v === 1 || v === 3 || v === 5 ? <Image source={coinImages[v]} style={styles.coinImage} resizeMode="contain"/> : <View style={styles.coinFallback}><Text style={styles.coinText}>{v}</Text></View>}</Pressable>)}</View>
        <Pressable onPress={() => setTotal(0)}><Text style={styles.reset}>Сбросить сумму</Text></Pressable>
      </>;
    }
    const statements = truthSets[lesson.id] ?? [];
    const current = statements[truthIndex];
    return <>
      <Text style={styles.helper}>Карточка {Math.min(truthIndex + 1, statements.length)} из {statements.length}</Text>
      <View style={styles.truthCard}><Text style={styles.truthStatement}>{current?.text ?? 'Выбери правильный ответ'}</Text></View>
      <View style={styles.truthRow}>
        <Pressable onPress={() => setSelected(['false'])} style={[styles.truthBtn, selected[0] === 'false' && styles.truthOn]}><Text style={styles.truthText}>✕ Неверно</Text></Pressable>
        <Pressable onPress={() => setSelected(['true'])} style={[styles.truthBtn, selected[0] === 'true' && styles.truthOn]}><Text style={styles.truthText}>✓ Верно</Text></Pressable>
      </View>
    </>;
  };

  const currentTitle = page === 0 ? lesson.introTitle : theory?.title;
  const currentText = page === 0 ? lesson.introText : theory?.text;
  const currentImage = page === 0 ? lesson.image : theory?.image;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.close} accessibilityLabel="Закрыть урок"><Image source={closeIcon} style={styles.closeIcon} resizeMode="contain" /></Pressable>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} /></View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>{lesson.kicker}</Text>
        {!isTask ? <>
          <Text style={styles.title}>{currentTitle}</Text>
          <Text style={styles.body}>{currentText}</Text>
          {currentImage ? <View style={styles.heroBox}><Image source={currentImage} style={styles.heroImage} resizeMode="contain"/></View> : null}
        </> : <>
          {renderTask()}
          {feedback ? <View style={[styles.feedback, feedbackGood && styles.feedbackGood]}><Text style={[styles.feedbackText, feedbackGood && styles.feedbackTextGood]}>{feedback}</Text></View> : null}
        </>}
      </ScrollView>
      <View style={styles.footer}><FinnyButton label={isTask ? (lesson.id === 'payments-2' ? (changeMode ? 'Проверить сдачу' : 'Заплатить') : 'Готово') : page === 0 ? 'Начать' : page === lesson.theory.length ? 'К заданию' : 'Дальше'} onPress={isTask ? checkTask : () => setPage((p) => p + 1)} /></View>
    </SafeAreaView>
  );
}


function DraggablePriorityItem({ item, nowLane, targetRef, onMove }: { item: VisualItem; nowLane: boolean; targetRef: () => View | null; onMove: () => void }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => pan.setValue({ x: gesture.dx, y: gesture.dy }),
    onPanResponderRelease: (_, gesture) => {
      const distance = Math.hypot(gesture.dx, gesture.dy);
      if (distance < 8) {
        onMove();
        pan.setValue({ x: 0, y: 0 });
        return;
      }
      const target = targetRef();
      if (!target) {
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
        return;
      }
      target.measureInWindow((x, y, width, height) => {
        const inside = gesture.moveX >= x && gesture.moveX <= x + width && gesture.moveY >= y && gesture.moveY <= y + height;
        if (inside) {
          onMove();
          pan.setValue({ x: 0, y: 0 });
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
        }
      });
    },
    onPanResponderTerminate: () => Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start(),
  }), [onMove, pan, targetRef]);

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[styles.laneItem, styles.draggableLaneItem, { transform: pan.getTranslateTransform() }]}
      accessibilityRole="button"
      accessibilityLabel={`${item.label}, ${item.price} монет. Перенести в ${nowLane ? 'Позже' : 'Сейчас'}`}
    >
      <Image source={item.image} style={styles.laneImage} resizeMode="contain" />
      <View style={styles.laneCopy}>
        <Text style={styles.laneItemTitle}>{item.label}</Text>
        <Text style={styles.laneItemPrice}>{item.price} ●</Text>
      </View>
      <Text style={styles.dragHandle}>≡</Text>
    </Animated.View>
  );
}

function CoinSortTask({ onComplete }: { onComplete: () => void }) {
  const coins = useMemo(() => ([1, 3, 5, 3, 1, 5, 5, 3, 1] as const).map((value, i) => ({ id: `${value}-${i}`, value })), []);
  const [sorted, setSorted] = useState<string[]>([]);
  const targetRefs = useRef<Record<1 | 3 | 5, View | null>>({ 1: null, 3: null, 5: null });
  const markSorted = (id: string) => setSorted((current) => {
    if (current.includes(id)) return current;
    const next = [...current, id];
    if (next.length === coins.length) setTimeout(onComplete, 50);
    return next;
  });

  return <View style={styles.sortWrap}>
    <View style={styles.piggyRow}>{([1, 3, 5] as const).map((value) => <View key={value} ref={(node) => { targetRefs.current[value] = node; }} style={styles.piggyTarget}><Image source={piggyImages[value]} style={styles.piggyImage} resizeMode="contain"/></View>)}</View>
    <View style={styles.looseCoins}>{coins.map((coin) => sorted.includes(coin.id) ? <View key={coin.id} style={styles.coinPlaceholder}/> : <DraggableCoin key={coin.id} id={coin.id} value={coin.value} source={coinImages[coin.value]} targetRef={() => targetRefs.current[coin.value]} onSorted={markSorted}/>)}</View>
  </View>;
}

function DraggableCoin({ id, value, source, targetRef, onSorted }: { id: string; value: 1 | 3 | 5; source: ImageSourcePropType; targetRef: () => View | null; onSorted: (id: string) => void }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => pan.setValue({ x: g.dx, y: g.dy }),
    onPanResponderRelease: (_, g) => {
      const target = targetRef();
      if (!target) return Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      target.measureInWindow((x, y, w, h) => {
        const inside = g.moveX >= x && g.moveX <= x + w && g.moveY >= y && g.moveY <= y + h;
        if (inside) onSorted(id);
        else Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      });
    },
  }), [id, onSorted, pan, targetRef]);
  return <Animated.View {...responder.panHandlers} style={[styles.dragCoin, { transform: pan.getTranslateTransform() }]} accessibilityLabel={`Монета ${value}`}><Image source={source} style={styles.dragCoinImage} resizeMode="contain"/></Animated.View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 14 },
  close: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  closeIcon: { width: 24, height: 24 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#D9D9D9', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3A1A0B' },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 36 },
  kicker: { fontFamily: fontFamily.semiBold, color: '#3B302A', fontSize: 12, textAlign: 'right', marginBottom: 24 },
  title: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 32, color: '#1D1410', marginBottom: 18 },
  body: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 23, color: '#302721' },
  heroBox: { marginTop: 28, minHeight: 235, borderRadius: 14, backgroundColor: '#F0EEE9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroImage: { width: '82%', height: 210 },
  footer: { paddingHorizontal: 22, paddingVertical: 12, backgroundColor: '#F7F7F7' },
  taskTitle: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 29, color: '#241710', marginBottom: 12 },
  helper: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20, color: '#5D514B', marginBottom: 18 },
  budgetPill: { alignSelf: 'flex-start', backgroundColor: '#F8E9D4', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 7, marginBottom: 14 },
  budgetPillText: { fontFamily: fontFamily.bold, color: '#5A351D' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  optionCard: { width: '47%', minHeight: 142, padding: 10, borderRadius: 13, backgroundColor: '#fff', borderWidth: 2, borderColor: '#E1E1E1', alignItems: 'center', justifyContent: 'center' },
  optionSelected: { borderColor: '#3D741C', backgroundColor: '#F0F8EA' },
  optionImage: { width: 72, height: 68, marginBottom: 5 },
  optionTitle: { fontFamily: fontFamily.bold, fontSize: 13, color: '#2B1C14', textAlign: 'center' },
  price: { marginTop: 6, fontFamily: fontFamily.semiBold, color: '#8A5C19' },
  feedback: { marginTop: 18, padding: 14, borderRadius: 10, backgroundColor: '#FFF0E9', borderWidth: 1, borderColor: '#E8A98D' },
  feedbackGood: { backgroundColor: '#EDF6E8', borderColor: '#8BB472' },
  feedbackText: { fontFamily: fontFamily.semiBold, color: '#7A3217', lineHeight: 20 },
  feedbackTextGood: { color: '#315C22' },
  lane: { backgroundColor: '#EFEAE6', borderRadius: 15, padding: 11, marginBottom: 12 },
  laneHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  laneTitle: { fontFamily: fontFamily.bold, fontSize: 16, color: '#332219' },
  laneMoney: { fontFamily: fontFamily.bold, fontSize: 12, color: '#7A5A3C' },
  laneItems: { gap: 7 },
  laneItem: { minHeight: 60, borderRadius: 11, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  laneImage: { width: 48, height: 48 },
  laneCopy: { flex: 1, paddingHorizontal: 8 },
  laneItemTitle: { fontFamily: fontFamily.bold, color: '#2B1A11', fontSize: 13 },
  laneItemPrice: { fontFamily: fontFamily.medium, color: '#806A5C', fontSize: 10, marginTop: 2 },
  draggableLaneItem: { zIndex: 20 },
  dragHandle: { fontFamily: fontFamily.bold, fontSize: 22, color: '#8A776B', width: 28, textAlign: 'center', transform: [{ rotate: '90deg' }] },
  laneEmpty: { fontFamily: fontFamily.medium, color: '#A0938B', fontSize: 12, padding: 12, textAlign: 'center' },
  goalRow: { gap: 12, paddingVertical: 8, paddingRight: 12 },
  goalPick: { width: 155, minHeight: 190, borderWidth: 2, borderColor: '#DFDFDF', backgroundColor: '#fff', borderRadius: 14, padding: 10, alignItems: 'center' },
  goalImage: { width: 120, height: 110 },
  goalChoiceRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  miniGoal: { flex: 1, minHeight: 118, borderWidth: 2, borderColor: '#DDD7D2', borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', padding: 7 },
  miniGoalImage: { width: 76, height: 72 },
  miniGoalText: { fontFamily: fontFamily.bold, fontSize: 11, textAlign: 'center', color: '#2C1B12' },
  formula: { fontFamily: fontFamily.bold, color: '#2A190F', fontSize: 17, marginTop: 8 },
  input: { marginTop: 14, height: 60, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#BEB5AF', fontFamily: fontFamily.bold, fontSize: 26, paddingHorizontal: 18, color: '#2A160A' },
  sortWrap: { marginTop: 8 },
  piggyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  piggyTarget: { flex: 1, height: 112, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#BA9A84', backgroundColor: '#F6E7E1', alignItems: 'center', justifyContent: 'center' },
  piggyImage: { width: 92, height: 88 },
  looseCoins: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 24, minHeight: 150 },
  dragCoin: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  dragCoinImage: { width: 56, height: 56 },
  coinPlaceholder: { width: 58, height: 58, opacity: 0 },
  doneText: { textAlign: 'center', marginTop: 10, fontFamily: fontFamily.bold, color: '#397326' },
  paymentRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  paymentCard: { flex: 1, minHeight: 145, borderRadius: 12, backgroundColor: '#fff', borderWidth: 2, borderColor: '#E0DBD7', alignItems: 'center', justifyContent: 'center', padding: 7 },
  paymentImage: { width: 76, height: 76 },
  skatesHero: { width: 150, height: 116, alignSelf: 'center', marginBottom: 4 },
  paymentTray: { minHeight: 104, borderRadius: 18, backgroundColor: '#ECE5DF', borderWidth: 2, borderColor: '#BDAA9B', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  coinSum: { fontFamily: fontFamily.bold, fontSize: 48, color: '#2A160A' },
  trayLabel: { fontFamily: fontFamily.medium, color: '#77675D', fontSize: 11, marginTop: -3 },
  coinRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 9 },
  coinButton: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  coinImage: { width: 58, height: 58 },
  coinFallback: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFB51B', borderWidth: 3, borderColor: '#D88900', alignItems: 'center', justifyContent: 'center' },
  coinText: { fontFamily: fontFamily.bold, fontSize: 17, color: '#5B3000' },
  reset: { marginTop: 20, textAlign: 'center', fontFamily: fontFamily.semiBold, textDecorationLine: 'underline', color: '#5D514B' },
  truthCard: { minHeight: 245, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD6D1', alignItems: 'center', justifyContent: 'center', padding: 26, shadowColor: '#3A210F', shadowOpacity: .08, shadowRadius: 8, elevation: 2 },
  truthStatement: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 29, color: '#2A190F', textAlign: 'center' },
  truthRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  truthBtn: { flex: 1, minHeight: 58, borderRadius: 12, borderWidth: 2, borderColor: '#D5D0CC', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  truthOn: { backgroundColor: '#EAF4E4', borderColor: '#3D741C' },
  truthText: { fontFamily: fontFamily.bold, fontSize: 14, color: '#2B1B13' },
});
