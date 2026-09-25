import { AppText } from "@/ui/AppText";
import {
  colors,
  fontFamily,
  fontSize,
  MIN_TOUCH_SIZE,
  spacing,
} from "@/ui/theme";
import { StyleSheet, TextInput, View } from "react-native";

type Props = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
}: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        maxLength={maxLength}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: { fontSize: fontSize.body, color: colors.text },
  input: {
    minHeight: MIN_TOUCH_SIZE,
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.body,
    fontFamily: fontFamily.regular,
    color: colors.text,
  },
});
