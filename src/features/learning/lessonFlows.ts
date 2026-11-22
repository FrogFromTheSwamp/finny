import catalog from '../../../content/lessons.json';
import type { ImageSourcePropType } from 'react-native';

import meal from '@/assets/library/food/meals/meal-1.png';
import candy from '@/assets/library/food/sweets/candy.png';
import vitamin from '@/assets/library/food/vitamins/vitamin-c.png';
import bicycle from '@/assets/library/learning/items/bicycle.png';
import elephant from '@/assets/library/learning/lesson/purple-elephant-card.png';
import iceCream from '@/assets/library/learning/items/ice-cream.png';
import laptop from '@/assets/library/learning/items/laptop.png';
import notebook from '@/assets/library/learning/items/notebook.png';
import pen from '@/assets/library/learning/items/pen.png';
import phone from '@/assets/library/learning/items/phone.png';
import rollerSkates from '@/assets/library/learning/lesson/roller-skates-card.png';
import soapBubbles from '@/assets/library/learning/items/soap-bubbles.png';
import car from '@/assets/library/learning/items/car.png';
import teddy from '@/assets/library/learning/items/teddy.png';
import backpack from '@/assets/library/learning/lesson/backpack.png';
import bicycleCard from '@/assets/library/learning/lesson/bicycle-card.png';
import bicycleHero from '@/assets/library/learning/lesson/bicycle-hero.png';
import bottle from '@/assets/library/learning/lesson/bottle.png';
import division from '@/assets/library/learning/lesson/division.png';
import handCoins from '@/assets/library/learning/lesson/hand-coins.png';
import laptopCard from '@/assets/library/learning/lesson/laptop-card.png';
import lemonade from '@/assets/library/learning/lesson/lemonade.png';
import needsBasket from '@/assets/library/learning/lesson/needs-basket.png';
import phoneCard from '@/assets/library/learning/lesson/phone-card.png';
import raincoat from '@/assets/library/learning/lesson/raincoat.png';
import sandwich from '@/assets/library/learning/lesson/sandwich.png';
import savePiggies from '@/assets/library/learning/lesson/save-piggies.png';
import stickers from '@/assets/library/learning/lesson/stickers.png';
import thingsPile from '@/assets/library/learning/lesson/things-pile.png';
import ticket from '@/assets/library/learning/lesson/ticket.png';
import wantPet from '@/assets/library/learning/lesson/want-pet.png';
import wallet from '@/assets/library/learning/lesson/wallet.png';

export type Art = ImageSourcePropType | 'pet';

export type ShopItem = {
  id: string;
  label: string;
  price: number;
  image: ImageSourcePropType;
  role: 'need' | 'want';
};

export type SwipeCard = {
  id: string;
  text: string;
  answer: boolean;
  ok: string;
  bad: string;
};

export type FlowStep =
  | { kind: 'cover'; kicker: string; title: string; body?: string; art?: Art; artLayout?: 'large-card' | 'large'; week?: boolean; marks?: boolean; button: string }
  | { kind: 'story'; title: string; body: string; caption?: string; art?: Art; artLayout?: 'large-card' | 'large'; button: string; arrow?: boolean }
  | { kind: 'groups'; title: string; body: string; groups: { label: string; lines: string[] }[]; button: string }
  | { kind: 'shop'; title: string; purseLabel: string; purse: number; items: ShopItem[]; task: 'week' | 'trip' | 'balance' }
  | { kind: 'priority' }
  | { kind: 'swipe'; cards: SwipeCard[] }
  | { kind: 'pick' }
  | { kind: 'practice'; id: string; question: string; expected: number; hint: string }
  | { kind: 'weekly' }
  | { kind: 'sort' }
  | { kind: 'pay' }
  | { kind: 'goal'; title: string; body: string; button: string };

export const weekShop: ShopItem[] = [
  { id: 'food', label: 'Еда', price: 45, image: meal, role: 'need' },
  { id: 'vitamins', label: 'Витамины', price: 15, image: vitamin, role: 'need' },
  { id: 'bubbles', label: 'Мыльные пузыри', price: 15, image: soapBubbles, role: 'want' },
  { id: 'sweets', label: 'Сладости', price: 20, image: candy, role: 'want' },
];

