import checkArt from "@/assets/library/learning/lesson/check.png";
import coin1 from "@/assets/library/learning/lesson/coin-1.png";
import coin3 from "@/assets/library/learning/lesson/coin-3.png";
import coin5 from "@/assets/library/learning/lesson/coin-5.png";
import crossArt from "@/assets/library/learning/lesson/cross.png";
import piggy1 from "@/assets/library/learning/lesson/piggy-1.png";
import piggy3 from "@/assets/library/learning/lesson/piggy-3.png";
import piggy5 from "@/assets/library/learning/lesson/piggy-5.png";
import trayArt from "@/assets/library/learning/lesson/tray.png";
import basketArt from "@/assets/library/learning/sort/basket-empty.png";
import nextIcon from "@/assets/library/ui/icons/arrow-right-circle.png";
import closeIcon from "@/assets/library/ui/icons/close.png";
import { FinnyButton } from "@/components/FinnyButton";
import type { PetColorId } from "@/content/petColors";
import { LESSON_BY_ID } from "@/features/learning/content";
import {
  LESSON_FLOWS,
  PRIORITY_NOW,
  WEEKDAYS,
  priorityItems,
  savingsChoices,
  type Art,
  type FlowStep,
  type SavingsChoiceId,
  type ShopItem,
  type SwipeCard,
} from "@/features/learning/lessonFlows";
import { PetWithHat } from "@/game/components/PetWithHat";
import { sessionUi } from "@/game/sessionUi";
import { useGameStore } from "@/game/store/gameStore";
import { useProfileStore } from "@/store/profileStore";
import { fontFamily } from "@/ui/theme";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { ImageSourcePropType } from "react-native";
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type Sheet = {
  tone: "good" | "mid" | "bad";
  title: string;
  body: string;
  button: string;
  go: "finish" | "stay" | "next-card";
};

type PayPhase = "pay" | "change";
type PayResult = "short" | "exact" | "over" | "change-ok" | "change-bad";

const COIN_ART: Partial<Record<number, ImageSourcePropType>> = {
  1: coin1,
  3: coin3,
  5: coin5,
};
const PIGGIES = [
  { value: 1 as const, image: piggy1 },
  { value: 3 as const, image: piggy3 },
  { value: 5 as const, image: piggy5 },
];
const PAY_VALUES = [1, 3, 5, 10, 50] as const;
const SORT_COINS: {
  id: string;
  value: 1 | 3 | 5;
  left: number;
  top: number;
}[] = [
  { id: "c1", value: 1, left: 18, top: 12 },
  { id: "c2", value: 5, left: 148, top: 24 },
  { id: "c3", value: 3, left: 250, top: 6 },
  { id: "c4", value: 1, left: 78, top: 108 },
  { id: "c5", value: 5, left: 196, top: 118 },
  { id: "c6", value: 3, left: 28, top: 176 },
];

