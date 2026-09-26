import { useEffect, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import homeRoom from '@/assets/game/rooms/home-room.png';
import { DailyRewardModal } from '@/game/components/DailyRewardModal';
import { GameHud } from '@/game/components/GameHud';
import { PetSprite } from '@/game/components/PetSprite';
import { showGameDialog } from '@/game/services/dialogService';
import { useGameStore } from '@/game/store/gameStore';
import { useProfileStore } from '@/store/profileStore';
import { fontFamily } from '@/ui/theme';
import type { PetColorId } from '@/content/petColors';

export default function HomeScreen() {
  const petName = useProfileStore((s) => s.petName || 'Финни');
  const color = (useProfileStore((s) => s.petColorId) || 'brown') as PetColorId;
  const canClaim = useGameStore((s) => s.canClaimDailyReward());
  const [rewardOpen, setRewardOpen] = useState(false);

  useEffect(() => {
    if (canClaim) {
      const timer = setTimeout(() => setRewardOpen(true), 650);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [canClaim]);

  return (
    <View style={styles.root}>
      <ImageBackground source={homeRoom} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <GameHud />
      <View style={styles.petArea}>
        <PetSprite color={color} onPress={() => showGameDialog(`Привет! Я ${petName}. Если хочешь, покорми меня на вкладке «Еда» или выбери продукты в магазине.`, { title: petName })} />
      </View>
      <DailyRewardModal visible={rewardOpen} onClose={() => setRewardOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  petArea: { position: 'absolute', left: 0, right: 0, bottom: '20%', alignItems: 'center' },
  rewardShortcut: { position: 'absolute', left: 14, bottom: 105, minHeight: 42, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.94)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 5, shadowColor: '#534122', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 0, elevation: 3 },
  rewardEmoji: { fontSize: 18 }, rewardText: { fontFamily: fontFamily.semiBold, color: '#2A1105', fontSize: 12 },
});
