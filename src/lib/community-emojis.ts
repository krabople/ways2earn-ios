const legacyCommunityEmojis = [
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

export const selectableCommunityEmojis = [
  { id: "happy", label: "Happy", token: ":w2e-happy:", src: "/emojis/happy.svg" },
  { id: "laughing", label: "Laughing", token: ":w2e-laughing:", src: "/emojis/laughing.svg" },
  { id: "thankyou", label: "Thank you", token: ":w2e-thankyou:", src: "/emojis/thankyou.svg" },
  { id: "angry", label: "Angry", token: ":w2e-angry:", src: "/emojis/angry.svg" },
  { id: "love", label: "Love it", token: ":w2e-love:", src: "/emojis/love.svg" },
  { id: "surprised", label: "Surprised", token: ":w2e-surprised:", src: "/emojis/surprised.svg" },
  { id: "thinking", label: "Thinking", token: ":w2e-thinking:", src: "/emojis/thinking.svg" },
  { id: "sad", label: "Sad", token: ":w2e-sad:", src: "/emojis/sad.svg" },
  { id: "hot", label: "Hot deal", token: ":w2e-hot:", src: "/emojis/hot.svg" },
  { id: "greatfind", label: "Great find", token: ":w2e-greatfind:", src: "/emojis/greatfind.svg" },
  { id: "workedforme", label: "Worked for me", token: ":w2e-workedforme:", src: "/emojis/workedforme.svg" },
  { id: "watchout", label: "Watch out", token: ":w2e-watchout:", src: "/emojis/watchout.svg" },
] as const;

export const communityEmojis = [...selectableCommunityEmojis, ...legacyCommunityEmojis] as const;

const nativeImages = {
  happy: require("../../assets/images/happy.png"),
  laughing: require("../../assets/images/laughing.png"),
  thankyou: require("../../assets/images/thankyou.png"),
  angry: require("../../assets/images/angry.png"),
  love: require("../../assets/images/love.png"),
  surprised: require("../../assets/images/surprised.png"),
  thinking: require("../../assets/images/thinking.png"),
  sad: require("../../assets/images/sad.png"),
  hot: require("../../assets/images/hot.png"),
  greatfind: require("../../assets/images/greatfind.png"),
  workedforme: require("../../assets/images/workedforme.png"),
  watchout: require("../../assets/images/watchout.png"),
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
