import userIcon from '@/assets/library/ui/icons/user.png';
import { useGameStore } from '@/game/store/gameStore';
import { useProfileStore } from '@/store/profileStore';
import { fontFamily } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const playerName = useProfileStore((s) => s.playerName || 'Игрок');
  const resetProfile = useProfileStore((s) => s.resetProfile);
  const resetGame = useGameStore((s) => s.resetGame);
  const completedChapters = useGameStore((s) => s.completedChapters);
  const currentChapter = Math.min(3, completedChapters.length + 1);

  const logout = () => Alert.alert('Выйти из профиля?', 'Локальный профиль и весь учебный прогресс будут удалены.', [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Выйти', style: 'destructive', onPress: () => { resetGame(); resetProfile(); router.replace('/welcome'); } },
  ]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹</Text></Pressable>
        <Text style={styles.title}>Профиль</Text>
      </View>
      <View style={styles.profileRow}>
        <View style={styles.avatar}><Image source={userIcon} style={styles.avatarIcon} resizeMode="contain" /></View>
        <View>
          <Text style={styles.name}>{playerName}</Text>
          <View style={styles.chapterBadge}><Text style={styles.chapterText}>Глава {currentChapter}</Text></View>
        </View>
      </View>
      <View style={styles.bottom}>
        <Pressable style={styles.logout} onPress={logout}><Text style={styles.logoutText}>Выйти</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F4' },
  header: { height: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  backButton: { width: 38, height: 44, justifyContent: 'center' },
  back: { fontSize: 38, lineHeight: 40, color: '#24150D' },
  title: { fontFamily: fontFamily.bold, fontSize: 18, color: '#24150D' },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: 16, gap: 12 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  avatarIcon: { width: 46, height: 46, opacity: .34 },
  name: { fontFamily: fontFamily.bold, fontSize: 17, color: '#21140E' },
  chapterBadge: { alignSelf: 'flex-start', marginTop: 3, borderRadius: 5, borderWidth: 1, borderColor: '#8F827A', paddingHorizontal: 6, paddingVertical: 2 },
  chapterText: { fontFamily: fontFamily.medium, fontSize: 10, color: '#534942' },
  bottom: { position: 'absolute', left: 14, right: 14, bottom: 22 },
  logout: { height: 48, borderRadius: 6, backgroundColor: '#431600', alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontFamily: fontFamily.bold, color: '#fff', fontSize: 14 },
});
