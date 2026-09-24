import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export const PET_STAGE_SIZE = 220;

type Props = {
  children: ReactNode;
};

export function PetStage({ children }: Props) {
  return (
    <View style={styles.box} pointerEvents="none">
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: PET_STAGE_SIZE,
    height: PET_STAGE_SIZE,
    marginLeft: -PET_STAGE_SIZE / 2,
    marginTop: -PET_STAGE_SIZE / 2,
  },
});