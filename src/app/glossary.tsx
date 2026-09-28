import { fontFamily } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TERMS = [
  ['Баланс', 'сколько денег у тебя есть сейчас'],
  ['Банковская карта', 'деньги, которые хранятся в цифровом виде'],
  ['Бюджет', 'сколько денег есть и на что их потратить'],
  ['Деньги', 'то, чем платят за товары и услуги'],
  ['Доход', 'деньги, которые ты получаешь'],
  ['Копить', 'откладывать деньги, чтобы достичь цели'],
  ['Лимит', 'граница, дальше которой тратить нельзя'],
  ['Необязательные расходы', 'то, что хочется, но можно не купить сейчас'],
  ['Обязательные расходы', 'траты на необходимое: лекарства, еду и другие важные вещи'],
  ['Покупка', 'товар или услуга, за которые платишь деньги'],
  ['Расходы', 'деньги, которые потратил'],
  ['Стоимость', 'сколько денег заплатить за товар или услугу'],
  ['Товар', 'вещь, которую продают'],
  ['Финансовая грамотность', 'способность разумно распределять деньги'],
  ['Финансовая цель', 'то, на что ты решил накопить деньги'],
  ['Цена', 'деньги, которые платишь за товар или услугу'],
  ['Экономить', 'стараться не тратить лишние деньги'],
  ['Электронный кошелёк', 'место, где хранишь цифровые деньги'],
] as const;

export default function GlossaryScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹</Text></Pressable>
        <Text style={styles.title}>Термины</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {TERMS.map(([term, description]) => (
          <View key={term} style={styles.row}>
            <Text style={styles.term}>{term}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F4' },
  header: { height: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  backButton: { width: 38, height: 44, justifyContent: 'center' },
  back: { fontSize: 38, lineHeight: 40, color: '#24150D' },
  title: { fontFamily: fontFamily.bold, fontSize: 18, color: '#24150D' },
  content: { paddingHorizontal: 14, paddingBottom: 28 },
  row: { minHeight: 52, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#8F8A87', paddingVertical: 6 },
  term: { fontFamily: fontFamily.medium, fontSize: 13, color: '#2A1B14' },
  description: { fontFamily: fontFamily.regular, fontSize: 10, lineHeight: 13, color: '#716861', marginTop: 2 },
});