export default function LessonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = String(id);
  const lesson = LESSON_BY_ID[lessonId];
  const flow = LESSON_FLOWS[lessonId] ?? [];
  const completeLesson = useGameStore((s) => s.completeLesson);
  const goals = useGameStore((s) => s.goals);
  const color = (useProfileStore((s) => s.petColorId) || "brown") as PetColorId;
  const restoredStep = () =>
    Math.min(
      Math.max(0, sessionUi.lessonStep[lessonId] ?? 0),
      Math.max(0, flow.length - 1),
    );
  const [index, setIndex] = useState(restoredStep);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [numberValue, setNumberValue] = useState("");
  const [askBalance, setAskBalance] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [pick, setPick] = useState<SavingsChoiceId>("bicycle");
  const [payPhase, setPayPhase] = useState<PayPhase>("pay");
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const mistakesRef = useRef(0);
  const finished = useRef(false);
  const goalBaseline = useRef<number | null>(null);
  const pendingGoal = useRef(false);
  const advancingRef = useRef(false);
  const priorityRef = useRef<PriorityHandle>(null);
  const payRef = useRef<PayHandle>(null);
  const scrollRef = useRef<ScrollView>(null);

  const setDragLocked = useCallback((locked: boolean) => {
    setScrollEnabled(!locked);
    scrollRef.current?.setNativeProps({ scrollEnabled: !locked });
  }, []);

  const finish = useCallback(() => {
    if (!lesson || finished.current) return;
    finished.current = true;
    delete sessionUi.lessonStep[lesson.id];
    const accuracy = Math.max(60, 100 - mistakesRef.current * 20);
    completeLesson(lesson.id, accuracy);
    router.replace({
      pathname: "/lesson-complete",
      params: { lesson: lesson.id },
    });
  }, [completeLesson, lesson, router]);

  useEffect(() => {
    setIndex(restoredStep());
    setSheet(null);
    setSelected([]);
    setNumberValue("");
    setAskBalance(false);
    setCardIndex(0);
    setPick("bicycle");
    setPayPhase("pay");
    mistakesRef.current = 0;
    finished.current = false;
    goalBaseline.current = null;
    pendingGoal.current = false;
  }, [lessonId]);

  useEffect(() => {
    sessionUi.lessonStep[lessonId] = index;
  }, [index, lessonId]);

  useEffect(() => {
    setSheet(null);
    setSelected([]);
    setNumberValue("");
    setAskBalance(false);
    setCardIndex(0);
    setPayPhase("pay");
    setScrollEnabled(true);
  }, [index]);

  useEffect(() => {
    advancingRef.current = false;
  }, [index, cardIndex, sheet]);

  useFocusEffect(
    useCallback(() => {
      if (pendingGoal.current) {
        pendingGoal.current = false;
        if (
          goalBaseline.current !== null &&
          goals.length > goalBaseline.current
        )
          finish();
      }
    }, [finish, goals.length]),
  );

  const noteMistake = () => {
    mistakesRef.current += 1;
  };

  if (!lesson || flow.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.sheetTitle}>Урок не найден</Text>
      </SafeAreaView>
    );
  }

  const step = flow[index]!;
  const progress =
    step.kind === "swipe"
      ? (index + (cardIndex + 1) / step.cards.length) / flow.length
      : (index + 1) / flow.length;
  const interactiveStep =
    !sheet &&
    ["shop", "priority", "swipe", "pick", "sort", "pay"].includes(step.kind);

  const openSheet = (next: Sheet) => setSheet(next);

  const checkShop = (shop: Extract<FlowStep, { kind: "shop" }>) => {
    const chosen = shop.items.filter((item) => selected.includes(item.id));
    const total = chosen.reduce((sum, item) => sum + item.price, 0);
    const needsOk = shop.items
      .filter((item) => item.role === "need")
      .every((item) => selected.includes(item.id));
    const left = shop.purse - total;
    if (shop.task === "week") {
      const wants = chosen.filter((item) => item.role === "want").length;
      if (!needsOk) {
        noteMistake();
        openSheet({
          tone: "bad",
          title: "Кажется, на важное не хватило",
          body: "Сначала оставь монеты на самое важное: еду и уход. А потом реши, что можно купить из желаемого.",
          button: "Попробовать ещё раз",
          go: "stay",
        });
        return;
      }
      if (wants <= 1 && left >= 20) {
        openSheet({
          tone: "good",
          title: "Отличный план!",
          body:
            wants === 1
              ? "Финни получил всё необходимое, немного порадовал себя и ещё приблизился к своей цели."
              : "Финни получил всё необходимое, и на цель осталось достаточно монет.",
          button: "Завершить",
          go: "finish",
        });
        return;
      }
      openSheet({
        tone: "mid",
        title: "Хорошо получилось",
        body: "На всё важное монет хватило, и ты даже немного отложил на цель. Попробуй в следующий раз оставить на цель больше — так ты доберёшься до неё быстрее.",
        button: "Завершить",
        go: "finish",
      });
      return;
    }
    if (shop.task === "trip") {
      if (!needsOk) {
        noteMistake();
        openSheet({
          tone: "bad",
          title: "Кажется, забыл что-то важное",
          body: "Проверь, всё ли необходимое ты положил в корзину: воду, еду, дождевик и билет.",
          button: "Пересмотреть корзину",
          go: "stay",
        });
        return;
      }
      if (left < 30) {
        noteMistake();
        openSheet({
          tone: "bad",
          title: "Денег может не хватить на дорогу домой",
          body: "Билет в обратную сторону тоже стоит 30 монет, кажется, надо что-то выложить.",
          button: "Пересмотреть корзину",
          go: "stay",
        });
        return;
      }
      openSheet({
        tone: "good",
        title:
          "Всё необходимое куплено и осталось ещё 30 монет на дорогу домой",
        body: "Ты правильно сделал, что не взял лишнего, теперь Финни точно готов!",
        button: "Ура!",
        go: "finish",
      });
      return;
    }
    if (!chosen.length) {
      noteMistake();
      openSheet({
        tone: "bad",
        title: "Сначала выбери покупку",
        body: "Отметь то, что Финни может купить на 100 монет.",
        button: "Понятно",
        go: "stay",
      });
      return;
    }
    if (total > shop.purse) {
      noteMistake();
      openSheet({
        tone: "bad",
        title: "На эти покупки не хватает монет",
        body: "Убери слишком дорогой товар или одну из покупок.",
        button: "Пересмотреть",
        go: "stay",
      });
      return;
    }
    setNumberValue("");
    setAskBalance(true);
  };

  const checkBalance = (shop: Extract<FlowStep, { kind: "shop" }>) => {
    const total = shop.items
      .filter((item) => selected.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
    if (Number(numberValue) === shop.purse - total) {
      openSheet({
        tone: "good",
        title: "Ты правильно посчитал, сколько монет осталось",
        body: "Финни может потратить оставшиеся монеты на следующую покупку или сохранить их.",
        button: "Продолжить",
        go: "finish",
      });
      return;
    }
    noteMistake();
    openSheet({
      tone: "bad",
      title: "Попробуй ещё раз!",
      body: `Проверь вычисление ещё раз: ${shop.purse} − ${total}.`,
      button: "Продолжить",
      go: "stay",
    });
  };

  const checkPriority = () => {
    const now = priorityRef.current?.nowIds() ?? [];
    const exact =
      PRIORITY_NOW.length === now.length &&
      PRIORITY_NOW.every((itemId) => now.includes(itemId));
    if (exact) {
      openSheet({
        tone: "good",
        title: "Отличный план!",
        body: "Велосипед, тетрадь и ручка нужны сейчас. Конфету и наклейки можно оставить на потом. Так сначала хватает денег на необходимое.",
        button: "Продолжить",
        go: "finish",
      });
      return;
    }
    noteMistake();
    openSheet({
      tone: "bad",
      title: "Кажется, на важное не хватило",
      body: "Попробуй ещё раз. Ты забыл про что-то очень важное: сейчас нужны велосипед, тетрадь и ручка.",
      button: "Попробовать",
      go: "stay",
    });
  };

  const checkWeekly = () => {
    const choice =
      savingsChoices.find((item) => item.id === pick) ?? savingsChoices[0]!;
    if (Number(numberValue) === 10) {
      openSheet({
        tone: "good",
        title: `Отлично! Теперь Финни точно накопит на ${choice.name.toLowerCase()}`,
        body: "Ты правильно посчитал. Молодец, так держать!",
        button: "Продолжить",
        go: "finish",
      });
      return;
    }
    noteMistake();
    openSheet({
      tone: "bad",
      title: "Давай посчитаем вместе!",
      body: `${choice.name} стоит 70 монет, а у Финни уже есть 20. Осталось накопить 50 монет. 50 ÷ 5 недель = 10 монет в неделю.`,
      button: "Попробовать ещё раз",
      go: "stay",
    });
  };

  const chooseCard = (cards: SwipeCard[], agree: boolean) => {
    const card = cards[cardIndex];
    if (!card) return;
    const right = agree === card.answer;
    if (!right) noteMistake();
    const last = cardIndex >= cards.length - 1;
    openSheet({
      tone: right ? "good" : "bad",
      title: right ? card.ok : card.bad,
      body: "",
      button: right ? "Всё понятно" : "Вроде разобрался",
      go: last ? "finish" : "next-card",
    });
  };

  const pressPay = () => {
    const result = payRef.current?.commit();
    if (result === "short") {
      noteMistake();
      openSheet({
        tone: "bad",
        title: "Пока не хватает монет.",
        body: "Товар стоит 75 монет. Добавь ещё монеты и попробуй снова.",
        button: "Попробовать",
        go: "stay",
      });
    } else if (result === "exact") {
      openSheet({
        tone: "good",
        title: "Покупка оплачена!",
        body: "Ты собрал ровно 75 монет — столько, сколько стоит товар.",
        button: "Продолжить",
        go: "finish",
      });
    } else if (result === "change-ok") {
      openSheet({
        tone: "good",
        title: "Отлично! Ты рассчитался за товар",
        body: "",
        button: "Продолжить",
        go: "finish",
      });
    } else if (result === "change-bad") {
      noteMistake();
      openSheet({
        tone: "bad",
        title: "Сдача пока не сходится",
        body: "Собери монетами ровно ту сумму, которую должны вернуть.",
        button: "Попробовать",
        go: "stay",
      });
    }
  };

  const onFooter = () => {
    if (sheet) {
      if (sheet.go === "finish") finish();
      else if (sheet.go === "next-card") {
        if (advancingRef.current) return;
        advancingRef.current = true;
        setCardIndex((value) => value + 1);
        setSheet(null);
      } else setSheet(null);
      return;
    }
    if (step.kind === "shop") {
      if (askBalance) checkBalance(step);
      else checkShop(step);
      return;
    }
    if (step.kind === "priority") {
      checkPriority();
      return;
    }
    if (step.kind === "weekly") {
      checkWeekly();
      return;
    }
    if (step.kind === "pay") {
      pressPay();
      return;
    }
    if (step.kind === "goal") {
      if (pendingGoal.current) return;
      goalBaseline.current = goals.length;
      pendingGoal.current = true;
      router.navigate("/goal-editor");
      return;
    }
    if (
      step.kind === "pick" ||
      step.kind === "cover" ||
      step.kind === "story" ||
      step.kind === "groups"
    ) {
      if (advancingRef.current) return;
      advancingRef.current = true;
      setIndex((value) => value + 1);
    }
  };

  const footerLabel = () => {
    if (sheet) return sheet.button;
    if (
      step.kind === "cover" ||
      step.kind === "story" ||
      step.kind === "groups" ||
      step.kind === "goal"
    )
      return step.button;
    if (step.kind === "pick") return "Дальше";
    if (step.kind === "pay")
      return payPhase === "change" ? "Проверить" : "Заплатить";
    return "Готово";
  };

  const showFooter =
    sheet ||
    (step.kind !== "swipe" &&
      step.kind !== "sort" &&
      !(step.kind === "story" && step.arrow));
  const showArrow = !sheet && step.kind === "story" && step.arrow;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.close}
          accessibilityLabel="Закрыть урок"
        >
          <Image
            source={closeIcon}
            style={styles.closeIcon}
            resizeMode="contain"
          />
        </Pressable>
        <View style={styles.track}>
          <AnimatedProgressFill progress={Math.max(0.08, progress)} />
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 120 + insets.bottom },
        ]}
        scrollEnabled={scrollEnabled && !interactiveStep}
        canCancelContentTouches={scrollEnabled && !interactiveStep}
        keyboardShouldPersistTaps="handled"
      >
        {sheet ? (
          <ResultView sheet={sheet} />
        ) : (
          <StepBody
            step={step}
            color={color}
            selected={selected}
            onToggle={(itemId) =>
              setSelected((items) =>
                items.includes(itemId)
                  ? items.filter((entry) => entry !== itemId)
                  : [...items, itemId],
              )
            }
            askBalance={askBalance}
            numberValue={numberValue}
            onNumber={setNumberValue}
            cardIndex={cardIndex}
            onChoose={chooseCard}
            pick={pick}
            onPick={setPick}
            priorityRef={priorityRef}
            payRef={payRef}
            onPayPhase={setPayPhase}
            onSorted={() =>
              openSheet({
                tone: "good",
                title: "Ты правильно распределил монеты",
                body: "Чем внимательнее следишь за своими деньгами, тем легче накопить на большую цель!",
                button: "Продолжить",
                go: "finish",
              })
            }
            onDragLock={setDragLocked}
            onMistake={noteMistake}
          />
        )}
      </ScrollView>
      {showFooter ? (
        <View style={[styles.footer, { bottom: insets.bottom + 18 }]}>
          <FinnyButton label={footerLabel()} onPress={onFooter} />
        </View>
      ) : null}
      {showArrow ? (
        <Pressable
          style={[styles.arrowButton, { bottom: insets.bottom + 18 }]}
          onPress={() => {
            if (advancingRef.current) return;
            advancingRef.current = true;
            setIndex((value) => value + 1);
          }}
          accessibilityLabel="Дальше"
        >
          <Image
            source={nextIcon}
            style={styles.arrowIcon}
            resizeMode="contain"
          />
        </Pressable>
      ) : null}
    </View>
  );
}

