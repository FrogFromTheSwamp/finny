import { TabIcon } from "@/game/components/TabIcon";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const iconNames = ["learn", "goals", "home", "food", "shop"] as const;

export function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const barWidth = Math.min(width * 0.94, 368);
  const itemWidth = barWidth / state.routes.length;
  const itemMargin = Math.min(4, itemWidth * 0.04);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { height: 87 + insets.bottom, paddingBottom: insets.bottom },
      ]}
    >
      <View style={[styles.bar, { width: barWidth }]}>
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
          const iconName = iconNames[index] ?? "home";
          const itemHeight = Math.min(focused ? 76 : 68, itemWidth * 0.94);
          const iconSize = Math.min(focused ? 44 : 40, itemWidth * 0.58);
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={
                descriptors[route.key]?.options.tabBarAccessibilityLabel
              }
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented)
                  navigation.navigate(route.name, route.params);
              }}
              style={({ pressed }) => [
                styles.item,
                { height: itemHeight, marginHorizontal: itemMargin },
                focused && styles.itemFocused,
                pressed && styles.pressed,
              ]}
            >
              <TabIcon name={iconName} size={iconSize} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    zIndex: 10,
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  bar: {
    height: 79,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  item: {
    flex: 1,
    marginTop: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  itemFocused: {
    marginTop: 0,
    backgroundColor: "#E7DFD5",
    borderWidth: 2,
    borderColor: "#534122",
  },
  pressed: { transform: [{ scale: 0.96 }] },
});
