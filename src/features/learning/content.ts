import type { ImageSourcePropType } from 'react-native';
import backpack from '@/assets/library/learning/items/backpack.png';
import thingsPile from '@/assets/library/learning/items/things-pile.png';
import bicycle from '@/assets/library/learning/items/bicycle.png';
import bankCard from '@/assets/library/learning/items/bank-card.png';
import handCoins from '@/assets/library/learning/items/hand-coins.png';
import subtraction from '@/assets/library/learning/items/subtraction.png';
import division from '@/assets/library/learning/items/division-count.png';
import elephant from '@/assets/library/learning/lesson/purple-elephant-card.png';
import piggyBank from '@/assets/library/learning/items/piggy-bank-5.png';

export type ChapterId = 'budget' | 'savings' | 'payments';
export type LessonKind = 'budget-select' | 'priority' | 'trip' | 'truth' | 'goal' | 'weekly-save' | 'sort-coins' | 'purchase-balance' | 'coinpay-change';
export type LessonType = 'theory' | 'test' | 'repetition';

export type LessonDefinition = {
  id: string;
  type: LessonType;
  chapter: ChapterId;
  number: number;
  title: string;
  kicker: string;
  introTitle: string;
  introText: string;
  image?: ImageSourcePropType;
  theory: { title: string; text: string; image?: ImageSourcePropType }[];
  kind: LessonKind;
};

export const CHAPTERS: { id: ChapterId; title: string; subtitle: string; color: string; lessons: string[] }[] = [
  { id: 'budget', title: 'Бюджет', subtitle: 'Учимся распределять деньги', color: '#E58B28', lessons: ['budget-1', 'budget-2', 'budget-3', 'budget-4'] },
  { id: 'savings', title: 'Сбережения', subtitle: 'Превращаем мечты в цели', color: '#B11969', lessons: ['savings-1', 'savings-2', 'savings-3', 'savings-4'] },
  { id: 'payments', title: 'Платежи и покупки', subtitle: 'Считаем и покупаем безопасно', color: '#2367B3', lessons: ['payments-1', 'payments-2', 'payments-3'] },
];