export const tripShop: ShopItem[] = [
  { id: 'water', label: 'Вода', price: 20, image: bottle, role: 'need' },
  { id: 'sandwich', label: 'Сэндвич', price: 25, image: sandwich, role: 'need' },
  { id: 'raincoat', label: 'Дождевик', price: 20, image: raincoat, role: 'need' },
  { id: 'ticket', label: 'Билет', price: 30, image: ticket, role: 'need' },
  { id: 'stickers', label: 'Наклейки', price: 15, image: stickers, role: 'want' },
  { id: 'juice', label: 'Лимонад', price: 15, image: lemonade, role: 'want' },
];

export const payShop: ShopItem[] = [
  { id: 'icecream', label: 'Мороженое', price: 30, image: iceCream, role: 'want' },
  { id: 'car', label: 'Машинка', price: 120, image: car, role: 'want' },
  { id: 'teddy', label: 'Мишка', price: 70, image: teddy, role: 'want' },
];

export const priorityItems: ShopItem[] = [
  { id: 'bicycle', label: 'Велосипед', price: 50, image: bicycle, role: 'need' },
  { id: 'notebook', label: 'Тетрадь', price: 20, image: notebook, role: 'need' },
  { id: 'pen', label: 'Ручка', price: 5, image: pen, role: 'need' },
  { id: 'candy', label: 'Конфета', price: 10, image: candy, role: 'want' },
  { id: 'stickers', label: 'Наклейки', price: 15, image: stickers, role: 'want' },
];

export const PRIORITY_NOW = ['bicycle', 'notebook', 'pen'];

export const savingsChoices = [
  { id: 'bicycle', name: 'Велосипед', image: bicycle, card: bicycleCard },
  { id: 'laptop', name: 'Ноутбук', image: laptop, card: laptopCard },
  { id: 'phone', name: 'Телефон', image: phone, card: phoneCard },
] as const;

export type SavingsChoiceId = (typeof savingsChoices)[number]['id'];

type CatalogTask = {
  id: string;
  step: string;
  scenario: { question?: string; expected?: unknown; text?: string };
  feedback?: { ok: string; bad: string };
  hint?: string;
};

function catalogTasks(lessonId: string): CatalogTask[] {
  return catalog.lessons.find(lesson => lesson.id === lessonId)!.tasks;
}

function cardsFor(lessonId: string): SwipeCard[] {
  return catalogTasks(lessonId).filter(task => task.step === 'swipe').map(task => {
    if (!task.feedback || typeof task.scenario.expected !== 'boolean' || !task.scenario.text)
      throw new Error(`Некорректная карточка ${task.id}`);
    return { id: task.id, text: task.scenario.text, answer: task.scenario.expected, ...task.feedback };
  });
}

function practiceFor(lessonId: string): FlowStep[] {
  return catalogTasks(lessonId).filter(task => task.step === 'practice').map(task => {
    if (!task.hint || !task.scenario.question || typeof task.scenario.expected !== 'number')
      throw new Error(`Некорректное числовое задание ${task.id}`);
    return { kind: 'practice', id: task.id, question: task.scenario.question, expected: task.scenario.expected, hint: task.hint };
  });
}