function AnimatedProgressFill({ progress }: { progress: number }) {
  const value = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    const animation = Animated.timing(value, {
      toValue: progress,
      duration: 220,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, value]);
  return (
    <Animated.View
      style={[
        styles.fill,
        {
          width: value.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
        },
      ]}
    />
  );
}

function StepBody({
  step,
  color,
  selected,
  onToggle,
  askBalance,
  numberValue,
  onNumber,
  cardIndex,
  onChoose,
  pick,
  onPick,
  priorityRef,
  payRef,
  onPayPhase,
  onSorted,
  onDragLock,
  onMistake,
}: {
  step: FlowStep;
  color: PetColorId;
  selected: string[];
  onToggle: (id: string) => void;
  askBalance: boolean;
  numberValue: string;
  onNumber: (value: string) => void;
  cardIndex: number;
  onChoose: (cards: SwipeCard[], agree: boolean) => void;
  pick: SavingsChoiceId;
  onPick: (id: SavingsChoiceId) => void;
  priorityRef: RefObject<PriorityHandle | null>;
  payRef: RefObject<PayHandle | null>;
  onPayPhase: (phase: PayPhase) => void;
  onSorted: () => void;
  onDragLock: (locked: boolean) => void;
  onMistake: () => void;
}) {
  if (step.kind === "cover" || step.kind === "story") {
    return (
      <View>
        {step.kind === "cover" ? (
          <Text style={styles.kicker}>{step.kicker}</Text>
        ) : null}
        <Text style={styles.title}>{step.title}</Text>
        {step.body ? <Text style={styles.body}>{step.body}</Text> : null}
        {step.kind === "cover" && step.week ? <WeekRow /> : null}
        <ArtView
          art={step.art}
          color={color}
          compact={step.kind === "cover" && !!step.marks}
        />
        {step.kind === "cover" && step.marks ? (
          <View style={[styles.marks, styles.marksCompact]}>
            <Image source={crossArt} style={styles.mark} resizeMode="contain" />
            <View style={styles.markDivider} />
            <Image source={checkArt} style={styles.mark} resizeMode="contain" />
          </View>
        ) : null}
      </View>
    );
  }
  if (step.kind === "groups") {
    return (
      <View>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
        {step.groups.map((group) => (
          <View key={group.label} style={styles.group}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            {group.lines.map((line) => (
              <Text key={line} style={styles.groupLine}>
                • {line}
              </Text>
            ))}
          </View>
        ))}
      </View>
    );
  }
  if (step.kind === "goal") {
    return (
      <View>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
        <ArtView art="pet" color={color} />
      </View>
    );
  }
  if (step.kind === "shop") {
    if (askBalance) {
      return (
        <View>
          <Text style={styles.title}>Сколько монет останется у Финни?</Text>
          <Text style={styles.body}>Покупки уже в корзине. Введи остаток.</Text>
          <Keypad value={numberValue} onChange={onNumber} />
        </View>
      );
    }
    const spent = step.items
      .filter((item) => selected.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
    return (
      <View>
        <View style={styles.purse}>
          <Text style={styles.purseText}>
            {step.purseLabel}: {step.purse - spent}
          </Text>
          <Image source={coin1} style={styles.purseCoin} resizeMode="contain" />
        </View>
        <View style={styles.grid}>
          {step.items.map((item) => {
            const on = selected.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => onToggle(item.id)}
                style={[styles.itemCard, on && styles.itemOn]}
              >
                <Image
                  source={item.image}
                  style={styles.itemImage}
                  resizeMode="contain"
                />
                <Text style={styles.itemLabel}>{item.label}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{item.price}</Text>
                  <Image
                    source={coin1}
                    style={styles.priceCoin}
                    resizeMode="contain"
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.basketWrap}>
          <Image
            source={basketArt}
            style={styles.basket}
            resizeMode="contain"
          />
          <View style={styles.basketItems}>
            {step.items
              .filter((item) => selected.includes(item.id))
              .map((item) => (
                <Image
                  key={item.id}
                  source={item.image}
                  style={styles.basketIcon}
                  resizeMode="contain"
                />
              ))}
          </View>
        </View>
      </View>
    );
  }
  if (step.kind === "priority") {
    return <PriorityBoard ref={priorityRef} onDragLock={onDragLock} />;
  }
  if (step.kind === "swipe") {
    const card = step.cards[cardIndex];
    if (!card) return null;
    return (
      <View>
        <Text style={styles.body}>
          Смахивай верные утверждения вправо, а неверные — влево.
        </Text>
        <SwipeCardView
          text={card.text}
          onChoose={(agree) => onChoose(step.cards, agree)}
        />
      </View>
    );
  }
  if (step.kind === "pick") {
    return (
      <View>
        <Text style={styles.title}>Выбери финансовую цель</Text>
        {savingsChoices.map((item) => {
          const on = pick === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onPick(item.id)}
              style={styles.radio}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
            >
              <View style={[styles.dot, on && styles.dotOn]}>
                {on ? <Text style={styles.radioCheck}>✓</Text> : null}
              </View>
              <Text style={styles.radioLabel}>{item.name}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }
  if (step.kind === "weekly") {
    const choice =
      savingsChoices.find((item) => item.id === pick) ?? savingsChoices[0]!;
    return (
      <View>
        <Image
          source={choice.card}
          style={styles.heroCard}
          resizeMode="contain"
        />
        <Text style={styles.title}>{choice.name} стоит 70</Text>
        <Text style={styles.body}>
          У тебя есть 20. Сколько монет нужно откладывать в неделю, чтобы купить{" "}
          {choice.name.toLowerCase()} через 5 недель?
        </Text>
        <Keypad value={numberValue} onChange={onNumber} />
      </View>
    );
  }
  if (step.kind === "sort")
    return (
      <CoinSortBoard
        onDragLock={onDragLock}
        onSolved={onSorted}
        onMistake={onMistake}
      />
    );
  if (step.kind === "pay")
    return <PayBoard ref={payRef} onPhase={onPayPhase} />;
  return null;
}

function ArtView({
  art,
  color,
  compact = false,
}: {
  art?: Art;
  color: PetColorId;
  compact?: boolean;
}) {
  if (!art) return null;
  if (art === "pet") {
    return (
      <View style={[styles.pet, compact && styles.petCompact]}>
        <PetWithHat color={color} emotion="happy" forceChild />
      </View>
    );
  }
  return (
    <Image
      source={art}
      style={[styles.hero, compact && styles.heroCompact]}
      resizeMode="contain"
    />
  );
}

function WeekRow() {
  return (
    <View style={styles.week}>
      {WEEKDAYS.map((day) => (
        <View key={day} style={styles.weekDay}>
          <View style={styles.weekDot} />
          <Text style={styles.weekLabel}>{day}</Text>
        </View>
      ))}
    </View>
  );
}

function ResultView({ sheet }: { sheet: Sheet }) {
  const icon = sheet.tone === "bad" ? crossArt : checkArt;
  return (
    <View style={styles.result}>
      <Image source={icon} style={styles.resultIcon} resizeMode="contain" />
      <Text style={styles.sheetTitle}>{sheet.title}</Text>
      {sheet.body ? <Text style={styles.body}>{sheet.body}</Text> : null}
    </View>
  );
}

function Keypad({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const press = (key: string) => {
    if (key === "⌫") onChange(value.slice(0, -1));
    else if (key === "C") onChange("");
    else if (value.length < 4) onChange(value + key);
  };
  return (
    <View>
      <View style={styles.answer}>
        <Text style={styles.answerText}>{value || "|"}</Text>
      </View>
      <View style={styles.keys}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map(
          (key) => (
            <Pressable key={key} onPress={() => press(key)} style={styles.key}>
              <Text style={styles.keyText}>{key}</Text>
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}

function SwipeCardView({
  text,
  onChoose,
}: {
  text: string;
  onChoose: (agree: boolean) => void;
}) {
  const chooseRef = useRef(onChoose);
  chooseRef.current = onChoose;
  const startX = useRef(0);
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 12 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        startX.current = event.nativeEvent.pageX;
      },
      onPanResponderRelease: (event) => {
        const dx = event.nativeEvent.pageX - startX.current;
        if (dx > 64) chooseRef.current(true);
        else if (dx < -64) chooseRef.current(false);
      },
    }),
  ).current;
  return (
    <View>
      <View {...pan.panHandlers} style={styles.swipeCard}>
        <Text style={styles.swipeText}>{text}</Text>
      </View>
      <View style={styles.marks}>
        <Pressable onPress={() => onChoose(false)} accessibilityLabel="Неверно">
          <Image source={crossArt} style={styles.mark} resizeMode="contain" />
        </Pressable>
        <View style={styles.markDivider} />
        <Pressable onPress={() => onChoose(true)} accessibilityLabel="Верно">
          <Image source={checkArt} style={styles.mark} resizeMode="contain" />
        </Pressable>
      </View>
    </View>
  );
}

function CoinChip({ value, size = 48 }: { value: number; size?: number }) {
  const art = COIN_ART[value];
  if (art)
    return (
      <Image
        source={art}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  const blue = value === 10;
  return (
    <View
      style={[
        styles.coinFallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: blue ? "#3C7AD6" : "#E2A423",
        },
      ]}
    >
      <Text style={styles.coinFallbackText}>{value}</Text>
    </View>
  );
}

type PriorityHandle = { nowIds: () => string[] };
type LaneId = "now" | "later";
type Rect = { x: number; y: number; w: number; h: number };
type DropHint = { lane: LaneId; index: number };
const LANE_STRIDE = 72;

function measureNode(node: View | null): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (!node) {
      resolve(null);
      return;
    }
    node.measureInWindow((x, y, w, h) =>
      resolve(w === 0 && h === 0 ? null : { x, y, w, h }),
    );
  });
}

function pointInRect(x: number, y: number, rect: Rect, slop = 24) {
  return (
    x >= rect.x - slop &&
    x <= rect.x + rect.w + slop &&
    y >= rect.y - slop &&
    y <= rect.y + rect.h + slop
  );
}

function insertionIndex(
  ids: string[],
  draggingId: string | null,
  gapAt: number | null,
  top: number,
  fingerY: number,
) {
  const slots: { index: number; y: number }[] = [];
  let y = top;
  const addSlot = (slot: number) => {
    slots.push({ index: slot, y });
    if (gapAt === slot) y += LANE_STRIDE;
  };
  addSlot(0);
  let visible = 0;
  for (const entry of ids) {
    if (entry === draggingId) continue;
    y += LANE_STRIDE;
    visible += 1;
    addSlot(visible);
  }
  for (let i = 0; i < slots.length; i += 1) {
    const end =
      i + 1 < slots.length ? slots[i + 1]!.y : slots[i]!.y + LANE_STRIDE;
    if (fingerY < end) return slots[i]!.index;
  }
  return slots[slots.length - 1]?.index ?? 0;
}

const PriorityBoard = forwardRef<
  PriorityHandle,
  { onDragLock: (locked: boolean) => void }
>(function PriorityBoard({ onDragLock }, ref) {
  const [lanes, setLanes] = useState<{ now: string[]; later: string[] }>({
    now: [],
    later: priorityItems.map((item) => item.id),
  });
  const [hint, setHint] = useState<DropHint | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{
    id: string;
    w: number;
    h: number;
  } | null>(null);
  const lanesRef = useRef(lanes);
  const hintRef = useRef(hint);
  const draggingRef = useRef(dragging);
  lanesRef.current = lanes;
  hintRef.current = hint;
  draggingRef.current = dragging;
  const nowRef = useRef<View>(null);
  const laterRef = useRef<View>(null);
  const nowItemsRef = useRef<View>(null);
  const laterItemsRef = useRef<View>(null);
  const boardRef = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0 });
  const ghostXY = useRef(new Animated.ValueXY()).current;
  const grab = useRef({ dx: 0, dy: 0 });
  const hintGen = useRef(0);
  useImperativeHandle(ref, () => ({ nowIds: () => lanesRef.current.now }), []);

  const rememberHint = (next: DropHint | null) => {
    hintRef.current = next;
    setHint(next);
  };

  const updateHint = (x: number, y: number) => {
    const gen = ++hintGen.current;
    Promise.all([
      measureNode(nowRef.current),
      measureNode(laterRef.current),
      measureNode(nowItemsRef.current),
      measureNode(laterItemsRef.current),
    ]).then(([nowBox, laterBox, nowItems, laterItems]) => {
      if (gen !== hintGen.current) return;
      const nowIn = nowBox ? pointInRect(x, y, nowBox) : false;
      const laterIn = laterBox ? pointInRect(x, y, laterBox) : false;
      let lane: LaneId | null = null;
      if (nowIn && laterIn && nowBox && laterBox) {
        lane =
          Math.abs(y - (nowBox.y + nowBox.h / 2)) <=
          Math.abs(y - (laterBox.y + laterBox.h / 2))
            ? "now"
            : "later";
      } else if (nowIn) lane = "now";
      else if (laterIn) lane = "later";
      if (!lane) {
        if (hintRef.current) rememberHint(null);
        return;
      }
      const itemsRect = lane === "now" ? nowItems : laterItems;
      const gapAt =
        hintRef.current?.lane === lane ? hintRef.current.index : null;
      const nextIndex = itemsRect
        ? insertionIndex(
            lanesRef.current[lane],
            draggingRef.current,
            gapAt,
            itemsRect.y,
            y,
          )
        : 0;
      if (hintRef.current?.lane === lane && hintRef.current.index === nextIndex)
        return;
      rememberHint({ lane, index: nextIndex });
    });
  };

  const startDrag = (
    itemId: string,
    rect: Rect,
    pageX: number,
    pageY: number,
  ) => {
    const rootX = origin.current.x;
    const rootY = origin.current.y;
    grab.current = { dx: pageX - rect.x, dy: pageY - rect.y };
    ghostXY.setValue({ x: rect.x - rootX, y: rect.y - rootY });
    setGhost({ id: itemId, w: rect.w, h: rect.h });
    draggingRef.current = itemId;
    setDragging(itemId);
  };

  const moveDrag = (pageX: number, pageY: number) => {
    ghostXY.setValue({
      x: pageX - grab.current.dx - origin.current.x,
      y: pageY - grab.current.dy - origin.current.y,
    });
    updateHint(pageX, pageY);
  };

  const endDrag = (moved: boolean, itemId: string) => {
    hintGen.current += 1;
    onDragLock(false);
    const drop = hintRef.current;
    if (!moved) {
      setLanes((prev) => {
        if (prev.now.includes(itemId))
          return {
            now: prev.now.filter((entry) => entry !== itemId),
            later: [...prev.later, itemId],
          };
        return {
          now: [...prev.now, itemId],
          later: prev.later.filter((entry) => entry !== itemId),
        };
      });
    } else if (drop) {
      setLanes((prev) => {
        const now = prev.now.filter((entry) => entry !== itemId);
        const later = prev.later.filter((entry) => entry !== itemId);
        const target = drop.lane === "now" ? now : later;
        target.splice(
          Math.max(0, Math.min(drop.index, target.length)),
          0,
          itemId,
        );
        return drop.lane === "now"
          ? { now: target, later }
          : { now, later: target };
      });
    }
    rememberHint(null);
    draggingRef.current = null;
    setDragging(null);
    setGhost(null);
  };

  const renderLane = (lane: LaneId) => {
    const ids = lanes[lane];
    const gapAt = hint?.lane === lane ? hint.index : null;
    const nodes: ReactNode[] = [];
    let seen = 0;
    ids.forEach((entry) => {
      const item = priorityItems.find((row) => row.id === entry);
      if (!item) return;
      if (entry === dragging) {
        nodes.push(
          <DragRow
            key={item.id}
            item={item}
            lifted
            onDragLock={onDragLock}
            onStart={(rect, pageX, pageY) =>
              startDrag(item.id, rect, pageX, pageY)
            }
            onMove={moveDrag}
            onEnd={(moved) => endDrag(moved, item.id)}
          />,
        );
        return;
      }
      if (gapAt === seen)
        nodes.push(
          <View key={`gap-${lane}-${seen}`} style={styles.gap}>
            <Text style={styles.gapText}>Сюда</Text>
          </View>,
        );
      nodes.push(
        <DragRow
          key={item.id}
          item={item}
          lifted={false}
          onDragLock={onDragLock}
          onStart={(rect, pageX, pageY) =>
            startDrag(item.id, rect, pageX, pageY)
          }
          onMove={moveDrag}
          onEnd={(moved) => endDrag(moved, item.id)}
        />,
      );
      seen += 1;
    });
    if (gapAt === seen)
      nodes.push(
        <View key={`gap-${lane}-end`} style={styles.gap}>
          <Text style={styles.gapText}>Сюда</Text>
        </View>,
      );
    if (seen === 0 && gapAt === null)
      nodes.push(
        <Text key="empty" style={styles.emptyLane}>
          Перетащи сюда
        </Text>,
      );
    return nodes;
  };

  const ghostItem = priorityItems.find((item) => item.id === ghost?.id);
  return (
    <View
      ref={boardRef}
      onLayout={() =>
        boardRef.current?.measureInWindow((x, y) => {
          origin.current = { x, y };
        })
      }
    >
      <Text style={styles.title}>Сверху должны быть самые важные предметы</Text>
      <View
        ref={nowRef}
        style={[styles.lane, hint?.lane === "now" && styles.laneHot]}
      >
        <Text style={styles.laneTitle}>Сейчас</Text>
        <View ref={nowItemsRef}>{renderLane("now")}</View>
      </View>
      <View
        ref={laterRef}
        style={[styles.lane, hint?.lane === "later" && styles.laneHot]}
      >
        <Text style={styles.laneTitle}>Позже</Text>
        <View ref={laterItemsRef}>{renderLane("later")}</View>
      </View>
      {ghost && ghostItem ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.row,
            styles.ghost,
            {
              width: ghost.w,
              height: ghost.h,
              transform: ghostXY.getTranslateTransform(),
            },
          ]}
        >
          <RowBody item={ghostItem} />
        </Animated.View>
      ) : null}
    </View>
  );
});

