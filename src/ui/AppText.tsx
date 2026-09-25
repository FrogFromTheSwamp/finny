import Animated from 'react-native-reanimated';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, fontFamily, fontSize } from '@/ui/theme';

type Variant = 'body' | 'heading' | 'title' | 'button' | 'label';

type Props = TextProps & {
  variant?: Variant;
};

const VARIANT_STYLES: Record<Variant, TextStyle> = {
  body: { fontFamily: fontFamily.regular, fontSize: fontSize.body, color: colors.text },
  heading: { fontFamily: fontFamily.semiBold, fontSize: fontSize.heading, color: colors.text },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.title, color: colors.text },
  button: { fontFamily: fontFamily.semiBold, fontSize: fontSize.body, color: colors.text },
  label: { fontFamily: fontFamily.medium, fontSize: fontSize.body, color: colors.text },
};

export function AppText({ variant = 'body', style, ...rest }: Props) {
  return <Text style={[VARIANT_STYLES[variant], style]} {...rest} />;
}

export const AnimatedAppText = Animated.createAnimatedComponent(AppText);