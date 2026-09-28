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
        <AppText variant="body" style={styles.text}>
          {lines[index]}
        </AppText>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", top: "35%", left: 24, right: 24 },
  bubble: {
    alignSelf: "flex-start",
    minWidth: 160,
    maxWidth: "80%",
    minHeight: 100,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  text: { color: "#2A1105" },
});
