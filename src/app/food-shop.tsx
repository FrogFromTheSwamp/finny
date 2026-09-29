import categoryBasket from "@/assets/library/food/ui/category-basket.png";
import leftArrow from "@/assets/library/ui/arrows/left.png";
import rightArrow from "@/assets/library/ui/arrows/right.png";
import shelfPlank from "@/assets/library/ui/shelf.png";
import {
  FOOD_BY_ID,
  FOOD_CATEGORIES,
  FOOD_ITEMS,
  type FoodCategoryId,
  type FoodId,
} from "@/game/catalog";
import { TutorialHand } from "@/game/components/TutorialHand";
import { AnimatedNumber } from "@/game/components/AnimatedNumber";
import { showGameDialog } from "@/game/services/dialogService";
import { useGameStore } from "@/game/store/gameStore";
import { sessionUi } from "@/game/sessionUi";
import { fontFamily } from "@/ui/theme";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

export default function FoodShopScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<FoodCategoryId>(() =>
    FOOD_CATEGORIES.find((item) => item.id === sessionUi.foodCategory)?.id ?? "fruits",
  );
  const [basketItems, setBasketItems] = useState<FoodId[]>([]);
  const [flyingFood, setFlyingFood] = useState<FoodId | null>(null);
  const rootRef = useRef<View>(null);
  const basketRef = useRef<View>(null);
  const productRefs = useRef<Partial<Record<FoodId, View | null>>>({});
  const buyingRef = useRef(false);
  const flightX = useRef(new Animated.Value(0)).current;
  const flightY = useRef(new Animated.Value(0)).current;
  const coins = useGameStore((s) => s.coins);
  const tutorialStage = useGameStore((s) => s.tutorialStage);
  const setTutorialStage = useGameStore((s) => s.setTutorialStage);
  const purchaseFood = useGameStore((s) => s.purchaseFood);
  const refundFood = useGameStore((s) => s.refundFood);
  const items = useMemo(
    () => FOOD_ITEMS.filter((item) => item.category === category),
    [category],
  );
  useEffect(() => { sessionUi.foodCategory = category; }, [category]);
  const categoryIndex = FOOD_CATEGORIES.findIndex(
    (item) => item.id === category,
  );
  const moveCategory = (delta: number) => {
    const next =
      (categoryIndex + delta + FOOD_CATEGORIES.length) % FOOD_CATEGORIES.length;
    setCategory(FOOD_CATEGORIES[next]!.id);
  };
  const buy = (foodId: FoodId, name: string, price: number) => {
    if (buyingRef.current) return;
    buyingRef.current = true;
    if (!purchaseFood(foodId)) {
      showGameDialog(`${name} стоит ${price} монет, а у тебя ${coins}.`, {
        title: "Не хватает монет",
      });
      setTimeout(() => { buyingRef.current = false; }, 450);
      return;
    }

    if (tutorialStage === 3 && foodId === "apple") setTutorialStage(4);

    const product = productRefs.current[foodId];
    const basket = basketRef.current;
    const root = rootRef.current;
    if (!product || !basket || !root) {
      setBasketItems((current) => [...current, foodId]);
      buyingRef.current = false;
      return;
    }

    root.measureInWindow((rootX, rootY) => {
      product.measureInWindow(
        (productX, productY, productWidth, productHeight) => {
          basket.measureInWindow(
            (basketX, basketY, basketWidth, basketHeight) => {
              const FLY_SIZE = 52;
              const targetCenterX = basketX - rootX + basketWidth / 2;
              const targetCenterY =
                basketY - rootY + basketHeight / 2 - 23 + FLY_SIZE / 2;

              flightX.setValue(
                productX - rootX + productWidth / 2 - FLY_SIZE / 2,
              );
              flightY.setValue(
                productY - rootY + productHeight / 2 - FLY_SIZE / 2,
              );

              setFlyingFood(foodId);
              Animated.parallel([
                Animated.timing(flightX, {
                  toValue: targetCenterX - FLY_SIZE / 2,
                  duration: 420,
                  useNativeDriver: true,
                }),
                Animated.timing(flightY, {
                  toValue: targetCenterY - FLY_SIZE / 2,
                  duration: 420,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                setBasketItems((current) => [...current, foodId]);
                setFlyingFood(null);
                buyingRef.current = false;
              });
            },
          );
        },
      );
    });
  };

  const removeLastFromBasket = () => {
    if (!basketItems.length) return;
    const lastId = basketItems[basketItems.length - 1]!;
    refundFood(lastId);
    setBasketItems((current) => current.slice(0, -1));
  };

  return (
    <View ref={rootRef} style={styles.root}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Вернуться к еде"
          onPress={() => router.replace("/(tabs)/food")}
          style={styles.backButton}
        >
          <Text style={styles.back}>‹</Text>
          {tutorialStage === 4 ? <TutorialHand style={styles.backHand} rotate="25deg" /> : null}
        </Pressable>
        <Text style={styles.title}>Продукты</Text>
        <View style={styles.balance}>
          <AnimatedNumber value={coins} style={styles.balanceText} />
          <Text style={styles.coin}>●</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.shelves}>
        {chunk(items, 3).map((row, rowIndex) => (
          <View key={rowIndex} style={styles.shelfRow}>
            <Image source={shelfPlank} style={styles.shelfPlank} resizeMode="stretch" />
            <View style={styles.shelfItems}>
              {row.map((item) => (
                <Pressable
                  key={item.id}
                  ref={(node) => {
                    productRefs.current[item.id] = node;
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Купить ${item.name} за ${item.price} монет`}
                  onPress={() => buy(item.id, item.name, item.price)}
                  style={styles.shelfSlot}
                >
                  <Image
                    source={item.image}
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                  <View style={styles.price}>
                    <Text style={styles.priceText}>{item.price}</Text>
                    <Text style={styles.priceCoin}>●</Text>
                  </View>
                  {tutorialStage === 3 && item.id === "apple" ? (
                    <TutorialHand style={styles.appleHand} rotate="-18deg" />
                  ) : null}
                </Pressable>
              ))}
              {row.length < 3 &&
                Array.from({ length: 3 - row.length }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.shelfSlot} />
                ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.categoryBox}>
        <Pressable onPress={() => moveCategory(-1)} style={styles.arrow}>
          <Image source={leftArrow} style={styles.arrowImage} resizeMode="contain" />
        </Pressable>
        <Pressable
          ref={basketRef}
          onPress={removeLastFromBasket}
          style={styles.basket}
          accessibilityRole="button"
          accessibilityLabel={
            basketItems.length
              ? `Вернуть последний продукт. В корзине: ${basketItems.length}`
              : "Корзина пуста"
          }
        >
          <Image
            source={categoryBasket}
            style={styles.basketImage}
            resizeMode="contain"
          />
          {basketItems.length ? (
            <Image
              source={FOOD_BY_ID[basketItems[basketItems.length - 1]!].image}
              style={styles.basketFood}
              resizeMode="contain"
            />
          ) : null}
          {basketItems.length > 0 ? (
            <View style={styles.basketCount}>
              <Text style={styles.basketCountText}>{basketItems.length}</Text>
            </View>
          ) : null}
          <Text style={styles.categoryLabel}>
            {FOOD_CATEGORIES[categoryIndex]?.label}
          </Text>
        </Pressable>
        <Pressable onPress={() => moveCategory(1)} style={styles.arrow}>
          <Image source={rightArrow} style={styles.arrowImage} resizeMode="contain" />
        </Pressable>
      </View>
      {flyingFood ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flyingFood,
            { transform: [{ translateX: flightX }, { translateY: flightY }] },
          ]}
        >
          <Image
            source={FOOD_BY_ID[flyingFood].image}
            style={styles.flyingFoodImage}
            resizeMode="contain"
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F7F7F7" },
  header: {
    height: "15%",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backHand: { top: 24, left: 12 },
  appleHand: { top: 10, right: -18 },
  backButton: {
    width: 32,
    height: 42,
    justifyContent: "center",
    marginRight: 4,
  },
  back: {
    fontFamily: fontFamily.regular,
    fontSize: 32,
    color: "#2A1105",
    marginTop: -3,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: "#2A1105",
    flex: 1,
    marginTop: 10,
  },
  balance: {
    minWidth: 70,
    height: 42,
    borderRadius: 11,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    shadowColor: "#534122",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.65,
    shadowRadius: 0,
    elevation: 3,
  },
  balanceText: { fontFamily: fontFamily.semiBold, color: "#2A1105" },
  coin: { color: "#F2A900", fontSize: 18 },
  shelves: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 140,
  },
  shelfRow: {
    marginBottom: 28,
  },
  shelfPlank: {
    position: "absolute",
    left: -20,
    right: -20,
    bottom: 6,
    height: 22,
  },
  shelfItems: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 4,
  },
  shelfSlot: {
    width: "30%",
    alignItems: "center",
  },
  productImage: {
    width: 72,
    height: 66,
    marginBottom: 8,
  },
  price: {
    minWidth: 52,
    height: 25,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#BBAE9E",
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  priceText: {
    fontFamily: fontFamily.semiBold,
    color: "#2A1105",
    fontSize: 12,
  },
  priceCoin: { color: "#F2A900", fontSize: 13 },
  categoryBox: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 32,
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrow: {
    width: 46,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowImage: { width: 48, height: 50 },
  categoryLabel: {
    position: "absolute",
    bottom: 9,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: "#5B2E1D",
    fontFamily: fontFamily.bold,
    color: "#fff",
    fontSize: 12,
  },
  basket: {
    width: 190,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  basketImage: { position: "absolute", width: 170, height: 104, top: -9 },
  basketFood: {
    position: "absolute",
    top: -23,
    width: 52,
    height: 52,
    zIndex: 2,
  },
  basketCount: {
    position: "absolute",
    right: 28,
    top: 2,
    minWidth: 23,
    height: 23,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#6C432B",
    zIndex: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  basketCountText: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: "#3B1606",
  },
  flyingFood: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 52,
    height: 52,
    zIndex: 10,
  },
  flyingFoodImage: {
    width: "100%",
    height: "100%",
  },
});
