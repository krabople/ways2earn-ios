import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { assetUrl } from "@/lib/api";
import { communityEmojiImage, communityEmojis } from "@/lib/community-emojis";
import { colours, spacing } from "@/lib/theme";

const emojiByToken = new Map<string, (typeof communityEmojis)[number]>(communityEmojis.map(emoji => [emoji.token, emoji]));
const emojiPattern = communityEmojis.map(emoji => emoji.token).join("|");
const inlinePattern = new RegExp(`(\\*\\*[^*\\n]+\\*\\*|_[^_\\n]+_|\\[[^\\]]+\\]\\(https?:\\/\\/[^)]+\\)|${emojiPattern})`, "g");

function Inline({ value }: { value: string }) {
  return <Text style={styles.body}>{value.split(inlinePattern).map((part, index) => {
    const emoji = emojiByToken.get(part);
    if (emoji) return <Image key={index} source={communityEmojiImage(emoji.id)} accessibilityLabel={emoji.label} resizeMode="contain" style={styles.emoji} />;
    if (part.startsWith("**") && part.endsWith("**")) return <Text key={index} style={styles.bold}>{part.slice(2, -2)}</Text>;
    if (part.startsWith("_") && part.endsWith("_")) return <Text key={index} style={styles.italic}>{part.slice(1, -1)}</Text>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <Text key={index} style={styles.link} onPress={() => void Linking.openURL(link[2])}>{link[1]}</Text>;
    return part;
  })}</Text>;
}

export function RichMessageBody({ body }: { body: string }) {
  return <View style={styles.wrap}>{body.split(/(!\[[^\]]*\]\((?:https?:\/\/|\/api\/)[^)]+\))/g).map((part, index) => {
    const image = part.match(/^!\[([^\]]*)\]\(((?:https?:\/\/|\/api\/)[^)]+)\)$/);
    if (image) return <Pressable key={index} onPress={() => void Linking.openURL(assetUrl(image[2]) || image[2])}><Image source={{ uri: assetUrl(image[2]) }} accessibilityLabel={image[1] || "Attached image"} resizeMode="contain" style={styles.image} /></Pressable>;
    return <Inline key={index} value={part} />;
  })}</View>;
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm }, body: { color: colours.ink, fontSize: 14, lineHeight: 21 },
  bold: { fontWeight: "800" }, italic: { fontStyle: "italic" }, link: { color: colours.green, textDecorationLine: "underline" },
  emoji: { width: 25, height: 25 }, image: { width: 220, height: 160, maxWidth: "100%" },
});
