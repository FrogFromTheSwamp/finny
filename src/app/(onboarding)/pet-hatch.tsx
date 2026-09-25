import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import meadowBg from '@/assets/background/meadow.png';
import { HATCH_CAPTIONS } from '@/content/hatchStages';
import { PET_ASSETS } from '@/content/petAssets';
import type { PetColorId } from '@/content/petColors';
import { useProfileStore } from '@/store/profileStore';

const DESIGN_WIDTH = 412;
const TITLE_LEFT = 16;
const TITLE_TOP = 121;
const TITLE_WIDTH = 380;
const EGG_LEFT = 100;
const EGG_TOP = 345;
const EGG_WIDTH = 213;
const EGG_HEIGHT = 275;
const PET_LEFT = 106;
const PET_TOP = 412;
const PET_WIDTH = 200;
const PET_HEIGHT = 162;
const INPUT_LEFT = 16;
const INPUT_TOP = 674;
const INPUT_WIDTH = 380;
const INPUT_HEIGHT = 52;
const INPUT_KEYBOARD_GAP = 10;
const TEXT_COLOR = '#1E0C00';
const INPUT_BORDER = '#5B4134';
const BURST_DURATION_MS = 900;
const PET_ONLY_DURATION_MS = 700;

type Phase = 'cracking' | 'bursting' | 'pet-only' | 'naming';

export default function PetHatchScreen() {
  const { width } = useWindowDimensions();
  const scale = width / DESIGN_WIDTH;
  const scaleValue = (value: number) => value * scale;
  const storedColor = useProfileStore((state) => state.petColorId);
  const completeOnboarding = useProfileStore((state) => state.completeOnboarding);
  const color: PetColorId = storedColor || 'brown';
  const assets = PET_ASSETS[color];
  const [stageIndex, setStageIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('cracking');
  const [petName, setPetName] = useState('');
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardTop(event.endCoordinates.screenY);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardTop(null));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'bursting') return;
    const timer = setTimeout(() => setPhase('pet-only'), BURST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'pet-only') return;
    const timer = setTimeout(() => setPhase('naming'), PET_ONLY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const inputTop = useMemo(() => {
    const regularTop = scaleValue(INPUT_TOP);
    if (keyboardTop === null) return regularTop;
    return Math.min(regularTop, keyboardTop - scaleValue(INPUT_HEIGHT + INPUT_KEYBOARD_GAP));
  }, [keyboardTop, scale]);

  const handleEggPress = () => {
    if (phase !== 'cracking') return;
    if (stageIndex >= assets.eggStages.length - 1) {
      setPhase('bursting');
      return;
    }
    setStageIndex((current) => current + 1);
  };

  const submitName = () => {
    const trimmedName = petName.trim();
    if (!trimmedName) return;
    Keyboard.dismiss();
    completeOnboarding(trimmedName);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ImageBackground source={meadowBg} resizeMode="cover" style={StyleSheet.absoluteFill} />
      {phase === 'cracking' && (
        <>
          <Text style={[styles.title, {
            left: scaleValue(TITLE_LEFT), top: scaleValue(TITLE_TOP), width: scaleValue(TITLE_WIDTH),
            fontSize: scaleValue(34), lineHeight: scaleValue(39),
          }]}>{HATCH_CAPTIONS[stageIndex]}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Постучать по яйцу"
            onPress={handleEggPress}
            style={{
              position: 'absolute', left: scaleValue(EGG_LEFT), top: scaleValue(EGG_TOP),
              width: scaleValue(EGG_WIDTH), height: scaleValue(EGG_HEIGHT),
            }}
          >
            <Image source={assets.eggStages[stageIndex]} resizeMode="contain" style={StyleSheet.absoluteFill} />
          </Pressable>
        </>
      )}
      {phase === 'bursting' && (
        <Image source={assets.burst} resizeMode="cover" style={StyleSheet.absoluteFill} />
      )}
      {(phase === 'pet-only' || phase === 'naming') && (
        <Image source={assets.pet} resizeMode="contain" style={{
          position: 'absolute', left: scaleValue(PET_LEFT), top: scaleValue(PET_TOP),
          width: scaleValue(PET_WIDTH), height: scaleValue(PET_HEIGHT),
        }} />
      )}
      {phase === 'naming' && (
        <>
          <Text style={[styles.title, {
            left: scaleValue(TITLE_LEFT), top: scaleValue(TITLE_TOP), width: scaleValue(TITLE_WIDTH),
            fontSize: scaleValue(34), lineHeight: scaleValue(39),
          }]}>
            Какой хорошенький!{ '\n' }Как его назовёшь?
          </Text>
          <TextInput
            accessibilityLabel="Имя персонажа"
            value={petName}
            onChangeText={setPetName}
            onSubmitEditing={submitName}
            placeholder="Имя персонажа"
            placeholderTextColor={INPUT_BORDER}
            maxLength={20}
            autoCorrect={false}
            autoCapitalize="sentences"
            returnKeyType="done"
            blurOnSubmit
            style={[styles.nameInput, {
              left: scaleValue(INPUT_LEFT), top: inputTop, width: scaleValue(INPUT_WIDTH),
              height: scaleValue(INPUT_HEIGHT), borderRadius: scaleValue(8),
              borderWidth: Math.max(1, scaleValue(1)), paddingHorizontal: scaleValue(14),
              fontSize: scaleValue(18),
            }]}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden', backgroundColor: '#79ADD0' },
  title: { position: 'absolute', color: TEXT_COLOR, fontWeight: '700', textAlign: 'left' },
  nameInput: {
    position: 'absolute', backgroundColor: '#FFFFFF', borderColor: INPUT_BORDER,
    color: INPUT_BORDER, paddingVertical: 0, textAlignVertical: 'center',
  },
});
