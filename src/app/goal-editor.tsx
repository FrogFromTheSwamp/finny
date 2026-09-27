import { FinnyButton } from '@/components/FinnyButton';
import { GOAL_TEMPLATES } from '@/features/goals/catalog';
import { useGameStore } from '@/game/store/gameStore';
import { fontFamily } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GoalEditorScreen() {
  const router = useRouter();
  const addGoal = useGameStore((s) => s.addGoal);
  const [selectedId, setSelectedId] = useState(GOAL_TEMPLATES[0]!.id);
  const template = GOAL_TEMPLATES.find((x) => x.id === selectedId)!;
  const [targetText, setTargetText] = useState(String(template.target));
  const select = (id: typeof selectedId) => { const t = GOAL_TEMPLATES.find((x)=>x.id===id)!; setSelectedId(id); setTargetText(String(t.target)); };
  const save = () => { addGoal(template.id, template.name, Number(targetText) || template.target); router.back(); };
  return <SafeAreaView style={styles.root}>
    <View style={styles.header}><Pressable onPress={()=>router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.title}>Добавить цель</Text></View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>Что ты хочешь купить?</Text><Text style={styles.helper}>Выбери предмет. Сумму можно изменить под свою цель.</Text>
      <View style={styles.grid}>{GOAL_TEMPLATES.map((item)=><Pressable key={item.id} onPress={()=>select(item.id)} style={[styles.card, selectedId===item.id && styles.cardOn]}><Image source={item.image} style={styles.image} resizeMode="contain"/><Text style={styles.name}>{item.name}</Text><Text style={styles.price}>{item.target} 🟡</Text></Pressable>)}</View>
      <Text style={styles.inputLabel}>Нужно накопить</Text><TextInput keyboardType="number-pad" value={targetText} onChangeText={setTargetText} style={styles.input}/>
    </ScrollView>
    <View style={styles.bottom}><FinnyButton label="Добавить цель" onPress={save}/></View>
  </SafeAreaView>;
}
const styles=StyleSheet.create({ root:{flex:1,backgroundColor:'#F6F5F3'},header:{height:58,flexDirection:'row',alignItems:'center',paddingHorizontal:18},back:{fontSize:38,color:'#2A180E',width:34},title:{fontFamily:fontFamily.bold,fontSize:20,color:'#2A180E'},content:{padding:18,paddingBottom:110},lead:{fontFamily:fontFamily.bold,fontSize:25,color:'#27170E'},helper:{fontFamily:fontFamily.medium,color:'#74675F',lineHeight:19,marginTop:7,marginBottom:18},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},card:{width:'48%',minHeight:184,borderRadius:14,backgroundColor:'#fff',borderWidth:2,borderColor:'#E0DBD7',padding:10,alignItems:'center'},cardOn:{borderColor:'#39751F',backgroundColor:'#F2F8EE'},image:{width:120,height:112},name:{fontFamily:fontFamily.bold,fontSize:13,color:'#2A190F',textAlign:'center',minHeight:34},price:{fontFamily:fontFamily.semiBold,fontSize:12,color:'#705541',marginTop:5},inputLabel:{fontFamily:fontFamily.bold,color:'#2A190F',marginTop:22,marginBottom:8},input:{height:56,borderWidth:2,borderColor:'#C9C0BA',borderRadius:11,backgroundColor:'#fff',paddingHorizontal:16,fontFamily:fontFamily.bold,fontSize:21,color:'#2A180E'},bottom:{position:'absolute',left:18,right:18,bottom:22}});
