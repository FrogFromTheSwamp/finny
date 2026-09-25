import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    Image,
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';

import meadowBg from '@/assets/background/meadow.png';
import { PET_ASSETS } from '@/content/petAssets';
import { PET_COLOR_OPTIONS, type PetColorId } from '@/content/petColors';
import { useProfileStore } from '@/store/profileStore';

const DESIGN_WIDTH = 412;
const TITLE_TOP = 121;
const EGG_LEFT = 100;
const EGG_TOP = 345;
const EGG_WIDTH = 213;
const EGG_HEIGHT = 275;
const PALETTE_LEFT = 20;
const PALETTE_TOP = 723;
const SWATCH_SIZE = 66;
const SWATCH_INNER_SIZE = 50;
const SWATCH_GAP = 12;
const ARROW_LEFT = 340;
const ARROW_TOP = 821;
const ARROW_SIZE = 56;
const TEXT_COLOR = '#1E0C00';
const PRIMARY = '#391401';
const SWATCH_FRAME = '#EBEBEB';

export default function PetColorScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scale = width / DESIGN_WIDTH;
  const petColorId = useProfileStore((state) => state.petColorId);
  const setPetColor = useProfileStore((state) => state.setPetColor);
  const canContinue = petColorId !== '';
  const previewColor: PetColorId = petColorId || 'brown';
  const previewEgg = PET_ASSETS[previewColor].eggStages[0];
  const scaleValue = (value: number) => value * scale;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ImageBackground source={meadowBg} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <Text style={[styles.title, {
        left: scaleValue(16), top: scaleValue(TITLE_TOP), width: scaleValue(380),
        fontSize: scaleValue(34), lineHeight: scaleValue(39),
      }]}>Выбери цвет твоего{ '\n' }будущего питомца</Text>
      <Image source={previewEgg} resizeMode="contain" style={{
        position: 'absolute', left: scaleValue(EGG_LEFT), top: scaleValue(EGG_TOP),
        width: scaleValue(EGG_WIDTH), height: scaleValue(EGG_HEIGHT),
      }} />
      <View style={[styles.palette, {
        left: scaleValue(PALETTE_LEFT), top: scaleValue(PALETTE_TOP), gap: scaleValue(SWATCH_GAP),
      }]}>
        {PET_COLOR_OPTIONS.map((option) => {
          const selected = petColorId === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() => setPetColor(option.id)}
              style={({ pressed }) => [styles.swatchFrame, {
                width: scaleValue(SWATCH_SIZE), height: scaleValue(SWATCH_SIZE),
                padding: scaleValue((SWATCH_SIZE - SWATCH_INNER_SIZE) / 2),
                backgroundColor: selected ? '#000000' : SWATCH_FRAME,
              }, pressed && styles.pressed]}
            >
              <View style={{
                width: scaleValue(SWATCH_INNER_SIZE), height: scaleValue(SWATCH_INNER_SIZE),
                backgroundColor: option.hex,
              }} />
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="К следующему шагу"
        accessibilityState={{ disabled: !canContinue }}
        disabled={!canContinue}
        onPress={() => router.push('/pet-hatch')}
        style={({ pressed }) => [styles.arrowButton, {
          left: scaleValue(ARROW_LEFT), top: scaleValue(ARROW_TOP),
          width: scaleValue(ARROW_SIZE), height: scaleValue(ARROW_SIZE),
          borderRadius: scaleValue(ARROW_SIZE / 2), opacity: canContinue ? 1 : 0.4,
        }, pressed && canContinue && styles.pressed]}
      >
        <View style={[styles.arrowShaft, {
          left: scaleValue(15), top: scaleValue(27), width: scaleValue(28), height: 1,
        }]} />
        <View style={[styles.arrowHead, {
          left: scaleValue(27), top: scaleValue(20), width: scaleValue(20), height: 1,
          transform: [{ rotate: '45deg' }],
        }]} />
        <View style={[styles.arrowHead, {
          left: scaleValue(27), top: scaleValue(34), width: scaleValue(20), height: 1,
          transform: [{ rotate: '-45deg' }],
        }]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden', backgroundColor: '#79ADD0' },
  title: { position: 'absolute', color: TEXT_COLOR, fontWeight: '700', textAlign: 'left' },
  palette: { position: 'absolute', flexDirection: 'row' },
  swatchFrame: { alignItems: 'center', justifyContent: 'center' },
  arrowButton: { position: 'absolute', backgroundColor: PRIMARY },
  arrowShaft: { position: 'absolute', backgroundColor: '#FFFFFF' },
  arrowHead: { position: 'absolute', backgroundColor: '#FFFFFF' },
  pressed: { opacity: 0.82 },
});
