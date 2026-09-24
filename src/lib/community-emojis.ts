export const communityEmojis = [
  {
    id: "paid",
    label: "Got paid",
    token: ":w2e-paid:",
    src: "/emojis/paid.svg",
  },
  {
    id: "bargain",
    label: "Brilliant bargain",
    token: ":w2e-bargain:",
    src: "/emojis/bargain.svg",
  },
  {
    id: "thanks",
    label: "Big thanks",
    token: ":w2e-thanks:",
    src: "/emojis/thanks.svg",
  },
  {
    id: "idea",
    label: "Bright idea",
    token: ":w2e-idea:",
    src: "/emojis/idea.svg",
  },
  {
    id: "worked",
    label: "It worked",
    token: ":w2e-worked:",
    src: "/emojis/worked.svg",
  },
  {
    id: "question",
    label: "Quick question",
    token: ":w2e-question:",
    src: "/emojis/question.svg",
  },
  {
    id: "caution",
    label: "Worth checking",
    token: ":w2e-caution:",
    src: "/emojis/caution.svg",
  },
  {
    id: "expired",
    label: "Offer expired",
    token: ":w2e-expired:",
    src: "/emojis/expired.svg",
  },
  {
    id: "celebrate",
    label: "Little victory",
    token: ":w2e-celebrate:",
    src: "/emojis/celebrate.svg",
  },
  {
    id: "saving",
    label: "Saving up",
    token: ":w2e-saving:",
    src: "/emojis/saving.svg",
  },
  {
    id: "waiting",
    label: "Patiently waiting",
    token: ":w2e-waiting:",
    src: "/emojis/waiting.svg",
  },
  {
    id: "welcome",
    label: "Warm welcome",
    token: ":w2e-welcome:",
    src: "/emojis/welcome.svg",
  },
] as const;

const nativeImages = {
  paid: require("../../assets/images/paid.png"),
  bargain: require("../../assets/images/bargain.png"),
  thanks: require("../../assets/images/thanks.png"),
  idea: require("../../assets/images/idea.png"),
  worked: require("../../assets/images/worked.png"),
  question: require("../../assets/images/question.png"),
  caution: require("../../assets/images/caution.png"),
  expired: require("../../assets/images/expired.png"),
  celebrate: require("../../assets/images/celebrate.png"),
  saving: require("../../assets/images/saving.png"),
  waiting: require("../../assets/images/waiting.png"),
  welcome: require("../../assets/images/welcome.png"),
} as const;

export function communityEmojiImage(id: keyof typeof nativeImages) {
  return nativeImages[id];
}
