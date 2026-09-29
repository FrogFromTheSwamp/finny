import leftArrow from '@/assets/library/ui/arrows/left.png';
import rightArrow from '@/assets/library/ui/arrows/right.png';
import categoryHatIcon from '@/assets/library/wardrobe/categories/hats.png';
import wardrobeRoom from '@/assets/library/scenes/wardrobe.png';
import type { PetColorId } from '@/content/petColors';
import { GOAL_TEMPLATE_BY_ID } from '@/features/goals/catalog';
import { GameHud } from '@/game/components/GameHud';
import { PetWithHat } from '@/game/components/PetWithHat';
import { TutorialHand } from '@/game/components/TutorialHand';
import { showGameDialog } from '@/game/services/dialogService';
import { useGameStore } from '@/game/store/gameStore';
import { HATS } from '@/game/wardrobe';
import { useProfileStore } from '@/store/profileStore';
import { fontFamily } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ImageBackground, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export default function WardrobeShopScreen() {
  const router = useRouter();
  const color = (useProfileStore((s) => s.petColorId) || 'brown') as PetColorId;
  const coins = useGameStore((s) => s.coins);
  const equippedHat = useGameStore((s) => s.equippedHat);
  const ownedHats = useGameStore((s) => s.ownedHats);
  const equipHat = useGameStore((s) => s.equipHat);
  const purchaseHat = useGameStore((s) => s.purchaseHat);
  const tutorialStage = useGameStore((s) => s.tutorialStage);
  const setTutorialStage = useGameStore((s) => s.setTutorialStage);
  const goals = useGameStore((s) => s.goals);
  const addGoal = useGameStore((s) => s.addGoal);
  const [shortageOpen, setShortageOpen] = useState(false);
  const [index, setIndex] = useState(() => {
    const found = HATS.findIndex((h) => h.id === equippedHat);
    return found === -1 ? 0 : found;
  });

  useEffect(() => {
    if (tutorialStage === 6) {
      const dotted = HATS.findIndex((h) => h.id === 'dotted');
      if (dotted >= 0) setIndex(dotted);
    }
  }, [tutorialStage]);

  const hat = HATS[index]!;
  const owned = hat.id === 'none' || ownedHats.includes(hat.id);
  const shortage = Math.max(0, hat.price - coins);

  const move = (delta: number) => {
    if (tutorialStage === 6) return;
    const next = (index + delta + HATS.length) % HATS.length;
    setIndex(next);
    const nextHat = HATS[next]!;
    if (nextHat.id === 'none' || ownedHats.includes(nextHat.id)) equipHat(nextHat.id);
  };

  const handleBuy = () => {
    if (hat.id === 'none') {
      equipHat('none');
      return;
    }
    if (owned) {
      equipHat(hat.id);
      return;
    }
    if (tutorialStage === 6 && hat.id === 'dotted') {
      setShortageOpen(true);
      return;
    }
    if (!purchaseHat(hat.id)) {
      showGameDialog(`${hat.name} стоит ${hat.price} монет, а у тебя ${coins}.`, { title: 'Не хватает монет' });
    }
  };

  const ensureHatGoal = () => {
    const template = GOAL_TEMPLATE_BY_ID['party-hat'];
    const existing = goals.find((g) => g.templateId === 'party-hat' && !g.purchasedAt);
    return existing ?? addGoal(template.id, template.name, template.target);
  };

  const saveForHat = () => {
    ensureHatGoal();
    setShortageOpen(false);
    setTutorialStage(7);
    router.replace('/(tabs)/goals');
  };

  const earnCoins = () => {
    ensureHatGoal();
    setShortageOpen(false);
    setTutorialStage(8);
    router.replace('/(tabs)/learn');
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={wardrobeRoom} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <GameHud showHunger={false} />
      <View style={styles.petArea}><PetWithHat color={color} hatId={hat.id} /></View>
      <View style={styles.categoryIcon}><Image source={categoryHatIcon} style={styles.categoryIconImage} resizeMode="contain" /></View>
      <View style={styles.categoryBox}>
        <Pressable onPress={() => move(-1)} style={styles.arrow} accessibilityLabel="Предыдущая вещь">
          <Image source={leftArrow} style={styles.arrowImage} resizeMode="contain" />
        </Pressable>
        <Pressable onPress={handleBuy} style={styles.itemSlot} accessibilityRole="button" accessibilityLabel={hat.name}>
          {hat.previewImage ? <Image source={hat.previewImage} style={styles.itemImage} resizeMode="contain" /> : <Text style={styles.noneLabel}>Без шляпки</Text>}
          {!owned && hat.price > 0 ? (
            <View style={styles.price}><Text style={styles.priceText}>{hat.price}</Text><Text style={styles.priceCoin}>●</Text></View>
          ) : owned && hat.id !== 'none' ? <Text style={styles.ownedLabel}>Есть</Text> : null}
          {tutorialStage === 6 && hat.id === 'dotted' ? <TutorialHand style={styles.hatHand} rotate="-18deg" /> : null}
        </Pressable>
        <Pressable onPress={() => move(1)} style={styles.arrow} accessibilityLabel="Следующая вещь">
          <Image source={rightArrow} style={styles.arrowImage} resizeMode="contain" />
        </Pressable>
      </View>

      <Modal visible={shortageOpen} transparent animationType="fade" onRequestClose={() => setShortageOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Image source={GOAL_TEMPLATE_BY_ID['party-hat'].image} style={styles.modalHat} resizeMode="contain" />
            <Text style={styles.modalTitle}>Не хватает {shortage} монет</Text>
            <Text style={styles.modalText}>Колпак стоит 16 монет. Сейчас у тебя {coins}. Можно начать копить на него как на первую цель или заработать монеты на уроках.</Text>
            <Pressable style={styles.actionCard} onPress={earnCoins}>
              <Text style={styles.actionTitle}>Заработать монеты</Text>
              <Text style={styles.actionSub}>перейти к заданиям</Text>
            </Pressable>
            <Pressable style={[styles.actionCard, styles.actionPrimary]} onPress={saveForHat}>
              <Text style={[styles.actionTitle, styles.actionPrimaryTitle]}>Копить на колпак</Text>
              <Text style={[styles.actionSub, styles.actionPrimarySub]}>создать первую цель на 15 монет</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  petArea: { position: 'absolute', left: 0, right: 0, bottom: '22%', alignItems: 'center' },
  categoryIcon: { position: 'absolute', top: '38%', right: 24, width: 58, height: 58, alignItems: 'center', justifyContent: 'center' },
  categoryIconImage: { width: '100%', height: '100%' },
  categoryBox: { position: 'absolute', left: 14, right: 14, bottom: 110, height: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 52, height: 58, alignItems: 'center', justifyContent: 'center' },
  arrowImage: { width: 48, height: 50 },
  itemSlot: { width: 132, height: 100, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  itemImage: { width: 78, height: 78 },
  noneLabel: { fontFamily: fontFamily.bold, fontSize: 13, color: '#4A382B', textAlign: 'center' },
  price: { marginTop: 2, minWidth: 52, height: 25, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#BBAE9E', flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center' },
  priceText: { fontFamily: fontFamily.semiBold, color: '#2A1105', fontSize: 12 },
  priceCoin: { color: '#F2A900', fontSize: 15 },
  ownedLabel: { marginTop: 2, fontFamily: fontFamily.semiBold, color: '#47762E', fontSize: 11 },
  hatHand: { top: -40, right: 50 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(35,18,8,.42)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { width: '100%', maxWidth: 370, borderRadius: 22, backgroundColor: '#F7F4F1', padding: 20 },
  modalHat: { width: 92, height: 84, alignSelf: 'center', marginBottom: 3 },
  modalTitle: { fontFamily: fontFamily.bold, fontSize: 24, color: '#2A160A', textAlign: 'center' },
  modalText: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 19, color: '#6E6158', textAlign: 'center', marginVertical: 16 },
  actionCard: { minHeight: 72, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DED7D1', paddingHorizontal: 15, justifyContent: 'center', marginTop: 9 },
  actionPrimary: { backgroundColor: '#3B1606', borderColor: '#3B1606' },
  actionTitle: { fontFamily: fontFamily.bold, fontSize: 15, color: '#2A160A' },
  actionSub: { fontFamily: fontFamily.medium, fontSize: 11, color: '#80736A', marginTop: 4 },
  actionPrimaryTitle: { color: '#fff' },
  actionPrimarySub: { color: '#EADFD8' },
});
