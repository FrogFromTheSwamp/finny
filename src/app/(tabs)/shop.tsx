import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import categoryBasket from '@/assets/game/ui/category-basket.png';
import { FOOD_BY_ID, FOOD_CATEGORIES, FOOD_ITEMS, type FoodCategoryId } from '@/game/catalog';
import { showGameDialog } from '@/game/services/dialogService';
import { useGameStore } from '@/game/store/gameStore';
import { fontFamily } from '@/ui/theme';

export default function ShopScreen() {
  const [category, setCategory] = useState<FoodCategoryId>('fruits');
  const coins = useGameStore((s) => s.coins);
  const selected = useGameStore((s) => s.shopSelection);
  const toggle = useGameStore((s) => s.toggleShopSelection);
  const purchase = useGameStore((s) => s.purchaseSelection);
  const items = useMemo(() => FOOD_ITEMS.filter((item) => item.category === category), [category]);
  const total = selected.reduce((sum, id) => sum + (FOOD_ITEMS.find((i) => i.id === id)?.price ?? 0), 0);
  const categoryIndex = FOOD_CATEGORIES.findIndex((c) => c.id === category);
  const preview = selected[0] ? FOOD_BY_ID[selected[0]] : null;
  const moveCategory = (delta: number) => {
    const next = (categoryIndex + delta + FOOD_CATEGORIES.length) % FOOD_CATEGORIES.length;
    setCategory(FOOD_CATEGORIES[next]!.id);
  };
  const buy = () => {
    const result = purchase();
    if (!selected.length) showGameDialog('Сначала выбери продукты на полках.', { title: 'Корзинка пустая' });
    else if (!result.ok) showGameDialog(`Нужно ${result.total} монет, а сейчас у тебя ${coins}.`, { title: 'Не хватает монет' });
    else showGameDialog(`Покупка на ${result.total} монет готова. Всё уже лежит на вкладке «Еда».`, { title: 'Готово!' });
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}><Text style={styles.back}>‹</Text><Text style={styles.title}>Продукты</Text><View style={styles.balance}><Text style={styles.balanceText}>{coins}</Text><Text style={styles.coin}>●</Text></View></View>
      <ScrollView contentContainerStyle={styles.products}>
        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <Pressable key={item.id} onPress={() => toggle(item.id)} style={[styles.product, isSelected && styles.productSelected]}>
              <Image source={item.image} style={styles.productImage} resizeMode="contain" />
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.price}><Text style={styles.priceText}>{item.price}</Text><Text style={styles.priceCoin}>●</Text></View>
              {isSelected ? <View style={styles.check}><Text style={styles.checkText}>✓</Text></View> : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.categoryBox}>
        <Pressable onPress={() => moveCategory(-1)} style={styles.arrow}><Text style={styles.arrowText}>‹</Text></Pressable>
        <View style={styles.basket}><Image source={categoryBasket} style={styles.basketImage} resizeMode="contain" />{preview ? <Image source={preview.image} style={styles.basketFood} resizeMode="contain" /> : null}{selected.length > 1 ? <View style={styles.basketCount}><Text style={styles.basketCountText}>{selected.length}</Text></View> : null}<Text style={styles.categoryLabel}>{FOOD_CATEGORIES[categoryIndex]?.label}</Text></View>
        <Pressable onPress={() => moveCategory(1)} style={styles.arrow}><Text style={styles.arrowText}>›</Text></Pressable>
      </View>
      <Pressable onPress={buy} style={[styles.buyButton, !selected.length && styles.buyButtonMuted]}>
        <Text style={styles.buyText}>{selected.length ? `Купить ${selected.length} · ${total} ●` : 'Выбери продукты'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7', paddingBottom: 90 },
  header: { height: 92, paddingTop: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  back: { fontFamily: fontFamily.regular, fontSize: 32, color: '#2A1105', marginRight: 4, marginTop: -3 },
  title: { fontFamily: fontFamily.bold, fontSize: 16, color: '#2A1105', flex: 1 },
  balance: { minWidth: 70, height: 42, borderRadius: 11, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, shadowColor: '#534122', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.65, shadowRadius: 0, elevation: 3 },
  balanceText: { fontFamily: fontFamily.semiBold, color: '#2A1105' }, coin: { color: '#F2A900', fontSize: 18 },
  products: { paddingHorizontal: 10, paddingTop: 12, paddingBottom: 240, flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 14 },
  product: { width: '31.8%', minHeight: 132, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', padding: 8, borderWidth: 2, borderColor: 'transparent', shadowColor: '#7C5A44', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.16, shadowRadius: 3, elevation: 2 },
  productSelected: { borderColor: '#4B7A2C', backgroundColor: '#F3F8EF' }, productImage: { width: 72, height: 66 },
  productName: { fontFamily: fontFamily.semiBold, color: '#3B1606', fontSize: 11, marginTop: 2, maxWidth: '100%' },
  price: { marginTop: 5, minWidth: 52, height: 25, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#BBAE9E', flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center' },
  priceText: { fontFamily: fontFamily.semiBold, color: '#2A1105', fontSize: 12 }, priceCoin: { color: '#F2A900', fontSize: 13 },
  check: { position: 'absolute', right: 5, top: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: '#4B7A2C', alignItems: 'center', justifyContent: 'center' }, checkText: { color: '#fff', fontFamily: fontFamily.bold },
  categoryBox: { position: 'absolute', left: 14, right: 14, bottom: 145, height: 82, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 46, height: 58, alignItems: 'center', justifyContent: 'center' }, arrowText: { fontFamily: fontFamily.bold, fontSize: 50, color: '#4B7A2C', lineHeight: 52 },
  basket: { width: 190, height: 100, alignItems: 'center', justifyContent: 'center' },
  basketImage: { position: 'absolute', width: 170, height: 104, top: -9 },
  basketFood: { position: 'absolute', top: -23, width: 52, height: 52, zIndex: 2 },
  basketCount: { position: 'absolute', right: 28, top: 2, minWidth: 23, height: 23, paddingHorizontal: 4, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#6C432B', zIndex: 3, alignItems: 'center', justifyContent: 'center' },
  basketCountText: { fontFamily: fontFamily.bold, fontSize: 11, color: '#3B1606' },
  categoryLabel: { position: 'absolute', bottom: 9, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 5, backgroundColor: '#5B2E1D', fontFamily: fontFamily.bold, color: '#fff', fontSize: 12 },
  buyButton: { position: 'absolute', left: 18, right: 18, bottom: 95, height: 48, borderRadius: 12, backgroundColor: '#3B1606', alignItems: 'center', justifyContent: 'center' },
  buyButtonMuted: { backgroundColor: '#8C7A6F' }, buyText: { fontFamily: fontFamily.bold, color: '#fff', fontSize: 14 },
});
