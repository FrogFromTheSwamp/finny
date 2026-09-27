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
import { PetSpeechBubble } from '@/game/components/PetSpeechBubble';

export default function HomeScreen() {
  const petName = useProfileStore((s) => s.petName || 'Финни');
  const color = (useProfileStore((s) => s.petColorId) || 'brown') as PetColorId;
  const tutorialFeedDone = useProfileStore((s) => s.tutorialFeedDone);
  const completeTutorialFeed = useProfileStore((s) => s.completeTutorialFeed);
  const canClaim = useGameStore((s) => s.canClaimDailyReward());
  const milestonesSeen = useGameStore((s) => s.milestonesSeen);
  const markMilestoneSeen = useGameStore((s) => s.markMilestoneSeen);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [showTutorialSpeech, setShowTutorialSpeech] = useState(false);

  useEffect(() => {
    if (canClaim) {
      const timer = setTimeout(() => setRewardOpen(true), 650);
      return () => clearTimeout(timer);
    }
    if (!tutorialFeedDone) {
      const timer = setTimeout(() => setShowTutorialSpeech(true), 650);
      return () => clearTimeout(timer);
    }
    return undefined;
    // Осознанно запускаем один раз при заходе на экран, а не при каждом
    // изменении canClaim/tutorialFeedDone — иначе получение награды
    // (которое сразу меняет canClaim) может неожиданно снова сработать этот эффект.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!tutorialFeedDone || milestonesSeen.includes('learning-unlocked')) return;
    const timer = setTimeout(() => {
      markMilestoneSeen('learning-unlocked');
      showGameDialog('Теперь можно проходить уроки на вкладке «Учёба». За уроки ты получаешь финники и открываешь новые возможности.', { title: 'Учёба открыта!' });
    }, 700);
    return () => clearTimeout(timer);
  }, [tutorialFeedDone, milestonesSeen, markMilestoneSeen]);

  const handleRewardClose = () => {
    setRewardOpen(false);
    if (!tutorialFeedDone) {
      setShowTutorialSpeech(true);
    }
  };

  const handleTutorialSpeechFinish = () => {
    setShowTutorialSpeech(false);
    completeTutorialFeed();
    // здесь включим подсказку на вкладку «Еда», когда разберёмся с CustomTabBar
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={homeRoom} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <GameHud />
      <View style={styles.petArea}>
        <PetSprite
          color={color}
          onPress={() =>
            showGameDialog(`Привет! Я ${petName}. Если хочешь, покорми меня на вкладке «Еда» или выбери продукты в магазине.`, { title: petName })
          }
        />
      </View>
      {showTutorialSpeech && (
        <PetSpeechBubble
          lines={[
            'Знаешь, что-то я проголодался...',
            'Давай посмотрим нет ли у нас еды?',
          ]}
          onFinish={handleTutorialSpeechFinish}
        />
      )}
      <DailyRewardModal visible={rewardOpen} onClose={handleRewardClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  petArea: { position: 'absolute', left: 0, right: 0, bottom: '15%', alignItems: 'center' },
  rewardShortcut: { position: 'absolute', left: 14, bottom: 105, minHeight: 42, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.94)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 5, shadowColor: '#534122', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 0, elevation: 3 },
  rewardEmoji: { fontSize: 18 }, rewardText: { fontFamily: fontFamily.semiBold, color: '#2A1105', fontSize: 12 },
});
