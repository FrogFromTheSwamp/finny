import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDialogStore } from '@/game/services/dialogService';
import { fontFamily } from '@/ui/theme';

export function GameDialog() {
  const current = useDialogStore((s) => s.current);
  const hide = useDialogStore((s) => s.hide);
  return (
    <Modal visible={!!current} transparent animationType="fade" onRequestClose={hide}>
      <Pressable style={styles.backdrop} onPress={hide}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {current?.title ? <Text style={styles.title}>{current.title}</Text> : null}
          <Text style={styles.text}>{current?.text}</Text>
          <Pressable style={styles.button} onPress={hide}><Text style={styles.buttonText}>Понятно</Text></Pressable>
          <View style={styles.tail} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(40,14,0,0.22)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  card: { width: '100%', maxWidth: 350, borderRadius: 18, backgroundColor: '#fff', borderWidth: 3, borderColor: '#2A1105', padding: 18, shadowColor: '#2A1105', shadowOffset: { width: 4, height: 5 }, shadowOpacity: 0.35, shadowRadius: 0, elevation: 8 },
  title: { fontFamily: fontFamily.bold, fontSize: 18, color: '#2A1105', marginBottom: 7 },
  text: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 22, color: '#2A1105' },
  button: { marginTop: 16, minHeight: 46, borderRadius: 12, backgroundColor: '#3B1606', alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: fontFamily.bold, fontSize: 15, color: '#fff' },
  tail: { position: 'absolute', left: 45, bottom: -14, width: 24, height: 24, backgroundColor: '#fff', borderRightWidth: 3, borderBottomWidth: 3, borderColor: '#2A1105', transform: [{ rotate: '45deg' }] },
});