function RowBody({ item }: { item: ShopItem }) {
  return (
    <>
      <Image source={item.image} style={styles.rowImage} resizeMode="contain" />
      <Text style={styles.rowPrice}>{item.price}</Text>
      <Text style={styles.rowLabel}>{item.label}</Text>
      <Text style={styles.handle}>≡</Text>
    </>
  );
}

function DragRow({
  item,
  lifted,
  onDragLock,
  onStart,
  onMove,
  onEnd,
}: {
  item: ShopItem;
  lifted: boolean;
  onDragLock: (locked: boolean) => void;
  onStart: (rect: Rect, pageX: number, pageY: number) => void;
  onMove: (pageX: number, pageY: number) => void;
  onEnd: (moved: boolean) => void;
}) {
  const viewRef = useRef<View>(null);
  const start = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const api = useRef({ onDragLock, onStart, onMove, onEnd });
  api.current = { onDragLock, onStart, onMove, onEnd };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event) => {
        moved.current = false;
        start.current = {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
        };
        api.current.onDragLock(true);
        viewRef.current?.measureInWindow((x, y, w, h) => {
          api.current.onStart(
            { x, y, w, h },
            event.nativeEvent.pageX,
            event.nativeEvent.pageY,
          );
        });
      },
      onPanResponderMove: (event) => {
        const dx = event.nativeEvent.pageX - start.current.x;
        const dy = event.nativeEvent.pageY - start.current.y;
        if (Math.hypot(dx, dy) > 8) moved.current = true;
        api.current.onMove(event.nativeEvent.pageX, event.nativeEvent.pageY);
      },
      onPanResponderRelease: () => {
        api.current.onEnd(moved.current);
      },
      onPanResponderTerminate: () => {
        api.current.onEnd(true);
      },
    }),
  ).current;
  return (
    <View
      ref={viewRef}
      {...pan.panHandlers}
      style={[styles.row, lifted && styles.liftedRow]}
    >
      <RowBody item={item} />
    </View>
  );
}

