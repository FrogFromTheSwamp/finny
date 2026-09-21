import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs initialRouteName="home" screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="learn" options={{ title: 'Учёба' }} />
      <Tabs.Screen name="goals" options={{ title: 'Копилка' }} />
      <Tabs.Screen name="home" options={{ title: 'Дом' }} />
      <Tabs.Screen name="food" options={{ title: 'Еда' }} />
      <Tabs.Screen name="shop" options={{ title: 'Магазин' }} />
    </Tabs>
  );
}