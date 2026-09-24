import { useLocalSearchParams } from "expo-router";

import { CommentsThread } from "@/components/comments-thread";
import { Screen } from "@/components/screen";

export default function CommentsScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  return (
    <Screen title="Discussion" back>
      <CommentsThread
        kind={kind === "discussion" ? "discussion" : "opportunity"}
        id={id}
      />
    </Screen>
  );
}
