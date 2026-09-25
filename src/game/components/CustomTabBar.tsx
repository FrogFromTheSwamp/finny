import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIcon } from '@/game/components/TabIcon';

const iconNames = ['learn', 'goals', 'home', 'food', 'shop'] as const;

export function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { height: 87 + insets.bottom, paddingBottom: insets.bottom }]}>
      <View style={styles.bar}>
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
          const iconName = iconNames[index] ?? 'home';
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              style={({ pressed }) => [styles.item, focused && styles.itemFocused, pressed && styles.pressed]}
            >
              <TabIcon name={iconName} size={focused ? 44 : 40} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', justifyContent: 'flex-end', backgroundColor: 'transparent' },
  bar: { width: 368, maxWidth: '94%', height: 79, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  item: { width: 68, height: 68, marginTop: 4, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#534122', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  itemFocused: { width: 76, height: 76, marginTop: 0, backgroundColor: '#E7DFD5', borderWidth: 2, borderColor: '#534122' },
  pressed: { transform: [{ scale: 0.96 }] },
});
