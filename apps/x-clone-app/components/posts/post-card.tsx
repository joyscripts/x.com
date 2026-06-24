import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { Post, UserProfile } from "@repo/contracts";

type PostCardProps = {
  post: Post;
  currentUser: UserProfile | null;
};

export function PostCard({ post, currentUser }: PostCardProps) {
  const isCurrentUserPost = currentUser?.id === post.authorId;
  const displayName = isCurrentUserPost
    ? currentUser.displayName
    : "X user";
  const handle = isCurrentUserPost
    ? currentUser.handle
    : post.authorId.slice(0, 8);

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: "#2F3336",
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: "#202327",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#E7E9EA",
              fontSize: 16,
              fontWeight: "800",
            }}
          >
            {displayName.slice(0, 1).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text
              selectable
              numberOfLines={1}
              style={{
                color: "#E7E9EA",
                flexShrink: 1,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              {displayName}
            </Text>
            <Text
              selectable
              numberOfLines={1}
              style={{ color: "#71767B", flexShrink: 1, fontSize: 15 }}
            >
              @{handle}
            </Text>
            <Text style={{ color: "#71767B", fontSize: 15 }}>·</Text>
            <Text
              selectable
              style={{ color: "#71767B", fontSize: 15 }}
            >
              {formatPostTime(post.createdAt)}
            </Text>
          </View>

          <Text
            selectable
            style={{
              color: "#E7E9EA",
              fontSize: 15,
              lineHeight: 21,
            }}
          >
            {post.content}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingTop: 10,
              paddingRight: 24,
            }}
          >
            <PostAction icon="chatbubble-outline" />
            <PostAction icon="repeat-outline" />
            <PostAction icon="heart-outline" />
            <PostAction icon="stats-chart-outline" />
            <PostAction icon="share-outline" />
          </View>
        </View>
      </View>
    </View>
  );
}

function PostAction({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable
      hitSlop={10}
      style={{
        minHeight: 28,
        minWidth: 28,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={18} color="#71767B" />
    </Pressable>
  );
}

function formatPostTime(value: string) {
  const createdAt = new Date(value);
  const diffSeconds = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 1000));

  if (diffSeconds < 60) {
    return `${diffSeconds}s`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  return createdAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