const budget1: FlowStep[] = [
  {
    kind: 'cover',
    kicker: 'Глава 1, Урок 1',
    title: 'Как распределять монеты?',
    art: 'pet',
    button: 'Начать',
  },
  {
    kind: 'story',
    title: 'На всё сразу денег не хватит, но…',
    body: 'Грамотно составленный бюджет поможет решить, что можно купить, что того не стоит и сколько надо отложить, чтобы хватило на всё. Есть 3 простых правила!',
    art: handCoins,
    button: 'И какие же?',
  },
  {
    kind: 'story',
    title: 'Первое правило',
    body: 'Сначала — жизненно важное и необходимое. Еда, здоровье и уход. Этим жертвовать нельзя, поэтому эти расходы надо учитывать в первую очередь.',
    art: needsBasket,
    button: '',
    arrow: true,
  },
  {
    kind: 'story',
    title: 'Второе правило',
    body: 'Потом учесть желания и потребности. Игрушки, сладости и развлечения. Их можно купить, если денег хватает.',
    art: wantPet,
    button: '',
    arrow: true,
  },
  {
    kind: 'story',
    title: 'Третье правило',
    body: 'Не забыть отложить на цели и мечты! Всегда надо держать в уме, на что могут понадобиться деньги. Поэтому лучше регулярно откладывать часть средств.',
    art: savePiggies,
    button: '',
    arrow: true,
  },
  {
    kind: 'groups',
    title: 'У Финни есть 100 монет на неделю',
    body: 'Помоги ему решить, что купить сейчас, а что оставить на потом.',
    groups: [
      { label: 'Жизненно важно', lines: ['Еда', 'Витамины'] },
      { label: 'Хочется', lines: ['Мыльные пузыри', 'Сладости'] },
      { label: 'Цели', lines: ['Велосипед', 'Телефон'] },
    ],
    button: 'Погнали!',
  },
  { kind: 'shop', title: 'Собери корзину', purseLabel: 'Твой бюджет', purse: 100, items: weekShop, task: 'week' },
];

const budget2: FlowStep[] = [
  {
    kind: 'cover',
    kicker: 'Глава 1, Урок 2',
    title: 'Распредели бюджет на неделю',
    art: handCoins,
    week: true,
    button: 'Начать',
  },
  {
    kind: 'story',
    title: 'До учёбы — 2 дня, у героя — 75 монет',
    body: 'Расставь покупки от самой важной к той, которая может подождать, чтобы Финни знал, за чем идти в первую очередь.',
    art: thingsPile,
    button: 'Дальше',
  },
  { kind: 'priority' },
];

const budget3: FlowStep[] = [
  {
    kind: 'cover',
    kicker: 'Глава 1, Урок 3',
    title: 'Собираемся в поход!',
    body: 'Не забудь отложить 30 монет на дорогу домой.',
    art: backpack,
    button: 'Начать',
  },
  { kind: 'shop', title: 'Что положить в корзину?', purseLabel: 'Баланс', purse: 125, items: tripShop, task: 'trip' },
];

const budget4: FlowStep[] = [
  {
    kind: 'cover',
    kicker: 'Глава 1, Урок 4',
    title: 'Финни приготовил карточки с утверждениями',
    body: 'Реши, согласен ты с ними или нет.',
    art: 'pet',
    marks: true,
    button: 'Начать',
  },
  { kind: 'swipe', cards: cardsFor('budget-4') },
];

const savings1: FlowStep[] = [
  {
    kind: 'cover',
    kicker: 'Глава 2, Урок 1',
    title: 'Мечта и цель: в чём разница между ними?',
    body: 'Что это за зверь эта ваша цель?',
    art: elephant,
    artLayout: 'large-card',
    button: 'Начать',
  },
  {
    kind: 'story',
    title: 'Простой пример:',
    body: 'Можно мечтать о велосипеде. Но лучше поставить цель, допустим, накопить на него 10 000 ₽ к лету.',
    caption: 'Так мечта превращается в конкретный план',
    art: bicycleHero,
    artLayout: 'large-card',
    button: 'Дальше',
  },
  {
    kind: 'story',
    title: 'Как понять, сколько нужно откладывать?',
    body: 'Чаще всего нужно разделить стоимость покупки на количество месяцев до даты её приобретения.',
    button: 'Дальше',
  },
  {
    kind: 'story',
    title: 'Всё просто!',
    body: 'Если велосипед стоит 10 000 ₽, а купить его мы хотим через 10 месяцев, значит откладывать надо 1 000 ₽ в месяц.',
    art: division,
    button: 'Дальше',
  },
  {
    kind: 'goal',
    title: 'Давай поставим цель',
    body: 'Выбери товар для Финни, на который ты бы хотел накопить. Внеси его в цели, чтобы откладывать и приближаться к покупке.',
    button: 'Поставить цель',
  },
];

