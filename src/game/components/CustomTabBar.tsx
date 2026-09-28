import tabFood from '@/assets/library/ui/navigation/tabbar-food.png';
import tabGoals from '@/assets/library/ui/navigation/tabbar-goals.png';
import tabHome from '@/assets/library/ui/navigation/tabbar-home.png';
import tabLearn from '@/assets/library/ui/navigation/tabbar-learn.png';
import tabShop from '@/assets/library/ui/navigation/tabbar-shop.png';
import { TutorialHand } from '@/game/components/TutorialHand';
import { useGameStore } from '@/game/store/gameStore';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const routeOrder = ['learn', 'goals', 'home', 'food', 'shop'] as const;
const stateImages = { learn: tabLearn, goals: tabGoals, home: tabHome, food: tabFood, shop: tabShop } as const;

export function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const barWidth = Math.min(width * 0.94, 368);
  const activeName = (state.routes[state.index]?.name ?? 'home') as keyof typeof stateImages;
  const tutorialStage = useGameStore((s) => s.tutorialStage);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { height: 79 + insets.bottom, paddingBottom: insets.bottom }]}> 
      <View style={[styles.bar, { width: barWidth }]}> 
        <Image source={stateImages[activeName] ?? tabHome} resizeMode="stretch" style={StyleSheet.absoluteFill} />
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
          const routeName = (routeOrder[index] ?? route.name) as (typeof routeOrder)[number];
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel ?? descriptors[route.key]?.options.title}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              style={styles.hitArea}
            >
              {(tutorialStage === 2 && routeName === 'food') || (tutorialStage === 6 && routeName === 'shop') ? (
                <TutorialHand style={styles.tutorialHand} rotate="-18deg" />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 0, bottom: 0, left: 0, width: '100%', zIndex: 10, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { height: 79, flexDirection: 'row' },
  hitArea: { flex: 1, height: 79, position: 'relative' },
  tutorialHand: { top: -54, right: 0 },
});
