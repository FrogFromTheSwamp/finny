import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

function CookieIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30">
      <Circle cx="15" cy="15" r="11" fill="#4A1E0A" />
      <Circle cx="19" cy="7" r="5" fill="#FFFFFF" />
      <Circle cx="10" cy="12" r="1.6" fill="#FFFFFF" />
      <Circle cx="14" cy="19" r="1.6" fill="#FFFFFF" />
      <Circle cx="21" cy="18" r="1.6" fill="#FFFFFF" />
    </Svg>
  );
}

export function HungerMeter({ value }: { value: number }) {
  const percent = Math.max(3, Math.min(100, value));
  return (
    <View style={styles.shell} accessibilityLabel={`Сытость ${Math.round(value)} процентов`}>
      <View style={styles.track}><View style={[styles.fill, { height: `${percent}%` }]} /></View>
      <View style={styles.cookie}><CookieIcon /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { width: 54, height: 171, borderRadius: 11, backgroundColor: '#fff', borderWidth: 1, borderColor: '#BFB5AA', paddingTop: 7, alignItems: 'center', shadowColor: '#534122', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.7, shadowRadius: 0, elevation: 4 },
  track: { width: 37, height: 126, borderRadius: 3, borderWidth: 3, borderColor: '#31581B', backgroundColor: '#E7E1D8', overflow: 'hidden', justifyContent: 'flex-end' },
  fill: { width: '100%', backgroundColor: '#2E6C0C' },
  cookie: { height: 34, alignItems: 'center', justifyContent: 'center' },
});
