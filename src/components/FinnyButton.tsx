import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { fontFamily } from '@/ui/theme';

export function FinnyButton({ label, onPress, disabled = false, style }: { label: string; onPress: () => void; disabled?: boolean; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && !disabled && styles.pressed, style]}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: { minHeight: 50, borderRadius: 10, backgroundColor: '#431800', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  disabled: { backgroundColor: '#9E9188' }, pressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  text: { color: '#fff', fontFamily: fontFamily.bold, fontSize: 14 },
});
