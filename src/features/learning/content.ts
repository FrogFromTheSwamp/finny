import type { ImageSourcePropType } from 'react-native';

import backpack from '@/assets/learning/budget/backpack.png';
import basket from '@/assets/game/ui/category-basket.png';
import categories from '@/assets/learning/budget/categories.png';
import foodItems from '@/assets/learning/budget/food-items.png';
import bicycle from '@/assets/items/bicycle.png';
import division from '@/assets/learning/savings/division.png';
import elephants from '@/assets/learning/savings/elephants.png';
import piggyBank from '@/assets/learning/savings/piggy-bank.png';
import bankCard from '@/assets/learning/payments/bank-card.png';
import coinPiles from '@/assets/learning/payments/coin-piles.png';
import handCoins from '@/assets/learning/payments/hand-coins.png';
import subtraction from '@/assets/learning/payments/subtraction.png';

export type ChapterId = 'budget' | 'savings' | 'payments';
export type LessonKind = 'choice' | 'number' | 'spend' | 'classify' | 'goal' | 'coinpay' | 'truth';
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
  { id: 'budget', title: 'Бюджет', subtitle: 'Учимся распределять деньги', color: '#E58B28', lessons: ['budget-1','budget-2','budget-3','budget-4'] },
  { id: 'savings', title: 'Сбережения', subtitle: 'Превращаем мечты в цели', color: '#B11969', lessons: ['savings-1','savings-2','savings-3','savings-4'] },
  { id: 'payments', title: 'Платежи и покупки', subtitle: 'Считаем и покупаем безопасно', color: '#2367B3', lessons: ['payments-1','payments-2','payments-4'] },
];

