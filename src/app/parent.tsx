import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOAL_TEMPLATE_BY_ID } from '@/features/goals/catalog';
import { CHAPTERS, LESSON_BY_ID } from '@/features/learning/content';
import { useGameStore } from '@/game/store/gameStore';
import { useProfileStore } from '@/store/profileStore';
import { fontFamily } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PARENT_PIN_KEY = 'finny-parent-pin';

type GateMode = 'loading' | 'create' | 'enter' | 'open';

export default function ParentScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [mode, setMode] = useState<GateMode>('loading');
  const [pin, setPin] = useState('');
  const [savedPin, setSavedPin] = useState('');
  const [error, setError] = useState('');
  const player = useProfileStore((s) => s.playerName || 'Ребёнок');
  const resetProfile = useProfileStore((s) => s.resetProfile);
  const done = useGameStore((s) => s.completedLessons);
  const accuracy = useGameStore((s) => s.lessonAccuracy);
  const allGoals = useGameStore((s) => s.goals);
  const goals = allGoals.filter((goal) => !goal.purchasedAt);
  const resetGame = useGameStore((s) => s.resetGame);

  useEffect(() => {
    AsyncStorage.getItem(PARENT_PIN_KEY).then((value) => {
      setSavedPin(value ?? '');
      setMode(value ? 'enter' : 'create');
      setTimeout(() => inputRef.current?.focus(), 120);
    });
  }, []);

  const average = useMemo(() => {
    if (!done.length) return 0;
    return Math.round(done.reduce((sum, id) => sum + (accuracy[id] ?? 0), 0) / done.length);
  }, [accuracy, done]);

  const submitPin = async () => {
    if (pin.length !== 4) {
      setError('Введите 4 цифры');
      return;
    }
    if (mode === 'create') {
      await AsyncStorage.setItem(PARENT_PIN_KEY, pin);
      setSavedPin(pin);
      setPin('');
      setError('');
      setMode('open');
      return;
    }
    if (pin !== savedPin) {
      setPin('');
      setError('Неверный код');
      setTimeout(() => inputRef.current?.focus(), 80);
      return;
    }
    setPin('');
    setError('');
    setMode('open');
  };

  const removeProfile = () => {
    Alert.alert('Удалить профиль ребёнка?', 'Будут удалены питомец, учебный прогресс, монеты и цели на этом устройстве.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          resetGame();
          resetProfile();
          await AsyncStorage.removeItem(PARENT_PIN_KEY);
          router.replace('/welcome');
        },
      },
    ]);
  };

  if (mode !== 'open') {
    return (
      <SafeAreaView style={styles.gateRoot}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹</Text></Pressable>
          <Text style={styles.headerTitle}>Аккаунт родителя</Text>
        </View>
        <View style={styles.gateContent}>
          <Text style={styles.gateTitle}>{mode === 'create' ? 'Создайте код доступа' : 'Введите код доступа'}</Text>
          <Text style={styles.gateText}>{mode === 'create' ? 'Код защищает взрослый раздел от случайного входа ребёнка.' : 'Введите четырёхзначный код, который был создан для взрослого раздела.'}</Text>
          <Pressable style={styles.pinRow} onPress={() => inputRef.current?.focus()}>
            {[0, 1, 2, 3].map((index) => <View key={index} style={[styles.pinBox, pin.length === index && styles.pinBoxActive]}><Text style={styles.pinDot}>{pin[index] ? '●' : ''}</Text></View>)}
          </Pressable>
          <TextInput
            ref={inputRef}
            value={pin}
            onChangeText={(value) => { setPin(value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            style={styles.hiddenInput}
            onSubmitEditing={submitPin}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={[styles.primaryButton, (mode === 'loading' || pin.length !== 4) && styles.primaryDisabled]} disabled={mode === 'loading' || pin.length !== 4} onPress={submitPin}>
            <Text style={styles.primaryButtonText}>{mode === 'create' ? 'Создать пароль' : 'Войти'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const completedTopics = CHAPTERS.map((chapter) => ({
    ...chapter,
    completed: chapter.lessons.filter((lessonId) => done.includes(lessonId)).length,
  }));

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹</Text></Pressable>
        <Text style={styles.headerTitle}>Аккаунт родителя</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Цели ребёнка</Text>
        {goals.length ? goals.map((goal) => {
          const template = GOAL_TEMPLATE_BY_ID[goal.templateId];
          const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));
          return (
            <View key={goal.id} style={styles.goalCard}>
              <Image source={template.image} style={styles.goalImage} resizeMode="contain" />
              <View style={styles.goalCopy}>
                <Text style={styles.goalName}>{goal.name}</Text>
                <Text style={styles.goalValue}>{goal.saved} из {goal.target} ●</Text>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${percent}%` }]} /></View>
              </View>
            </View>
          );
        }) : <View style={styles.emptyCard}><Text style={styles.emptyText}>У {player} пока нет активных целей</Text></View>}

        <Text style={styles.sectionTitle}>Пройденные темы</Text>
        <View style={styles.whiteCard}>
          {completedTopics.map((chapter, index) => (
            <View key={chapter.id} style={[styles.topicRow, index < completedTopics.length - 1 && styles.rowDivider]}>
              <View style={[styles.topicDot, { backgroundColor: chapter.color }]} />
              <View style={styles.topicCopy}>
                <Text style={styles.topicName}>{chapter.title}</Text>
                <Text style={styles.topicSub}>{chapter.lessons.filter((lessonId) => done.includes(lessonId)).map((lessonId) => LESSON_BY_ID[lessonId]?.title).filter(Boolean).join(' · ') || 'Уроки ещё не пройдены'}</Text>
              </View>
              <Text style={styles.topicValue}>{chapter.completed}/{chapter.lessons.length}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Прогресс</Text>
        {done.length >= 6 ? (
          <View style={styles.progressCards}>
            <View style={styles.metric}><Text style={styles.metricValue}>{done.length}</Text><Text style={styles.metricLabel}>уроков пройдено</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{average}%</Text><Text style={styles.metricLabel}>средняя точность</Text></View>
          </View>
        ) : (
          <View style={styles.infoCard}><Text style={styles.infoTitle}>Статистика появится позже</Text><Text style={styles.infoText}>Подробный прогресс станет доступен после 6 пройденных уроков. Сейчас пройдено: {done.length}.</Text></View>
        )}

        <Pressable onPress={removeProfile} style={styles.deleteRow}><Text style={styles.deleteText}>Удалить профиль ребёнка</Text><Text style={styles.deleteArrow}>›</Text></Pressable>
        <Text style={styles.note}>Finny не подключается к банковским счетам. Учебные монеты, цели и прогресс хранятся локально на устройстве.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F4' },
  gateRoot: { flex: 1, backgroundColor: '#F4F4F4' },
  header: { height: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  backButton: { width: 38, height: 44, justifyContent: 'center' },
  back: { fontSize: 38, lineHeight: 40, color: '#24150D' },
  headerTitle: { fontFamily: fontFamily.bold, fontSize: 18, color: '#24150D' },
  gateContent: { flex: 1, paddingHorizontal: 28, paddingTop: 86, alignItems: 'center' },
  gateTitle: { fontFamily: fontFamily.bold, color: '#25160E', fontSize: 27, textAlign: 'center' },
  gateText: { fontFamily: fontFamily.medium, color: '#756861', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 10, maxWidth: 330 },
  pinRow: { flexDirection: 'row', gap: 10, marginTop: 36 },
  pinBox: { width: 56, height: 62, borderRadius: 11, backgroundColor: '#fff', borderWidth: 2, borderColor: '#D6D0CC', alignItems: 'center', justifyContent: 'center' },
  pinBoxActive: { borderColor: '#5B2E1D' },
  pinDot: { fontFamily: fontFamily.bold, color: '#2A190F', fontSize: 21 },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  error: { fontFamily: fontFamily.semiBold, color: '#B03A28', fontSize: 12, marginTop: 14 },
  primaryButton: { marginTop: 30, width: '100%', maxWidth: 340, minHeight: 52, borderRadius: 9, backgroundColor: '#421600', alignItems: 'center', justifyContent: 'center' },
  primaryDisabled: { opacity: 0.4 },
  primaryButtonText: { fontFamily: fontFamily.bold, color: '#fff', fontSize: 14 },
  content: { paddingHorizontal: 16, paddingBottom: 44 },
  sectionTitle: { fontFamily: fontFamily.bold, fontSize: 20, color: '#25160E', marginTop: 18, marginBottom: 10 },
  goalCard: { minHeight: 106, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E1DDDA', flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 8 },
  goalImage: { width: 84, height: 84 },
  goalCopy: { flex: 1, paddingLeft: 10 },
  goalName: { fontFamily: fontFamily.bold, color: '#2A190F', fontSize: 14 },
  goalValue: { fontFamily: fontFamily.medium, color: '#75645A', fontSize: 11, marginTop: 5 },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: '#E5E0DC', overflow: 'hidden', marginTop: 9 },
  progressFill: { height: '100%', backgroundColor: '#E4A220' },
  emptyCard: { minHeight: 82, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 14 },
  emptyText: { fontFamily: fontFamily.medium, color: '#7B6D65', fontSize: 13 },
  whiteCard: { borderRadius: 14, backgroundColor: '#fff', overflow: 'hidden', borderWidth: 1, borderColor: '#E1DDDA' },
  topicRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DED9D5' },
  topicDot: { width: 34, height: 34, borderRadius: 17 },
  topicCopy: { flex: 1, paddingHorizontal: 10 },
  topicName: { fontFamily: fontFamily.bold, color: '#2A190F', fontSize: 13 },
  topicSub: { fontFamily: fontFamily.medium, color: '#83766E', fontSize: 9, lineHeight: 13, marginTop: 3 },
  topicValue: { fontFamily: fontFamily.bold, color: '#6B594E', fontSize: 12 },
  progressCards: { flexDirection: 'row', gap: 9 },
  metric: { flex: 1, minHeight: 100, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 12 },
  metricValue: { fontFamily: fontFamily.bold, color: '#25160E', fontSize: 25 },
  metricLabel: { fontFamily: fontFamily.medium, color: '#796D66', fontSize: 10, textAlign: 'center', marginTop: 5 },
  infoCard: { borderRadius: 14, backgroundColor: '#fff', padding: 16 },
  infoTitle: { fontFamily: fontFamily.bold, color: '#2A190F', fontSize: 14 },
  infoText: { fontFamily: fontFamily.medium, color: '#796D66', fontSize: 11, lineHeight: 17, marginTop: 5 },
  deleteRow: { height: 58, borderRadius: 12, backgroundColor: '#fff', marginTop: 26, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  deleteText: { flex: 1, fontFamily: fontFamily.semiBold, color: '#B13A2D', fontSize: 13 },
  deleteArrow: { color: '#9A8980', fontSize: 28 },
  note: { fontFamily: fontFamily.medium, fontSize: 10, lineHeight: 15, color: '#8A7D75', textAlign: 'center', marginTop: 18, paddingHorizontal: 12 },
});
