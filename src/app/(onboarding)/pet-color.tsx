import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
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
import {
  PET_COLOR_OPTIONS,
  type PetColorId,
} from '@/content/petColors';
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

  const petColorId = useProfileStore(
    (state) => state.petColorId,
  );

  const setPetColor = useProfileStore(
    (state) => state.setPetColor,
  );

  /*
   * До первого выбора на экране остаётся
   * коричневое яйцо — как на исходном макете.
   *
   * При этом выбранным цвет ещё не считается,
   * поэтому стрелка остаётся недоступной.
   */
  const previewColor: PetColorId =
    petColorId || 'brown';

  const previewEgg =
    PET_ASSETS[previewColor].eggStages[0];

  const canContinue = petColorId !== '';

  const s = (value: number) =>
    value * scale;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ImageBackground
        source={meadowBg}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />

      <Text
        style={[
          styles.title,
          {
            left: s(16),
            top: s(TITLE_TOP),
            width: s(380),

            fontSize: s(34),
            lineHeight: s(39),
          },
        ]}
      >
        Выбери цвет твоего{'\n'}
        будущего питомца
      </Text>

      <Image
        source={previewEgg}
        resizeMode="contain"
        style={{
          position: 'absolute',

          left: s(EGG_LEFT),
          top: s(EGG_TOP),

          width: s(EGG_WIDTH),
          height: s(EGG_HEIGHT),
        }}
      />

      <View
        style={[
          styles.palette,
          {
            left: s(PALETTE_LEFT),
            top: s(PALETTE_TOP),
            gap: s(SWATCH_GAP),
          },
        ]}
      >
        {PET_COLOR_OPTIONS.map(
          (option) => {
            const selected =
              petColorId === option.id;

            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={
                  option.label
                }
                accessibilityState={{
                  selected,
                }}
                onPress={() =>
                  setPetColor(option.id)
                }
                style={({ pressed }) => [
                  styles.swatchFrame,

                  {
                    width: s(
                      SWATCH_SIZE,
                    ),

                    height: s(
                      SWATCH_SIZE,
                    ),

                    padding: s(
                      (SWATCH_SIZE -
                        SWATCH_INNER_SIZE) /
                      2,
                    ),

                    backgroundColor:
                      selected
                        ? '#000000'
                        : SWATCH_FRAME,
                  },

                  pressed &&
                  styles.pressed,
                ]}
              >
                <View
                  style={{
                    width: s(
                      SWATCH_INNER_SIZE,
                    ),

                    height: s(
                      SWATCH_INNER_SIZE,
                    ),

                    backgroundColor:
                      option.hex,
                  }}
                />
              </Pressable>
            );
          },
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="К следующему шагу"
        accessibilityState={{
          disabled: !canContinue,
        }}
        disabled={!canContinue}
        onPress={() =>
          router.push('/pet-hatch')
        }
        style={({ pressed }) => [
          styles.arrowButton,

          {
            left: s(ARROW_LEFT),
            top: s(ARROW_TOP),

            width: s(ARROW_SIZE),
            height: s(ARROW_SIZE),

            borderRadius: s(
              ARROW_SIZE / 2,
            ),

            opacity: canContinue
              ? 1
              : 0.4,
          },

          pressed &&
          canContinue &&
          styles.pressed,
        ]}
      >
        <View
          style={[
            styles.arrowShaft,
            {
              left: s(15),
              top: s(27),

              width: s(28),
              height: Math.max(
                1,
                s(1),
              ),
            },
          ]}
        />

        <View
          style={[
            styles.arrowHead,
            {
              left: s(27),
              top: s(20),

              width: s(20),
              height: Math.max(
                1,
                s(1),
              ),

              transform: [
                {
                  rotate: '45deg',
                },
              ],
            },
          ]}
        />

        <View
          style={[
            styles.arrowHead,
            {
              left: s(27),
              top: s(34),

              width: s(20),
              height: Math.max(
                1,
                s(1),
              ),

              transform: [
                {
                  rotate: '-45deg',
                },
              ],
            },
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      overflow: 'hidden',

      backgroundColor: '#79ADD0',
    },

    title: {
      position: 'absolute',

      color: TEXT_COLOR,

      fontWeight: '700',

      textAlign: 'left',
    },

    palette: {
      position: 'absolute',

      flexDirection: 'row',
    },

    swatchFrame: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    arrowButton: {
      position: 'absolute',

      backgroundColor: PRIMARY,
    },

    arrowShaft: {
      position: 'absolute',

      backgroundColor: '#FFFFFF',
    },

    arrowHead: {
      position: 'absolute',

      backgroundColor: '#FFFFFF',
    },

    pressed: {
      opacity: 0.82,
    },
  });