import { Image, Linking, Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type {
  MediaVariantType,
  Post,
  PostMedia,
  UserProfile,
} from "@repo/contracts";
import { resolveMediaUrl } from "@/lib/media";

type PostCardProps = {
  post: Post;
  currentUser: UserProfile | null;
};

export function PostCard({ post, currentUser }: PostCardProps) {
  const isCurrentUserPost = currentUser?.id === post.authorId;
  const displayName = isCurrentUserPost ? currentUser.displayName : "X user";
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
            <Text selectable style={{ color: "#71767B", fontSize: 15 }}>
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

          {post.media.length > 0 ? (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 2,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#2F3336",
                borderRadius: 8,
                borderCurve: "continuous",
              }}
            >
              {post.media.map((media) => {
                const thumbnailUrl = pickMediaVariantUrl(
                  media,
                  "image_thumbnail",
                );
                const posterUrl = pickMediaVariantUrl(media, "video_poster");
                const playbackUrl = pickMediaVariantUrl(media, "video_mp4");

                return media.mediaType === "image" ? (
                  <Image
                    key={media.id}
                    source={{ uri: resolveMediaUrl(thumbnailUrl ?? media.url) }}
                    style={{
                      aspectRatio: post.media.length === 1 ? 16 / 10 : 1,
                      width: post.media.length === 1 ? "100%" : "49.7%",
                      backgroundColor: "#16181C",
                    }}
                  />
                ) : (
                  <Pressable
                    key={media.id}
                    onPress={() => {
                      const url = resolveMediaUrl(playbackUrl ?? media.url);
                      void Linking.openURL(url);
                    }}
                    style={{
                      aspectRatio: 16 / 10,
                      width: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#16181C",
                    }}
                  >
                    {posterUrl ? (
                      <Image
                        source={{ uri: resolveMediaUrl(posterUrl) }}
                        style={{
                          height: "100%",
                          position: "absolute",
                          width: "100%",
                        }}
                      />
                    ) : null}
                    <Ionicons name="play-circle" size={42} color="#E7E9EA" />
                  </Pressable>
                );
              })}
            </View>
          ) : null}

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

function pickMediaVariantUrl(media: PostMedia, variantType: MediaVariantType) {
  return media.variants?.find((variant) => variant.variantType === variantType)
    ?.url;
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
  const diffSeconds = Math.max(
    1,
    Math.floor((Date.now() - createdAt.getTime()) / 1000),
  );

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