function CoinSortBoard({
  onDragLock,
  onSolved,
  onMistake,
}: {
  onDragLock: (locked: boolean) => void;
  onSolved: () => void;
  onMistake: () => void;
}) {
  const [sorted, setSorted] = useState<string[]>([]);
  const [hover, setHover] = useState<1 | 3 | 5 | null>(null);
  const solvedRef = useRef(false);
  const piggyRefs = useRef<Record<number, View | null>>({});
  const onSolvedRef = useRef(onSolved);
  onSolvedRef.current = onSolved;

  useEffect(() => {
    if (!solvedRef.current && sorted.length === SORT_COINS.length) {
      solvedRef.current = true;
      onSolvedRef.current();
    }
  }, [sorted.length]);

  const dropOn = async (value: 1 | 3 | 5, pageX: number, pageY: number) => {
    const boxes = await Promise.all(
      PIGGIES.map(async (piggy) => ({
        value: piggy.value,
        box: await measureNode(piggyRefs.current[piggy.value] ?? null),
      })),
    );
    const hit = boxes.find(
      (entry) => entry.box && pointInRect(pageX, pageY, entry.box, 28),
    );
    setHover(null);
    if (!hit) return "miss" as const;
    if (hit.value !== value) {
      onMistake();
      return "wrong" as const;
    }
    return "ok" as const;
  };

  return (
    <View>
      <Text style={styles.title}>Разложи монеты по копилкам</Text>
      <View style={styles.coinField}>
        {SORT_COINS.filter((coin) => !sorted.includes(coin.id)).map((coin) => (
          <SortCoin
            key={coin.id}
            coin={coin}
            onDragLock={onDragLock}
            onHover={async (pageX, pageY) => {
              const boxes = await Promise.all(
                PIGGIES.map(async (piggy) => ({
                  value: piggy.value,
                  box: await measureNode(
                    piggyRefs.current[piggy.value] ?? null,
                  ),
                })),
              );
              const hit = boxes.find(
                (entry) =>
                  entry.box && pointInRect(pageX, pageY, entry.box, 28),
              );
              setHover(hit && hit.value === coin.value ? hit.value : null);
            }}
            onDrop={async (pageX, pageY) => {
              const result = await dropOn(coin.value, pageX, pageY);
              if (result === "ok")
                setSorted((items) =>
                  items.includes(coin.id) ? items : [...items, coin.id],
                );
              else setHover(null);
              return result === "ok";
            }}
          />
        ))}
      </View>
      <View style={styles.piggyRow}>
        {PIGGIES.map((piggy) => (
          <View
            key={piggy.value}
            ref={(node) => {
              piggyRefs.current[piggy.value] = node;
            }}
            style={[styles.piggy, hover === piggy.value && styles.piggyHot]}
          >
            <Image
              source={piggy.image}
              style={styles.piggyImage}
              resizeMode="contain"
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function SortCoin({
  coin,
  onDragLock,
  onHover,
  onDrop,
}: {
  coin: { id: string; value: 1 | 3 | 5; left: number; top: number };
  onDragLock: (locked: boolean) => void;
  onHover: (pageX: number, pageY: number) => void;
  onDrop: (pageX: number, pageY: number) => Promise<boolean>;
}) {
  const shake = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.ValueXY()).current;
  const api = useRef({ onDragLock, onHover, onDrop });
  api.current = { onDragLock, onHover, onDrop };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        api.current.onDragLock(true);
        drag.setOffset({ x: 0, y: 0 });
        drag.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (event, gesture) => {
        drag.setValue({ x: gesture.dx, y: gesture.dy });
        api.current.onHover(event.nativeEvent.pageX, event.nativeEvent.pageY);
      },
      onPanResponderRelease: (event) => {
        api.current.onDragLock(false);
        void api.current
          .onDrop(event.nativeEvent.pageX, event.nativeEvent.pageY)
          .then((ok) => {
            drag.setValue({ x: 0, y: 0 });
            if (!ok) {
              shake.setValue(0);
              Animated.sequence([
                Animated.timing(shake, {
                  toValue: 1,
                  duration: 60,
                  useNativeDriver: true,
                }),
                Animated.timing(shake, {
                  toValue: -1,
                  duration: 70,
                  useNativeDriver: true,
                }),
                Animated.timing(shake, {
                  toValue: 0,
                  duration: 60,
                  useNativeDriver: true,
                }),
              ]).start();
            }
          });
      },
      onPanResponderTerminate: () => {
        api.current.onDragLock(false);
        drag.setValue({ x: 0, y: 0 });
      },
    }),
  ).current;
  const wobble = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-14, 14],
  });
  return (
    <Animated.View
      {...pan.panHandlers}
      style={[
        styles.sortCoin,
        {
          left: coin.left,
          top: coin.top,
          transform: [
            { translateX: drag.x },
            { translateY: drag.y },
            { translateX: wobble },
          ],
        },
      ]}
    >
      <CoinChip value={coin.value} size={62} />
    </Animated.View>
  );
}