export const LESSONS: LessonDefinition[] = [
  {
    id: 'budget-1', type: 'theory', chapter: 'budget', number: 1, kicker: 'Глава 1, Урок 1', title: 'Как распределять монеты?',
    introTitle: 'Как распределять монеты?', introText: 'На всё сразу денег не хватит, но ими можно управлять. У Финни есть 100 монет на неделю.', image: categories,
    theory: [
      { title: 'Первое правило', text: 'Сначала — жизненно важное и необходимое. Еда, дорога и то, без чего нельзя обойтись.', image: basket },
      { title: 'Второе правило', text: 'Потом учитываем желания. Игрушки и развлечения — это приятно, но они подождут.' },
      { title: 'Третье правило', text: 'Не забывай отложить на цели и мечты. Даже небольшая сумма создаёт запас.' },
    ], kind: 'spend',
  },
  {
    id: 'budget-2', type: 'test', chapter: 'budget', number: 2, kicker: 'Глава 1, Урок 2', title: 'Нужно или хочу?',
    introTitle: 'Разделим покупки по смыслу', introText: 'Не каждая покупка одинаково важна. Разберись, что нужно прямо сейчас, а что относится к желаниям.', image: foodItems,
    theory: [{ title: 'Подсказка', text: '«Нужно» помогает жить, учиться и быть в безопасности. «Хочу» делает жизнь приятнее, но обычно может подождать.' }], kind: 'classify',
  },
  {
    id: 'budget-3', type: 'test', chapter: 'budget', number: 3, kicker: 'Глава 1, Урок 3', title: 'Собери недельный бюджет',
    introTitle: 'Собираемся в поход!', introText: 'У Финни 125 монет. Купи всё необходимое и обязательно оставь 30 монет на дорогу домой.', image: backpack,
    theory: [{ title: 'План перед покупкой', text: 'Сначала посчитай обязательные траты, затем желания и только после этого принимай решение.' }], kind: 'choice',
  },
  {
    id: 'budget-4', type: 'repetition', chapter: 'budget', number: 4, kicker: 'Глава 1, Урок 4', title: 'Собираемся в поход',
    introTitle: 'Собери рюкзак Финни', introText: 'Бюджет ограничен. Выбери вещи, которые действительно пригодятся в походе.', image: backpack,
    theory: [{ title: 'Проверяем приоритеты', text: 'Полезная покупка решает задачу. Красивое дополнение может подождать, если денег мало.' }], kind: 'truth',
  },
  {
    id: 'savings-1', type: 'theory', chapter: 'savings', number: 1, kicker: 'Глава 2, Урок 1', title: 'Мечта и цель: в чём разница?',
    introTitle: 'Мечта и цель: в чём разница?', introText: 'Мечта — это то, чего ты хочешь. Цель — мечта, у которой есть цена и понятный план.', image: elephants,
    theory: [
      { title: 'Простой пример', text: 'Велосипед стоит 10 000 ₽. Если решить, когда его купить и сколько откладывать, мечта становится целью.', image: bicycle },
      { title: 'Как понять сумму?', text: 'Раздели стоимость покупки на количество недель или месяцев до нужной даты.', image: division },
    ], kind: 'goal',
  },
  {
    id: 'savings-2', type: 'test', chapter: 'savings', number: 2, kicker: 'Глава 2, Урок 2', title: 'Сколько откладывать?',
    introTitle: 'Посчитаем план накоплений', introText: 'Цель стоит 120 монет. До покупки 6 недель. Сколько нужно откладывать каждую неделю?', image: bicycle,
    theory: [{ title: 'Формула', text: 'Стоимость цели ÷ количество недель = сумма, которую стоит откладывать регулярно.' }], kind: 'number',
  },
  {
    id: 'savings-3', type: 'test', chapter: 'savings', number: 3, kicker: 'Глава 2, Урок 3', title: 'Копим на несколько целей',
    introTitle: 'Не все цели одинаково срочные', introText: 'Распредели 30 монет между двумя целями так, чтобы на ближайшую цель ушло больше.', image: piggyBank,
    theory: [{ title: 'Приоритет цели', text: 'Если одна цель нужна раньше, ей можно временно отдавать большую часть суммы.' }], kind: 'spend',
  },
  {
    id: 'savings-4', type: 'repetition', chapter: 'savings', number: 4, kicker: 'Глава 2, Урок 4', title: 'Проверяем привычки',
    introTitle: 'Какая привычка помогает копить?', introText: 'Выбери утверждение, которое помогает двигаться к цели.', image: piggyBank,
    theory: [{ title: 'Главное', text: 'Регулярность важнее размера одного взноса. Маленькая сумма каждую неделю лучше случайных пополнений.' }], kind: 'truth',
  },
  {
    id: 'payments-1', type: 'theory', chapter: 'payments', number: 1, kicker: 'Глава 3, Урок 1', title: 'Платёж и остаток',
    introTitle: 'Что происходит после покупки?', introText: 'Цена товара вычитается из твоего баланса. Оставшиеся деньги можно потратить позже.', image: bankCard,
    theory: [{ title: 'Пример', text: 'Если было 150, а покупка стоит 100, останется 50.', image: subtraction }, { title: 'Безопасность', text: 'PIN-код и пароли нельзя сообщать друзьям, продавцам или незнакомцам.' }], kind: 'number',
  },
  {
    id: 'payments-2', type: 'test', chapter: 'payments', number: 2, kicker: 'Глава 3, Урок 2', title: 'Хватит ли денег?',
    introTitle: 'Баланс — 70 монет', introText: 'Выбери покупку, после которой баланс не станет отрицательным.', image: coinPiles,
    theory: [{ title: 'Перед оплатой', text: 'Сравни цену с балансом. Если цена выше — денег на эту покупку пока не хватает.' }], kind: 'choice',
  },
  {
    id: 'payments-3', type: 'test', chapter: 'payments', number: 3, kicker: 'Глава 3, Урок 3', title: 'Оплати точно',
    introTitle: 'Собери нужную сумму', introText: 'Нажимай на монеты, чтобы набрать ровно 15.', image: handCoins,
    theory: [{ title: 'Номиналы', text: 'Одна и та же сумма может быть собрана разными комбинациями монет.' }], kind: 'coinpay',
  },
  {
    id: 'payments-4', type: 'repetition', chapter: 'payments', number: 4, kicker: 'Глава 3, Урок 4', title: 'Безопасная покупка',
    introTitle: 'Финальная проверка', introText: 'Выбери правильное действие при оплате и получении сдачи.', image: bankCard,
    theory: [{ title: 'Помни', text: 'Проверяй цену, сумму списания и сдачу. Секретные коды не сообщай никому.' }], kind: 'truth',
  },
];

export const LESSON_BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l])) as Record<string, LessonDefinition>;
export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c])) as Record<ChapterId, (typeof CHAPTERS)[number]>;