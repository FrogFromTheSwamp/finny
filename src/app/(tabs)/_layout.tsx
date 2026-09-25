import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/game/components/CustomTabBar';
import { GameRootOverlays } from '@/game/components/GameRootOverlays';

export default function TabsLayout() {
  return (
    <>
      <Tabs
        initialRouteName="home"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false, tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 } }}
      >
        <Tabs.Screen name="learn" options={{ title: 'Учёба' }} />
        <Tabs.Screen name="goals" options={{ title: 'Копилка' }} />
        <Tabs.Screen name="home" options={{ title: 'Дом' }} />
        <Tabs.Screen name="food" options={{ title: 'Еда' }} />
        <Tabs.Screen name="shop" options={{ title: 'Магазин' }} />
      </Tabs>
      <GameRootOverlays />
    </>
  );
}
