import { useMemo, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { BudgetPlan } from '@/game/store/gameStore';
import { fontFamily } from '@/ui/theme';

export function normalizePlan(plan: BudgetPlan): BudgetPlan {
  const need = Math.max(0, Math.min(100, Math.round(plan.need)));
  const want = Math.max(0, Math.min(100 - need, Math.round(plan.want)));
  return { need, want, save: 100 - need - want };
}

export function rebalancePlan(plan: BudgetPlan, key: keyof BudgetPlan, nextValue: number): BudgetPlan {
  const value = Math.max(0, Math.min(100, Math.round(nextValue)));
  const others = (['need','want','save'] as (keyof BudgetPlan)[]).filter((k) => k !== key);
  const otherTotal = plan[others[0]!] + plan[others[1]!];
  const remaining = 100 - value;
  const first = otherTotal > 0 ? Math.round(remaining * (plan[others[0]!] / otherTotal)) : Math.round(remaining / 2);
  const second = remaining - first;
  return { ...plan, [key]: value, [others[0]!]: first, [others[1]!]: second } as BudgetPlan;
}

export function BudgetDonut({ plan, size = 190, centerMain = '100%', centerSub = 'бюджета' }: { plan: BudgetPlan; size?: number; centerMain?: string; centerSub?: string }) {
  const stroke = Math.max(22, Math.round(size * .18));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const values = [plan.need, plan.want, plan.save];
  const colors = ['#F8AE28','#D52C7D','#4E82DB'];
  let offset = 0;
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
      <Circle cx={size/2} cy={size/2} r={r} stroke="#E8E5E2" strokeWidth={stroke} fill="none" />
      {values.map((v,i) => {
        const length = c * v / 100;
        const dashOffset = -c * offset / 100;
        offset += v;
        return <Circle key={i} cx={size/2} cy={size/2} r={r} stroke={colors[i]} strokeWidth={stroke} fill="none" strokeDasharray={`${length} ${c-length}`} strokeDashoffset={dashOffset} rotation={-90} origin={`${size/2}, ${size/2}`} strokeLinecap="butt" />;
      })}
    </Svg>
    <Text style={styles.donutMain}>{centerMain}</Text><Text style={styles.donutSub}>{centerSub}</Text>
  </View>;
}

export function PlanSliders({ plan, onChange }: { plan: BudgetPlan; onChange: (plan: BudgetPlan) => void }) {
  return <View style={styles.sliders}>
    <PercentSlider label="Нужно" color="#F8AE28" value={plan.need} recommended={50} onChange={(v) => onChange(rebalancePlan(plan,'need',v))}/>
    <PercentSlider label="Хочу" color="#D52C7D" value={plan.want} recommended={30} onChange={(v) => onChange(rebalancePlan(plan,'want',v))}/>
    <PercentSlider label="Отложу" color="#4E82DB" value={plan.save} recommended={20} onChange={(v) => onChange(rebalancePlan(plan,'save',v))}/>
  </View>;
}

function PercentSlider({ label, color, value, recommended, onChange }: { label: string; color: string; value: number; recommended: number; onChange: (v: number) => void }) {
  const [width, setWidth] = useState(1);
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => onChange(Math.round((e.nativeEvent.locationX / width) * 100)),
    onPanResponderMove: (e) => onChange(Math.round((e.nativeEvent.locationX / width) * 100)),
  }), [width, onChange]);
  return <View style={styles.sliderBlock}>
    <View style={styles.sliderHeader}><Text style={styles.sliderLabel}>{label}</Text><Text style={styles.sliderValue}>{value}%</Text></View>
    <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} {...pan.panHandlers}>
      <View style={[styles.fill,{ width: `${value}%`, backgroundColor: color }]} />
      <View style={[styles.recommended,{ left: `${recommended}%` }]}><View style={styles.recLine}/><Text style={styles.recText}>{recommended}%</Text></View>
      <View style={[styles.knob,{ left: `${value}%`, borderColor: color }]} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  donutMain: { fontFamily: fontFamily.bold, fontSize: 25, color: '#25170F' }, donutSub: { fontFamily: fontFamily.medium, fontSize: 11, color: '#756961' },
  sliders: { width: '100%', gap: 19 }, sliderBlock: { width: '100%' }, sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, sliderLabel: { fontFamily: fontFamily.bold, color: '#2B1B13', fontSize: 14 }, sliderValue: { fontFamily: fontFamily.bold, color: '#2B1B13' }, track: { height: 16, borderRadius: 8, backgroundColor: '#E2DEDB', position: 'relative', overflow: 'visible' }, fill: { height: 16, borderRadius: 8 }, knob: { position: 'absolute', top: -5, marginLeft: -13, width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', borderWidth: 5 }, recommended: { position: 'absolute', top: -10, alignItems: 'center' }, recLine: { width: 2, height: 35, backgroundColor: '#6D625C', opacity: .6 }, recText: { marginTop: 2, fontFamily: fontFamily.medium, fontSize: 9, color: '#756A64' },
});