type PayHandle = { commit: () => PayResult };

const PayBoard = forwardRef<PayHandle, { onPhase: (phase: PayPhase) => void }>(
  function PayBoard({ onPhase }, ref) {
    const [paid, setPaid] = useState<number[]>([]);
    const [change, setChange] = useState<number[]>([]);
    const [phase, setPhase] = useState<PayPhase>("pay");
    const paidRef = useRef(paid);
    const changeRef = useRef(change);
    const phaseRef = useRef(phase);
    paidRef.current = paid;
    changeRef.current = change;
    phaseRef.current = phase;

    useImperativeHandle(
      ref,
      () => ({
        commit: () => {
          const paidSum = paidRef.current.reduce(
            (sum, value) => sum + value,
            0,
          );
          if (phaseRef.current === "pay") {
            if (paidSum < 75) return "short";
            if (paidSum === 75) return "exact";
            phaseRef.current = "change";
            setPhase("change");
            setChange([]);
            onPhase("change");
            return "over";
          }
          const changeSum = changeRef.current.reduce(
            (sum, value) => sum + value,
            0,
          );
          return changeSum === paidSum - 75 ? "change-ok" : "change-bad";
        },
      }),
      [onPhase],
    );

    const coins = phase === "pay" ? paid : change;
    const add = (value: number) => {
      if (phase === "pay") setPaid((items) => [...items, value]);
      else setChange((items) => [...items, value]);
    };
    const removeAt = (indexToRemove: number) => {
      const update = (items: number[]) =>
        items.filter((_, index) => index !== indexToRemove);
      if (phase === "pay") setPaid(update);
      else setChange(update);
    };
    const paidSum = paid.reduce((sum, value) => sum + value, 0);

    return (
      <View>
        <Text style={styles.title}>
          {phase === "pay"
            ? "Ролики стоят 75 монет"
            : "Ты заплатил больше, чем стоит товар"}
        </Text>
        {phase === "change" ? (
          <Text style={styles.body}>
            Оплачено {paidSum}. Сдача должна быть {paidSum - 75}. Какая должна
            быть сдача?
          </Text>
        ) : null}
        <View style={styles.trayWrap}>
          <Image source={trayArt} style={styles.tray} resizeMode="contain" />
          <View style={styles.trayCoins}>
            {coins.map((value, index) => (
              <Pressable
                key={`${value}-${index}`}
                onPress={() => removeAt(index)}
              >
                <CoinChip value={value} size={42} />
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.coinChoices}>
          {PAY_VALUES.map((value) => (
            <Pressable
              key={value}
              onPress={() => add(value)}
              style={styles.coinChoice}
              accessibilityLabel={`Монета ${value}`}
            >
              <CoinChip value={value} size={44} />
            </Pressable>
          ))}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F4F4" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 12,
  },
  close: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: { width: 18, height: 18 },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#E4E0DC",
    overflow: "hidden",
  },
  fill: { height: 8, borderRadius: 8, backgroundColor: "#3A2418" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 120 },
  kicker: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: "#6E625A",
    textAlign: "right",
    marginBottom: 12,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    color: "#24160F",
    lineHeight: 32,
  },
  body: {
    marginTop: 12,
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
    color: "#3C312B",
  },
  hero: { width: "100%", height: 230, marginTop: 22 },
  heroCompact: { height: 160, marginTop: 8 },
  heroCard: { width: "100%", height: 180, marginBottom: 8 },
  pet: {
    height: 230,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  petCompact: { height: 175, marginTop: 0 },
  week: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  weekDay: { alignItems: "center", gap: 6 },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E7E2DE",
  },
  weekLabel: { fontFamily: fontFamily.medium, fontSize: 11, color: "#6D625B" },
  marks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
    marginTop: 18,
  },
  marksCompact: { marginTop: 2 },
  mark: { width: 64, height: 64 },
  markDivider: { width: 1, height: 36, backgroundColor: "#D5D0CC" },
  group: { marginTop: 16 },
  groupLabel: { fontFamily: fontFamily.bold, fontSize: 16, color: "#24160F" },
  groupLine: {
    marginTop: 4,
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: "#4A3D36",
  },
  purse: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  purseText: { fontFamily: fontFamily.bold, fontSize: 16, color: "#24160F" },
  purseCoin: { width: 22, height: 22 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  itemCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  itemOn: { borderColor: "#3A2418" },
  itemImage: { width: 72, height: 72 },
  itemLabel: {
    marginTop: 6,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: "#24160F",
    textAlign: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  price: { fontFamily: fontFamily.bold, fontSize: 14, color: "#3A2418" },
  priceCoin: { width: 16, height: 16 },
  basketWrap: {
    marginTop: 18,
    height: 150,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  basket: { width: 180, height: 140 },
  basketItems: {
    position: "absolute",
    top: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    width: 120,
    justifyContent: "center",
  },
  basketIcon: { width: 36, height: 36 },
  footer: { position: "absolute", left: 20, right: 20, bottom: 18 },
  arrowButton: {
    position: "absolute",
    right: 20,
    bottom: 18,
    width: 64,
    height: 64,
  },
  arrowIcon: { width: 64, height: 64 },
  result: { alignItems: "center", paddingTop: 48 },
  resultIcon: { width: 84, height: 84, marginBottom: 18 },
  sheetTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: "#24160F",
    textAlign: "center",
    lineHeight: 30,
  },
  answer: {
    marginTop: 16,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  answerText: { fontFamily: fontFamily.bold, fontSize: 28, color: "#24160F" },
  keys: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  key: {
    width: "31%",
    height: 52,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: { fontFamily: fontFamily.bold, fontSize: 20, color: "#24160F" },
  radio: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 10 },
  radioLabel: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: "#24160F",
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7C7069",
    alignItems: "center",
    justifyContent: "center",
  },
  dotOn: { borderColor: "#3A2418" },
  radioCheck: {
    color: "#3A2418",
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 20,
  },
  swipeCard: {
    marginTop: 28,
    minHeight: 160,
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },
  swipeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 26,
    color: "#24160F",
    textAlign: "center",
  },
  lane: {
    marginTop: 14,
    borderRadius: 16,
    padding: 10,
    backgroundColor: "#EFECEA",
    minHeight: 92,
  },
  laneHot: { backgroundColor: "#E4DDD4", minHeight: 150 },
  laneTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: "#24160F",
    marginBottom: 8,
  },
  row: {
    height: 64,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 8,
  },
  liftedRow: {
    position: "absolute",
    opacity: 0,
    left: 0,
    right: 0,
    marginBottom: 0,
  },
  rowImage: { width: 42, height: 42 },
  rowPrice: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: "#24160F",
    width: 28,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: "#24160F",
  },
  handle: { fontSize: 20, color: "#8A7D74" },
  gap: {
    height: 64,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#8A7363",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F3EE",
  },
  gapText: { fontFamily: fontFamily.bold, color: "#6C584C" },
  emptyLane: {
    fontFamily: fontFamily.medium,
    color: "#8A7D74",
    paddingVertical: 12,
  },
  ghost: { position: "absolute", opacity: 0.92 },
  coinField: { height: 260, marginTop: 12 },
  sortCoin: { position: "absolute" },
  piggyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  piggy: {
    width: 104,
    height: 92,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  piggyHot: { transform: [{ scale: 1.12 }] },
  piggyImage: { width: 96, height: 84 },
  trayWrap: {
    marginTop: 16,
    height: 210,
    alignItems: "center",
    justifyContent: "center",
  },
  tray: { width: 260, height: 190 },
  trayCoins: {
    position: "absolute",
    width: 180,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  coinChoices: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  coinChoice: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  coinFallback: { alignItems: "center", justifyContent: "center" },
  coinFallbackText: {
    fontFamily: fontFamily.bold,
    color: "#fff",
    fontSize: 14,
  },
});
