import homeRoom from '@/assets/library/scenes/home.png';
import type { PetColorId } from '@/content/petColors';
import { DailyRewardModal } from '@/game/components/DailyRewardModal';
import { GameHud } from '@/game/components/GameHud';
import { PetSpeechBubble } from '@/game/components/PetSpeechBubble';
import { PetWithHat } from '@/game/components/PetWithHat';
import { showGameDialog } from '@/game/services/dialogService';
import { useGameStore } from '@/game/store/gameStore';
import { useProfileStore } from '@/store/profileStore';
import { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const petName = useProfileStore((s) => s.petName || 'Финни');
  const color = (useProfileStore((s) => s.petColorId) || 'brown') as PetColorId;
  const tutorialStage = useGameStore((s) => s.tutorialStage);
  const setTutorialStage = useGameStore((s) => s.setTutorialStage);
  const canClaim = useGameStore((s) => s.canClaimDailyReward());
  const [rewardOpen, setRewardOpen] = useState(false);
  const [showSpeech, setShowSpeech] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (tutorialStage === 0) {
      if (canClaim) timer = setTimeout(() => setRewardOpen(true), 550);
      else setTutorialStage(1);
    } else if (tutorialStage === 1 || tutorialStage === 5) {
      timer = setTimeout(() => setShowSpeech(true), 450);
    } else if (tutorialStage >= 8 && canClaim) {
      timer = setTimeout(() => setRewardOpen(true), 650);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [tutorialStage, canClaim, setTutorialStage]);

  const finishSpeech = () => {
    setShowSpeech(false);
    // tutorialStage становится 2 сразу после первой реплики — этого
    // достаточно, чтобы и в таббаре (иконка "Еда"), и на кухне (плюсик)
    // сама рука появилась по условию tutorialStage === 2, без отдельного
    // стора подсказок.
    if (tutorialStage === 1) setTutorialStage(2);
    if (tutorialStage === 5) setTutorialStage(6);
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={homeRoom} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <GameHud />
      <View style={styles.petArea}>
        <PetWithHat
          color={color}
          onPress={() => {
            if (tutorialStage < 8) return;
            showGameDialog(`Привет! Я ${petName}. Здесь наш дом — можно покормить меня, пройти уроки или заглянуть в копилку.`, { title: petName });
          }}
        />
      </View>
      {showSpeech && tutorialStage === 1 ? (
        <PetSpeechBubble
          lines={['Знаешь, что-то я проголодался...', 'Давай посмотрим, нет ли у нас еды?']}
          onFinish={finishSpeech}
        />
      ) : null}
      {showSpeech && tutorialStage === 5 ? (
        <PetSpeechBubble
          lines={['Спасибо! Теперь я сыт.', 'Я очень хочу колпак в точечку. Давай посмотрим, есть ли он в гардеробе?']}
          onFinish={finishSpeech}
        />
      ) : null}
      <DailyRewardModal
        visible={rewardOpen}
        mandatory={tutorialStage === 0}
        onClaimed={() => setTutorialStage(1)}
        onClose={() => setRewardOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  petArea: { position: 'absolute', left: 0, right: 0, bottom: '15%', alignItems: 'center' },
});