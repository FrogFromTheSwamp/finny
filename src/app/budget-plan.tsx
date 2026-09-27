import { FinnyButton } from '@/components/FinnyButton';
import { BudgetDonut, PlanSliders } from '@/features/budget/BudgetControls';
import { useGameStore, type BudgetPlan } from '@/game/store/gameStore';
import { fontFamily } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BudgetPlanScreen(){
 const router=useRouter(); const stored=useGameStore((s)=>s.budgetPlan); const save=useGameStore((s)=>s.setBudgetPlan); const [plan,setPlan]=useState<BudgetPlan>(stored);
 return <SafeAreaView style={styles.root}><View style={styles.header}><Pressable onPress={()=>router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.title}>План расходов</Text></View><Text style={styles.lead}>Распредели будущий бюджет так, как тебе удобно.</Text><View style={styles.donut}><BudgetDonut plan={plan}/></View><View style={styles.legend}><Legend c="#F8AE28" t={`Нужно · ${plan.need}%`}/><Legend c="#D52C7D" t={`Хочу · ${plan.want}%`}/><Legend c="#4E82DB" t={`Отложу · ${plan.save}%`}/></View><PlanSliders plan={plan} onChange={setPlan}/><Text style={styles.note}>Ориентир 50 / 30 / 20 — не обязательное правило. Главное, чтобы сумма всегда составляла 100%.</Text><View style={styles.bottom}><FinnyButton label="Сохранить" onPress={()=>{save(plan);router.back();}}/></View></SafeAreaView>;
}
function Legend({c,t}:{c:string;t:string}){return <View style={styles.leg}><View style={[styles.dot,{backgroundColor:c}]}/><Text style={styles.legText}>{t}</Text></View>}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#F6F5F3',paddingHorizontal:22},header:{height:58,flexDirection:'row',alignItems:'center'},back:{fontSize:38,width:35,color:'#2A180E'},title:{fontFamily:fontFamily.bold,fontSize:20,color:'#2A180E'},lead:{fontFamily:fontFamily.medium,color:'#756860',lineHeight:20},donut:{alignItems:'center',marginVertical:18},legend:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:11,marginBottom:25},leg:{flexDirection:'row',alignItems:'center',gap:5},dot:{width:10,height:10,borderRadius:5},legText:{fontFamily:fontFamily.semiBold,fontSize:11,color:'#55473F'},note:{fontFamily:fontFamily.medium,fontSize:11,lineHeight:16,color:'#81756E',textAlign:'center',marginTop:22},bottom:{position:'absolute',left:22,right:22,bottom:22}});
