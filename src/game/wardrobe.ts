import type { ImageSourcePropType } from "react-native";

import hatCap from "@/assets/game/wardrobe/hat-cap.png";
import hatCrown from "@/assets/game/wardrobe/hat-crown.png";
import hatDotted from "@/assets/game/wardrobe/hat-dotted.png";
import hatNoneIcon from "@/assets/game/wardrobe/hat-none.png";
import hatPurple from "@/assets/game/wardrobe/hat-purple.png";

export type HatId = "none" | "dotted" | "purple" | "cap" | "crown";

export type HatAttachment = {
  align: "center" | "right";
  rotation: number;
};

export type HatItem = {
  id: HatId;
  name: string;
  price: number;
  previewImage: ImageSourcePropType;
  wornImage: ImageSourcePropType | null;
  attachment: HatAttachment | null;
};

export const HATS: HatItem[] = [
  {
    id: "none",
    name: "Без шляпки",
    price: 0,
    previewImage: hatNoneIcon,
    wornImage: null,
    attachment: null,
  },
  {
    id: "dotted",
    name: "Шляпка в точечку",
    price: 16,
    previewImage: hatDotted,
    wornImage: hatDotted,
    attachment: { align: "right", rotation: -18 },
  },
  {
    id: "purple",
    name: "Фиолетовая шляпка",
    price: 40,
    previewImage: hatPurple,
    wornImage: hatPurple,
    attachment: { align: "right", rotation: -18 },
  },
  {
    id: "cap",
    name: "Кепка",
    price: 32,
    previewImage: hatCap,
    wornImage: hatCap,
    attachment: { align: "center", rotation: 0 },
  },
  {
    id: "crown",
    name: "Корона",
    price: 45,
    previewImage: hatCrown,
    wornImage: hatCrown,
    attachment: { align: "center", rotation: 0 },
  },
];

export const HAT_BY_ID = Object.fromEntries(
  HATS.map((h) => [h.id, h]),
) as Record<HatId, HatItem>;
