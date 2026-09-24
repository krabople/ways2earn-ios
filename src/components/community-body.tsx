import { Image, Text, type StyleProp, type TextStyle } from "react-native";

import { communityEmojiImage, communityEmojis } from "@/lib/community-emojis";

const byToken = new Map<string, (typeof communityEmojis)[number]>(
  communityEmojis.map((emoji) => [emoji.token, emoji]),
);
const tokenPattern = new RegExp(
  `(${communityEmojis.map((emoji) => emoji.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
  "g",
);

export function plainCommunityText(body: string) {
  return body
    .replace(/!\[[^\]]*\]\(([^)]+)\)/g, "🖼 Image")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[*_\\]/g, "")
    .trim();
}

export function CommunityBody({
  body,
  style,
}: {
  body: string;
  style?: StyleProp<TextStyle>;
}) {
  const parts = plainCommunityText(body).split(tokenPattern);
  return (
    <Text style={style}>
      {parts.map((part, index) => {
        const emoji = byToken.get(part);
        return emoji ? (
          <Image
            key={`${emoji.id}-${index}`}
            accessibilityLabel={emoji.label}
            source={communityEmojiImage(emoji.id)}
            resizeMode="contain"
            style={{ width: 28, height: 28 }}
          />
        ) : (
          part
        );
      })}
    </Text>
  );
}
