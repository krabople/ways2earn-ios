import * as ImagePicker from "expo-image-picker";
import { Image as ExpoImage } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { request, uploadImage } from "@/lib/api";
import { communityEmojiData } from "@/lib/community-emoji-data";
import { communityEmojiImage, communityEmojis } from "@/lib/community-emojis";
import { colours, radius, spacing } from "@/lib/theme";

type MemberHit = { handle: string; name: string };

export function RichComposer({
  value,
  onChange,
  placeholder = "Write something useful…",
  minHeight = 130,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const web = useRef<WebView>(null);
  const lastEmitted = useRef(value);
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<MemberHit[]>([]);
  const [uploading, setUploading] = useState(false);
  const [initial] = useState(value);
  const [contentHeight, setContentHeight] = useState(minHeight);
  const source = useMemo(
    () => ({ html: editorHtml(initial, placeholder) }),
    [initial, placeholder],
  );

  useEffect(() => {
    if (!query) {
      setMembers([]);
      return;
    }
    const timer = setTimeout(
      () =>
        void request<{ members: MemberHit[] }>(
          `?view=memberSearch&q=${encodeURIComponent(query)}`,
        )
          .then((result) => setMembers(result.members))
          .catch(() => setMembers([])),
      180,
    );
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    web.current?.injectJavaScript(
      `window.w2eSet(${JSON.stringify(value)}); true;`,
    );
  }, [value]);

  function command(name: string, argument: unknown = "") {
    web.current?.injectJavaScript(
      `window.w2eCommand(${JSON.stringify(name)}, ${JSON.stringify(argument)}); true;`,
    );
  }

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.82,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      command("image", await uploadImage(result.assets[0].uri));
    } catch (problem) {
      Alert.alert(
        "Image upload failed",
        problem instanceof Error ? problem.message : "Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  function receive(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        height?: number;
        markdown?: string;
        mention?: string;
      };
      if (typeof message.height === "number" && Number.isFinite(message.height)) {
        setContentHeight(Math.max(minHeight, Math.ceil(message.height)));
      }
      if (typeof message.markdown !== "string") return;
      lastEmitted.current = message.markdown;
      onChange(message.markdown);
      setQuery(message.mention ?? "");
    } catch {
      /* Ignore unrelated web messages. */
    }
  }

  return (
    <View style={styles.wrap}>
      {members.length ? (
        <View style={styles.suggestions}>
          {members.map((member) => (
            <Pressable
              key={member.handle}
              onPress={() => {
                command("mention", member.handle);
                setMembers([]);
                setQuery("");
              }}
              style={styles.suggestion}
            >
              <Text style={styles.handle}>@{member.handle}</Text>
              <Text style={styles.memberName}>{member.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={styles.toolbar}>
        <Tool label="B" onPress={() => command("bold")} bold />
        <Tool label="I" onPress={() => command("italic")} italic />
        <Tool label="Link" onPress={() => command("link")} />
        <Tool
          label="Image"
          onPress={() => void chooseImage()}
          disabled={uploading}
        />
      </View>
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.emojiTray}
      >
        {communityEmojis.map((emoji) => (
          <Pressable
            key={emoji.id}
            accessibilityLabel={emoji.label}
            onPress={() =>
              command("customEmoji", {
                token: emoji.token,
                src: communityEmojiData[emoji.id],
                label: emoji.label,
              })
            }
            style={styles.emojiButton}
          >
            <ExpoImage
              source={communityEmojiImage(emoji.id)}
              contentFit="contain"
              style={styles.emojiImage}
            />
          </Pressable>
        ))}
      </ScrollView>
      <WebView
        ref={web}
        originWhitelist={["*"]}
        scrollEnabled={false}
        keyboardDisplayRequiresUserAction={false}
        onMessage={receive}
        style={[styles.web, { height: Math.max(minHeight, contentHeight) }]}
        source={source}
      />
      <Text style={styles.hint}>
        Format text, add a link or image, or type @ to mention a member.
      </Text>
    </View>
  );
}

function Tool({
  label,
  onPress,
  disabled,
  bold,
  italic,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.tool, disabled && styles.disabled]}
    >
      <Text
        style={[styles.toolText, bold && styles.bold, italic && styles.italic]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function editorHtml(markdown: string, placeholder: string) {
  let escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  const emojiData = communityEmojis.map((emoji) => ({
    ...emoji,
    src: communityEmojiData[emoji.id],
  }));
  emojiData.forEach((emoji) => {
    escaped = escaped
      .split(emoji.token)
      .join(
        `<img class="w2e-emoji" data-token="${emoji.token}" src="${emoji.src}" alt="${emoji.label}">`,
      );
  });
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><style>*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#102a46;font:16px -apple-system,BlinkMacSystemFont,sans-serif}#editor{min-height:118px;padding:13px;outline:0;line-height:1.5}#editor:empty:before{content:attr(data-placeholder);color:#728397}img{max-width:100%;height:auto;border-radius:8px}.w2e-emoji{display:inline-block;width:34px;height:34px;object-fit:contain;vertical-align:middle;margin:0 2px;border-radius:0}a{color:#00845f}</style></head><body><div id="editor" contenteditable="true" data-placeholder="${placeholder.replace(/"/g, "&quot;")}">${escaped}</div><script>
  const editor=document.getElementById('editor');
  let heightFrame=0,lastHeight=0;
  function measure(){cancelAnimationFrame(heightFrame);heightFrame=requestAnimationFrame(()=>{const height=Math.ceil(editor.getBoundingClientRect().height)+2;if(height!==lastHeight){lastHeight=height;window.ReactNativeWebView.postMessage(JSON.stringify({height}))}})}
  new ResizeObserver(measure).observe(editor);
  editor.addEventListener('load',measure,true);
  window.addEventListener('resize',measure);
  measure();
  const emojis=${JSON.stringify(emojiData)};
  function render(value){let html=(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\n/g,'<br>');emojis.forEach(e=>{html=html.split(e.token).join('<img class="w2e-emoji" data-token="'+e.token+'" src="'+e.src+'" alt="'+e.label+'">')});return html}
  function md(node){if(node.nodeType===3)return node.nodeValue||'';if(node.nodeType!==1)return '';const tag=node.tagName.toLowerCase(),inner=[...node.childNodes].map(md).join('');if(tag==='strong'||tag==='b')return '**'+inner+'**';if(tag==='em'||tag==='i')return '_'+inner+'_';if(tag==='a')return '['+inner+']('+node.getAttribute('href')+')';if(tag==='img'&&node.dataset.token)return node.dataset.token;if(tag==='img')return '!['+(node.getAttribute('alt')||'Image')+']('+node.getAttribute('src')+')';if(tag==='br')return '\\n';if(['div','p'].includes(tag))return inner+'\\n';return inner}
  function emit(){const text=editor.innerText||'';const match=text.match(/(?:^|\\s)@([a-z0-9-]{1,30})$/i);window.ReactNativeWebView.postMessage(JSON.stringify({markdown:[...editor.childNodes].map(md).join('').replace(/\\n{3,}/g,'\\n\\n').trim(),mention:match?match[1]:''}))}
  editor.addEventListener('input',emit);editor.addEventListener('keyup',emit);editor.addEventListener('blur',emit);
  window.w2eSet=(value)=>{editor.innerHTML=render(value);measure()};
  window.w2eCommand=(name,arg)=>{editor.focus();if(name==='link'){const url=prompt('Paste an https:// link');if(url&&/^https?:\\/\\//i.test(url))document.execCommand('createLink',false,url)}else if(name==='image'){document.execCommand('insertHTML',false,'<img src="'+arg.replace(/"/g,'&quot;')+'" alt="Uploaded image"><br>')}else if(name==='customEmoji'){document.execCommand('insertHTML',false,'<img class="w2e-emoji" data-token="'+arg.token+'" src="'+arg.src+'" alt="'+arg.label+'">&nbsp;')}else if(name==='text'){document.execCommand('insertText',false,arg)}else if(name==='mention'){const sel=window.getSelection();if(sel&&sel.rangeCount){const range=sel.getRangeAt(0);const before=range.startContainer.nodeType===3?range.startContainer.nodeValue.slice(0,range.startOffset):'';const m=before.match(/@([a-z0-9-]*)$/i);if(m){range.setStart(range.startContainer,range.startOffset-m[0].length);range.deleteContents()}}document.execCommand('insertText',false,'@'+arg+' ')}else document.execCommand(name,false,null);emit()};
  </script></body></html>`;
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#C4D0D7",
    backgroundColor: colours.surface,
    overflow: "hidden",
  },
  toolbar: {
    minHeight: 44,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
    padding: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colours.line,
    backgroundColor: "#F7FAF9",
  },
  emojiTray: {
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colours.line,
    backgroundColor: "#F7FAF9",
  },
  emojiButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surface,
  },
  emojiImage: { width: 31, height: 31 },
  tool: {
    minWidth: 34,
    height: 32,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.line,
  },
  toolText: { color: colours.ink, fontSize: 13 },
  bold: { fontWeight: "900" },
  italic: { fontStyle: "italic" },
  disabled: { opacity: 0.45 },
  web: { width: "100%", backgroundColor: colours.surface },
  suggestions: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colours.line,
    backgroundColor: colours.mintPale,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  handle: { color: colours.green, fontWeight: "800" },
  memberName: { color: colours.slate, fontSize: 12 },
  hint: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    color: colours.slate,
    fontSize: 10,
    lineHeight: 14,
  },
});
