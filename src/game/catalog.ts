import type { ImageSourcePropType } from 'react-native';

import apple from '@/assets/game/food/fruits/apple.png';
import banana from '@/assets/game/food/fruits/banana.png';
import orange from '@/assets/game/food/fruits/orange.png';
import pear from '@/assets/game/food/fruits/pear.png';
import strawberry from '@/assets/game/food/fruits/strawberry.png';
import broccoli from '@/assets/game/food/vegetables/broccoli.png';
import carrot from '@/assets/game/food/vegetables/carrot.png';
import cucumber from '@/assets/game/food/vegetables/cucumber.png';
import eggplant from '@/assets/game/food/vegetables/eggplant.png';
import pumpkin from '@/assets/game/food/vegetables/pumpkin.png';
import bread from '@/assets/game/food/ready/bread.png';
import burger from '@/assets/game/food/ready/burger.png';
import cake from '@/assets/game/food/ready/cake.png';
import cheese from '@/assets/game/food/ready/cheese.png';
import chickenLeg from '@/assets/game/food/ready/chicken-leg.png';
import friedEgg from '@/assets/game/food/ready/fried-egg.png';
import pizza from '@/assets/game/food/ready/pizza.png';
import salmon from '@/assets/game/food/ready/salmon.png';
import sandwich from '@/assets/game/food/ready/sandwich.png';
import soup from '@/assets/game/food/ready/soup.png';
import croissant from '@/assets/game/food/sweets/croissant.png';
import cupcake from '@/assets/game/food/sweets/cupcake.png';
import lollipop from '@/assets/game/food/sweets/lollipop.png';
import vitaminA from '@/assets/game/food/vitamins/vitamin-a.png';
import vitaminB from '@/assets/game/food/vitamins/vitamin-b.png';
import vitaminC from '@/assets/game/food/vitamins/vitamin-c.png';
import vitaminD from '@/assets/game/food/vitamins/vitamin-d.png';
import vitaminE from '@/assets/game/food/vitamins/vitamin-e.png';
import vitaminK from '@/assets/game/food/vitamins/vitamin-k.png';
import bubbleTea from '@/assets/game/food/drinks/bubble-tea.png';
import cocoa from '@/assets/game/food/drinks/cocoa.png';
import greenSmoothie from '@/assets/game/food/drinks/green-smoothie.png';
import lemonade from '@/assets/game/food/drinks/lemonade.png';
import orangeJuice from '@/assets/game/food/drinks/orange-juice.png';
import strawberryMilk from '@/assets/game/food/drinks/strawberry-milk.png';

export type FoodCategoryId = 'fruits' | 'vegetables' | 'ready' | 'sweets' | 'vitamins' | 'drinks';
export type FoodId =
  | 'apple' | 'banana' | 'pear' | 'orange' | 'strawberry'
  | 'carrot' | 'cucumber' | 'eggplant' | 'pumpkin' | 'broccoli'
  | 'pizza' | 'burger' | 'sandwich' | 'soup' | 'chicken-leg' | 'salmon' | 'bread' | 'cheese' | 'fried-egg' | 'cake'
  | 'cupcake' | 'croissant' | 'lollipop'
  | 'vitamin-a' | 'vitamin-b' | 'vitamin-c' | 'vitamin-d' | 'vitamin-e' | 'vitamin-k'
  | 'bubble-tea' | 'strawberry-milk' | 'orange-juice' | 'lemonade' | 'cocoa' | 'green-smoothie';

export type FoodItem = {
  id: FoodId;
  name: string;
  category: FoodCategoryId;
  price: number;
  nutrition: number;
  image: ImageSourcePropType;
};

export const FOOD_CATEGORIES: { id: FoodCategoryId; label: string }[] = [
  { id: 'fruits', label: 'Фрукты' },
  { id: 'vegetables', label: 'Овощи' },
  { id: 'ready', label: 'Готовая еда' },
  { id: 'sweets', label: 'Сладкое' },
  { id: 'vitamins', label: 'Витамины' },
  { id: 'drinks', label: 'Напитки' },
];

