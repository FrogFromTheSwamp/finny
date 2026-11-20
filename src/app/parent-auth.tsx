/**
 * Вход и регистрация взрослого.
 */
import { ApiError } from '@/api/client';
import { loginParent, registerParent } from '@/api/parentSession';
import { useAppModeStore } from '@/store/appModeStore';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/TextField';
import { colors, spacing } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'login' | 'register';

function explain(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) return 'Нет связи с сервером. Проверьте интернет.';
    return error.message; // сервер присылает понятный текст: «Неверная почта или пароль» и т. п.
  }
  return 'Что-то пошло не так. Попробуйте ещё раз.';
}

export default function ParentAuthScreen() {
  const router = useRouter();
  const setMode = useAppModeStore((s) => s.setMode);
  const [tab, setTab] = useState<Tab>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordOk = password.length >= 8;
  const canSubmit = emailOk && passwordOk && (tab === 'login' || name.trim().length > 0) && !busy;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (tab === 'register') await registerParent({ email, password, name });
      else await loginParent({ email, password });
      router.replace('/'); // теперь вход выполнен — стартовый экран отведёт к детям
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText variant="title">Аккаунт взрослого</AppText>
        <AppText style={styles.muted}>
          Здесь вы увидите, как ребёнок осваивает финансовые навыки. Решения в игре
          ребёнок принимает сам — вы поддерживаете его.
        </AppText>

        <View style={styles.tabs}>
          <View style={styles.tab}>
            <Button label="Регистрация" variant={tab === 'register' ? 'primary' : 'secondary'} onPress={() => setTab('register')} />
          </View>
          <View style={styles.tab}>
            <Button label="Вход" variant={tab === 'login' ? 'primary' : 'secondary'} onPress={() => setTab('login')} />
          </View>
        </View>

        {tab === 'register' ? (
          <TextField label="Как к вам обращаться" value={name} onChangeText={setName} placeholder="Например, Мама" maxLength={80} />
        ) : null}
        <TextField
          label="Почта"
          value={email}
          onChangeText={setEmail}
          placeholder="mail@example.ru"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextField
          label="Пароль"
          value={password}
          onChangeText={setPassword}
          placeholder="Не меньше 8 символов"
          secureTextEntry
          autoCapitalize="none"
          autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
        />
        {password.length > 0 && !passwordOk ? (
          <AppText style={styles.hint}>Пароль должен быть не короче 8 символов</AppText>
        ) : null}
        {error ? <AppText style={styles.error}>{error}</AppText> : null}

        <Button
          label={busy ? 'Подождите…' : tab === 'register' ? 'Создать аккаунт' : 'Войти'}
          onPress={submit}
          disabled={!canSubmit}
        />
        <Button
          label="Назад"
          variant="secondary"
          onPress={() => {
            setMode(null);
            router.replace('/');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, flexGrow: 1, justifyContent: 'center' },
  muted: { color: colors.textMuted },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { flex: 1 },
  hint: { color: colors.textMuted, fontSize: 14 },
  error: { color: colors.danger },
});