const savings2: FlowStep[] = [
  {
    kind: 'cover',
    kicker: 'Глава 2, Урок 2',
    title: 'Сформируй сбережения Финни',
    art: bicycleHero,
    button: 'Начать',
  },
  { kind: 'pick' },
  { kind: 'weekly' },
];

const savings3: FlowStep[] = [
  {
    kind: 'cover',
    kicker: 'Глава 2, Урок 3',
    title: 'Рассортируй сбережения Финни',
    body: 'Перетащи монеты 1, 3 и 5 в копилки с тем же числом. Чужая копилка монету не примет.',
    art: savePiggies,
    button: 'Начать',
  },
  { kind: 'sort' },
];

const savings4: FlowStep[] = [
  {
    kind: 'cover',
    kicker: 'Глава 2, Урок 4',
    title: 'Финни приготовил карточки с утверждениями',
    body: 'Реши, согласен ты с ними или нет.',
    art: 'pet',
    marks: true,
    button: 'Начать',
  },
  { kind: 'swipe', cards: cardsFor('savings-4') },
];

const payments1: FlowStep[] = [
  {
    kind: 'cover',
    kicker: 'Глава 3, Урок 1',
    title: 'Платежи и покупки: как не потратить лишнее?',
    art: wallet,
    button: 'Начать',
  },
  {
    kind: 'story',
    title: 'Покупка — это обмен денег на то, что тебе нужно',
    body: 'Перед покупкой важно узнать цену и проверить, хватает ли тебе денег.',
    art: handCoins,
    button: 'Дальше',
  },
  {
    kind: 'story',
    title: 'Простой пример',
    body: 'Ты хочешь купить мороженое за 100. У тебя есть 150. После покупки останется 150 − 100 = 50. Так можно заранее понять, сколько денег останется.',
    art: iceCream,
    button: 'Дальше',
  },
  {
    kind: 'story',
    title: 'Не забываем про сдачу',
    body: 'Если заплатить больше, продавец возвращает сдачу.',
    art: handCoins,
    button: 'Дальше',
  },
  {
    kind: 'story',
    title: 'Что происходит, когда ты платишь картой?',
    body: 'На карте хранятся не сами деньги, а информация о твоём счёте в банке. Когда ты прикладываешь карту к терминалу, банк проверяет покупку и списывает нужную сумму со счёта.',
    art: wallet,
    button: 'Дальше',
  },
  ...practiceFor('payments-1'),
  {
    kind: 'story',
    title: 'Какую покупку может сделать Финни?',
    body: 'У Финни 100 монет. Выбери покупки, на которые хватает, и посчитай, сколько монет останется.',
    button: 'Начать',
  },
  { kind: 'shop', title: 'Выбери покупки', purseLabel: 'Твой бюджет', purse: 100, items: payShop, task: 'balance' },
];

const payments2: FlowStep[] = [
  {
    kind: 'cover',
    kicker: 'Глава 3, Урок 2',
    title: 'Заплати за покупку',
    art: rollerSkates,
    artLayout: 'large-card',
    button: 'Начать',
  },
  ...practiceFor('payments-2'),
  { kind: 'pay' },
];

const payments3: FlowStep[] = [
  {
    kind: 'cover',
    kicker: 'Глава 3, Урок 3',
    title: 'Финни приготовил карточки с утверждениями',
    body: 'Реши, согласен ты с ними или нет.',
    art: 'pet',
    marks: true,
    button: 'Начать',
  },
  ...practiceFor('payments-3'),
  { kind: 'swipe', cards: cardsFor('payments-3') },
];

export const LESSON_FLOWS: Record<string, FlowStep[]> = {
  'budget-1': budget1,
  'budget-2': budget2,
  'budget-3': budget3,
  'budget-4': budget4,
  'savings-1': savings1,
  'savings-2': savings2,
  'savings-3': savings3,
  'savings-4': savings4,
  'payments-1': payments1,
  'payments-2': payments2,
  'payments-3': payments3,
};

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