export const LESSONS: LessonDefinition[] = [
  {
    id: 'budget-1', type: 'theory', chapter: 'budget', number: 1, kicker: 'Глава 1, Урок 1', title: 'Как распределять монеты?',
    introTitle: 'Как распределять монеты?',
    introText: 'На всё сразу денег не хватит, но ими можно управлять. Бюджет помогает решить, что купить сейчас, что оставить на потом и сколько отложить.',
    image: thingsPile,
    theory: [
      { title: 'Сначала — необходимое', text: 'Еда, здоровье и уход идут первыми: без них трудно обойтись.' },
      { title: 'Потом — желания', text: 'Игрушки, сладости и развлечения можно добавить, если после важного денег хватает.' },
      { title: 'И не забудь про цель', text: 'Часть монет можно оставить на большую покупку, которую хочется сделать позже.' },
    ],
    kind: 'budget-select',
  },
  {
    id: 'budget-2', type: 'test', chapter: 'budget', number: 2, kicker: 'Глава 1, Урок 2', title: 'Распредели бюджет на неделю',
    introTitle: 'До учёбы — 2 дня',
    introText: 'У Финни 75 монет. Разложи покупки на «Сейчас» и «Позже». К учёбе обязательно должны быть готовы ручка и тетрадь.',
    image: thingsPile,
    theory: [{ title: 'Смотри на ближайшую задачу', text: 'В первую очередь покупай то, без чего нельзя выполнить ближайшую важную задачу. Остальное может подождать.' }],
    kind: 'priority',
  },
  {
    id: 'budget-3', type: 'test', chapter: 'budget', number: 3, kicker: 'Глава 1, Урок 3', title: 'Собираемся в поход!',
    introTitle: 'Собираемся в поход!',
    introText: 'У Финни 125 монет. Купи всё необходимое и обязательно оставь 30 монет на дорогу домой.',
    image: backpack,
    theory: [{ title: 'Сначала отложи обязательное', text: 'Перед покупками заранее оставь деньги на расход, который точно понадобится позже. В этом задании — 30 монет на обратную дорогу.' }],
    kind: 'trip',
  },
  {
    id: 'budget-4', type: 'repetition', chapter: 'budget', number: 4, kicker: 'Глава 1, Урок 4', title: 'Карточки про бюджет',
    introTitle: 'Финни приготовил карточки',
    introText: 'Определи, верное утверждение или нет. Так мы проверим главные правила бюджета.',
    image: thingsPile,
    theory: [{ title: 'Перед началом', text: 'Вспомни: бюджет — это план, важное идёт первым, а на большую покупку можно копить заранее.' }],
    kind: 'truth',
  },
  {
    id: 'savings-1', type: 'theory', chapter: 'savings', number: 1, kicker: 'Глава 2, Урок 1', title: 'Мечта и цель: в чём разница?',
    introTitle: 'Мечта и цель: в чём разница?',
    introText: 'Мечта — это то, чего хочется. Цель — мечта, у которой есть цена, срок и понятный план накоплений.',
    image: elephant,
    theory: [
      { title: 'Пример', text: 'Если велосипед стоит 10 000 ₽ и хочется купить его через 10 месяцев, можно откладывать по 1 000 ₽ каждый месяц.', image: bicycle },
      { title: 'Как превратить мечту в цель?', text: 'Выбери покупку, узнай стоимость, определи срок и посчитай регулярный взнос.', image: division },
    ],
    kind: 'goal',
  },
  {
    id: 'savings-2', type: 'test', chapter: 'savings', number: 2, kicker: 'Глава 2, Урок 2', title: 'Сформируй сбережения Финни',
    introTitle: 'Выбери финансовую цель',
    introText: 'Цель стоит 70 монет. У Финни уже есть 20. Он хочет накопить недостающую сумму за 5 недель.',
    image: bicycle,
    theory: [{ title: 'Сколько откладывать?', text: 'Сначала найди, сколько ещё не хватает: 70 − 20. Затем раздели остаток на 5 недель.' }],
    kind: 'weekly-save',
  },
  {
    id: 'savings-3', type: 'test', chapter: 'savings', number: 3, kicker: 'Глава 2, Урок 3', title: 'Рассортируй сбережения Финни',
    introTitle: 'Разложи монеты по копилкам',
    introText: 'Перетащи монеты номиналом 1, 3 и 5 в копилки с таким же числом. Если ошибёшься, монета вернётся назад.',
    image: piggyBank,
    theory: [{ title: 'Будь внимателен', text: 'Номинал показывает стоимость монеты. Сортировка помогает быстрее считать накопления.' }],
    kind: 'sort-coins',
  },
  {
    id: 'savings-4', type: 'repetition', chapter: 'savings', number: 4, kicker: 'Глава 2, Урок 4', title: 'Карточки про сбережения',
    introTitle: 'Верно или неверно?',
    introText: 'Определи, какие привычки действительно помогают накопить на цель.',
    image: piggyBank,
    theory: [{ title: 'Главное', text: 'Цель, понятная сумма и регулярность помогают превращать небольшие взносы в большую покупку.' }],
    kind: 'truth',
  },
  {
    id: 'payments-1', type: 'theory', chapter: 'payments', number: 1, kicker: 'Глава 3, Урок 1', title: 'Как не потратить лишнее',
    introTitle: 'Что происходит при покупке?',
    introText: 'Покупка — это обмен денег на то, что тебе нужно. Перед оплатой проверь цену и свой баланс.',
    image: bankCard,
    theory: [
      { title: 'Остаток и сдача', text: 'Если товар стоит 100, а у тебя 150, после покупки останется 50. Если наличными отдал больше цены, продавец возвращает сдачу.', image: subtraction },
      { title: 'Оплата картой', text: 'Карта связана с банковским счётом. Терминал проверяет покупку, а банк списывает нужную сумму. Секретные коды никому не сообщают.', image: bankCard },
    ],
    kind: 'purchase-balance',
  },
  {
    id: 'payments-2', type: 'test', chapter: 'payments', number: 2, kicker: 'Глава 3, Урок 2', title: 'Заплати за ролики',
    introTitle: 'Ролики стоят 75 монет',
    introText: 'Собери сумму монетами 1, 3, 5, 10 и 50. Если заплатишь больше, рассчитай сдачу.',
    image: handCoins,
    theory: [{ title: 'Точная оплата', text: 'Сначала постарайся набрать ровно стоимость товара. Если сумма больше — сдача равна переплате.' }],
    kind: 'coinpay-change',
  },
  {
    id: 'payments-3', type: 'repetition', chapter: 'payments', number: 3, kicker: 'Глава 3, Урок 3', title: 'Карточки про покупки',
    introTitle: 'Финни приготовил карточки',
    introText: 'Проверим цену, сдачу и безопасность банковской карты.',
    image: bankCard,
    theory: [{ title: 'Перед оплатой', text: 'Проверь цену, сумму оплаты и сдачу. PIN-код и другие секретные данные нельзя сообщать другим людям.' }],
    kind: 'truth',
  },
];

export const LESSON_BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l])) as Record<string, LessonDefinition>;
export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c])) as Record<ChapterId, (typeof CHAPTERS)[number]>;