export const FOOD_ITEMS: FoodItem[] = [
  { id: 'apple', name: 'Яблоко', category: 'fruits', price: 20, nutrition: 12, image: apple },
  { id: 'banana', name: 'Банан', category: 'fruits', price: 30, nutrition: 16, image: banana },
  { id: 'pear', name: 'Груша', category: 'fruits', price: 25, nutrition: 14, image: pear },
  { id: 'orange', name: 'Апельсин', category: 'fruits', price: 50, nutrition: 15, image: orange },
  { id: 'strawberry', name: 'Клубника', category: 'fruits', price: 35, nutrition: 10, image: strawberry },
  { id: 'carrot', name: 'Морковь', category: 'vegetables', price: 50, nutrition: 15, image: carrot },
  { id: 'cucumber', name: 'Огурец', category: 'vegetables', price: 35, nutrition: 11, image: cucumber },
  { id: 'eggplant', name: 'Баклажан', category: 'vegetables', price: 32, nutrition: 13, image: eggplant },
  { id: 'pumpkin', name: 'Тыква', category: 'vegetables', price: 50, nutrition: 20, image: pumpkin },
  { id: 'broccoli', name: 'Брокколи', category: 'vegetables', price: 55, nutrition: 17, image: broccoli },
  { id: 'pizza', name: 'Пицца', category: 'ready', price: 50, nutrition: 24, image: pizza },
  { id: 'burger', name: 'Бургер', category: 'ready', price: 62, nutrition: 28, image: burger },
  { id: 'sandwich', name: 'Сэндвич', category: 'ready', price: 60, nutrition: 24, image: sandwich },
  { id: 'soup', name: 'Суп', category: 'ready', price: 55, nutrition: 22, image: soup },
  { id: 'chicken-leg', name: 'Курица', category: 'ready', price: 50, nutrition: 25, image: chickenLeg },
  { id: 'salmon', name: 'Лосось', category: 'ready', price: 30, nutrition: 26, image: salmon },
  { id: 'bread', name: 'Хлеб', category: 'ready', price: 50, nutrition: 18, image: bread },
  { id: 'cheese', name: 'Сыр', category: 'ready', price: 45, nutrition: 20, image: cheese },
  { id: 'fried-egg', name: 'Яичница', category: 'ready', price: 32, nutrition: 19, image: friedEgg },
  { id: 'cake', name: 'Торт', category: 'sweets', price: 55, nutrition: 17, image: cake },
  { id: 'cupcake', name: 'Капкейк', category: 'sweets', price: 62, nutrition: 12, image: cupcake },
  { id: 'croissant', name: 'Круассан', category: 'sweets', price: 60, nutrition: 15, image: croissant },
  { id: 'lollipop', name: 'Леденец', category: 'sweets', price: 55, nutrition: 8, image: lollipop },
  { id: 'vitamin-a', name: 'Витамин A', category: 'vitamins', price: 50, nutrition: 8, image: vitaminA },
  { id: 'vitamin-b', name: 'Витамин B', category: 'vitamins', price: 62, nutrition: 8, image: vitaminB },
  { id: 'vitamin-c', name: 'Витамин C', category: 'vitamins', price: 60, nutrition: 8, image: vitaminC },
  { id: 'vitamin-d', name: 'Витамин D', category: 'vitamins', price: 55, nutrition: 8, image: vitaminD },
  { id: 'vitamin-e', name: 'Витамин E', category: 'vitamins', price: 50, nutrition: 8, image: vitaminE },
  { id: 'vitamin-k', name: 'Витамин K', category: 'vitamins', price: 30, nutrition: 8, image: vitaminK },
  { id: 'strawberry-milk', name: 'Клубничное молоко', category: 'drinks', price: 50, nutrition: 13, image: strawberryMilk },
  { id: 'cocoa', name: 'Какао', category: 'drinks', price: 62, nutrition: 15, image: cocoa },
  { id: 'lemonade', name: 'Лимонад', category: 'drinks', price: 60, nutrition: 10, image: lemonade },
  { id: 'green-smoothie', name: 'Зелёный смузи', category: 'drinks', price: 55, nutrition: 16, image: greenSmoothie },
  { id: 'bubble-tea', name: 'Бабл-ти', category: 'drinks', price: 50, nutrition: 14, image: bubbleTea },
  { id: 'orange-juice', name: 'Апельсиновый сок', category: 'drinks', price: 30, nutrition: 12, image: orangeJuice },
];

export const FOOD_BY_ID = Object.fromEntries(FOOD_ITEMS.map((item) => [item.id, item])) as Record<FoodId, FoodItem>;
