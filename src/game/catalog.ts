import type { ImageSourcePropType } from 'react-native';

import apple from '@/assets/library/food/fruits/apple.png';
import banana from '@/assets/library/food/fruits/banana.png';
import orange from '@/assets/library/food/fruits/orange.png';
import pear from '@/assets/library/food/fruits/pear.png';
import strawberry from '@/assets/library/food/fruits/strawberry.png';
import broccoli from '@/assets/library/food/vegetables/broccoli.png';
import carrot from '@/assets/library/food/vegetables/carrot.png';
import cucumber from '@/assets/library/food/vegetables/cucumber.png';
import eggplant from '@/assets/library/food/vegetables/eggplant.png';
import pumpkin from '@/assets/library/food/vegetables/pumpkin.png';
import bread from '@/assets/library/food/ready/bread.png';
import burger from '@/assets/library/food/ready/burger.png';
import cake from '@/assets/library/food/sweets/cake.png';
import cheese from '@/assets/library/food/ready/cheese.png';
import chickenLeg from '@/assets/library/food/ready/chicken-leg.png';
import friedEgg from '@/assets/library/food/ready/fried-egg.png';
import pizza from '@/assets/library/food/ready/pizza.png';
import salmon from '@/assets/library/food/ready/salmon.png';
import sandwich from '@/assets/library/food/ready/sandwich.png';
import soup from '@/assets/library/food/ready/soup.png';
import croissant from '@/assets/library/food/sweets/croissant.png';
import cupcake from '@/assets/library/food/sweets/cupcake.png';
import lollipop from '@/assets/library/food/sweets/lollipop.png';
import vitaminA from '@/assets/library/food/vitamins/vitamin-a.png';
import vitaminB from '@/assets/library/food/vitamins/vitamin-b.png';
import vitaminC from '@/assets/library/food/vitamins/vitamin-c.png';
import vitaminD from '@/assets/library/food/vitamins/vitamin-d.png';
import vitaminE from '@/assets/library/food/vitamins/vitamin-e.png';
import vitaminK from '@/assets/library/food/vitamins/vitamin-k.png';
import bubbleTea from '@/assets/library/food/drinks/bubble-tea.png';
import cocoa from '@/assets/library/food/drinks/cocoa.png';
import greenSmoothie from '@/assets/library/food/drinks/green-smoothie.png';
import lemonade from '@/assets/library/food/drinks/lemonade.png';
import orangeJuice from '@/assets/library/food/drinks/orange-juice.png';
import strawberryMilk from '@/assets/library/food/drinks/strawberry-milk.png';

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
  { id: 'apple', name: 'Яблоко', category: 'fruits', price: 5, nutrition: 12, image: apple },
  { id: 'banana', name: 'Банан', category: 'fruits', price: 11, nutrition: 16, image: banana },
  { id: 'pear', name: 'Груша', category: 'fruits', price: 12, nutrition: 14, image: pear },
  { id: 'orange', name: 'Апельсин', category: 'fruits', price: 11, nutrition: 15, image: orange },
  { id: 'strawberry', name: 'Клубника', category: 'fruits', price: 12, nutrition: 10, image: strawberry },
  { id: 'carrot', name: 'Морковь', category: 'vegetables', price: 11, nutrition: 15, image: carrot },
  { id: 'cucumber', name: 'Огурец', category: 'vegetables', price: 12, nutrition: 11, image: cucumber },
  { id: 'eggplant', name: 'Баклажан', category: 'vegetables', price: 14, nutrition: 13, image: eggplant },
  { id: 'pumpkin', name: 'Тыква', category: 'vegetables', price: 15, nutrition: 20, image: pumpkin },
  { id: 'broccoli', name: 'Брокколи', category: 'vegetables', price: 11, nutrition: 17, image: broccoli },
  { id: 'pizza', name: 'Пицца', category: 'ready', price: 18, nutrition: 24, image: pizza },
  { id: 'burger', name: 'Бургер', category: 'ready', price: 20, nutrition: 28, image: burger },
  { id: 'sandwich', name: 'Сэндвич', category: 'ready', price: 16, nutrition: 24, image: sandwich },
  { id: 'soup', name: 'Суп', category: 'ready', price: 14, nutrition: 22, image: soup },
  { id: 'chicken-leg', name: 'Курица', category: 'ready', price: 18, nutrition: 25, image: chickenLeg },
  { id: 'salmon', name: 'Лосось', category: 'ready', price: 20, nutrition: 26, image: salmon },
  { id: 'bread', name: 'Хлеб', category: 'ready', price: 8, nutrition: 18, image: bread },
  { id: 'cheese', name: 'Сыр', category: 'ready', price: 12, nutrition: 20, image: cheese },
  { id: 'fried-egg', name: 'Яичница', category: 'ready', price: 10, nutrition: 19, image: friedEgg },
  { id: 'cake', name: 'Торт', category: 'sweets', price: 16, nutrition: 17, image: cake },
  { id: 'cupcake', name: 'Капкейк', category: 'sweets', price: 12, nutrition: 12, image: cupcake },
  { id: 'croissant', name: 'Круассан', category: 'sweets', price: 11, nutrition: 15, image: croissant },
  { id: 'lollipop', name: 'Леденец', category: 'sweets', price: 8, nutrition: 8, image: lollipop },
  { id: 'vitamin-a', name: 'Витамин A', category: 'vitamins', price: 10, nutrition: 8, image: vitaminA },
  { id: 'vitamin-b', name: 'Витамин B', category: 'vitamins', price: 10, nutrition: 8, image: vitaminB },
  { id: 'vitamin-c', name: 'Витамин C', category: 'vitamins', price: 10, nutrition: 8, image: vitaminC },
  { id: 'vitamin-d', name: 'Витамин D', category: 'vitamins', price: 10, nutrition: 8, image: vitaminD },
  { id: 'vitamin-e', name: 'Витамин E', category: 'vitamins', price: 10, nutrition: 8, image: vitaminE },
  { id: 'vitamin-k', name: 'Витамин K', category: 'vitamins', price: 10, nutrition: 8, image: vitaminK },
  { id: 'strawberry-milk', name: 'Клубничное молоко', category: 'drinks', price: 12, nutrition: 13, image: strawberryMilk },
  { id: 'cocoa', name: 'Какао', category: 'drinks', price: 10, nutrition: 15, image: cocoa },
  { id: 'lemonade', name: 'Лимонад', category: 'drinks', price: 11, nutrition: 10, image: lemonade },
  { id: 'green-smoothie', name: 'Зелёный смузи', category: 'drinks', price: 14, nutrition: 16, image: greenSmoothie },
  { id: 'bubble-tea', name: 'Бабл-ти', category: 'drinks', price: 15, nutrition: 14, image: bubbleTea },
  { id: 'orange-juice', name: 'Апельсиновый сок', category: 'drinks', price: 11, nutrition: 12, image: orangeJuice },
];

export const FOOD_BY_ID = Object.fromEntries(FOOD_ITEMS.map((item) => [item.id, item])) as Record<FoodId, FoodItem>;
