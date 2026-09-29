import PetSpeechBubbleBg from "@/assets/library/ui/speech-bubble.png";
import { AppText } from "@/ui/AppText";
import { useState } from "react";
import { ImageBackground, Pressable, StyleSheet } from "react-native";

type Props = {
  lines: string[];
  onFinish: () => void;
};

export function PetSpeechBubble({ lines, onFinish }: Props) {
  const [index, setIndex] = useState(0);

  const handlePress = () => {
    if (index + 1 < lines.length) {
      setIndex(index + 1);
    } else {
      onFinish();
    }
  };

  return (
    <Pressable style={styles.wrap} onPress={handlePress}>
      <ImageBackground
        source={PetSpeechBubbleBg}
        resizeMode="stretch"
        style={styles.bubble}
      >
        <AppText variant="label" style={styles.text}>
          {lines[index]}
        </AppText>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: "35%",
    left: 0,
    right: 10,
    alignItems: "flex-start",
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  bubble: {
    width: "90%",
    maxWidth: 368,
    aspectRatio: 1232 / 717,
    justifyContent: "center",
  },

  text: {
    color: "#2A1105",
    width: "76%",
    alignSelf: "center",
    textAlign: "center",
    lineHeight: 22,
    paddingBottom: 16,
  },
});
