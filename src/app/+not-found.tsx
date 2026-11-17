import { FinnyButton } from '@/components/FinnyButton';
import type { PetColorId } from '@/content/petColors';
import { PetWithHat } from '@/game/components/PetWithHat';
import { useProfileStore } from '@/store/profileStore';
import { fontFamily } from '@/ui/theme';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Страница 404: Expo Router показывает её для любого адреса,
// которому не соответствует ни один файл в папке app/.
export default function NotFoundScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const color = (useProfileStore((s) => s.petColorId) || 'brown') as PetColorId;

  const goHome = () => {
    // "/" — это app/index.tsx: он сам отправит на главную или в онбординг
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <Text style={styles.code}>404</Text>
        <View style={styles.pet}>
          <PetWithHat color={color} emotion="sad" />
        </View>
        <Text style={styles.title}>Такой страницы нет</Text>
        <Text style={styles.text}>Финни поискал везде, но не нашёл адрес «{pathname}». Возможно, ссылка устарела.</Text>
      </View>
      <View style={styles.bottom}>
        <FinnyButton label="На главную" onPress={goHome} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6F5F3', paddingHorizontal: 18 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  code: { fontFamily: fontFamily.bold, fontSize: 64, color: '#D9D1CB' },
  pet: { height: 220, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  title: { fontFamily: fontFamily.bold, fontSize: 25, color: '#29180F', textAlign: 'center' },
  text: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20, color: '#81736B', textAlign: 'center', marginTop: 10 },
  bottom: { paddingBottom: 22 },
});
