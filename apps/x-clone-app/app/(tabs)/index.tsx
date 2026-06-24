import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import type { Post, UserProfile } from "@repo/contracts";
import { PostCard } from "@/components/posts/post-card";
import ScreenWrapper from "@/components/ui/screen-wrapper";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useAuthPrivate } from "@/hooks/useAuthPrivate";
import { listPosts } from "@/lib/posts";
import { getCurrentUser, isDefaultUserProfile } from "@/lib/users";

export default function HomeScreen() {
  const router = useRouter();
  const { session, signOut } = useAuthSession();
  const { authFetch } = useAuthPrivate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHome = useCallback(
    async (signal?: AbortSignal) => {
      setErrorMessage(null);
      const [userResponse, postsResponse] = await Promise.all([
        getCurrentUser(authFetch, signal),
        listPosts(authFetch, { limit: 20 }, signal),
      ]);

      setUser(userResponse.user);
      setPosts(postsResponse.posts);

      if (isDefaultUserProfile(userResponse.user)) {
        router.replace("/profile/setup" as never);
      }
    },
    [authFetch, router],
  );

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    loadHome(controller.signal)
      .catch((error) => {
        if ((error as { name?: string }).name !== "AbortError") {
          setErrorMessage("Could not load your timeline.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [loadHome]);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();

      loadHome(controller.signal).catch(() => undefined);

      return () => controller.abort();
    }, [loadHome]),
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await loadHome();
    } catch {
      setErrorMessage("Could not refresh your timeline.");
    } finally {
      setIsRefreshing(false);
    }
  }, [loadHome]);

  return (
    <ScreenWrapper>
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          data={posts}
          keyExtractor={(post) => post.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              tintColor="#E7E9EA"
              onRefresh={refresh}
            />
          }
          ListHeaderComponent={
            <View>
              <HomeHeader onSignOut={() => void signOut()} />
              <InlineComposer
                displayName={user?.displayName}
                fallbackLabel={session?.phoneNumber}
                onPress={() => router.push("/compose" as never)}
              />
              {errorMessage ? (
                <Text
                  selectable
                  style={{
                    color: "#F4212E",
                    fontSize: 14,
                    lineHeight: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                >
                  {errorMessage}
                </Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={{ paddingVertical: 48 }}>
                <ActivityIndicator color="#E7E9EA" />
              </View>
            ) : (
              <View style={{ gap: 8, padding: 24 }}>
                <Text
                  selectable
                  style={{
                    color: "#E7E9EA",
                    fontSize: 27,
                    fontWeight: "800",
                    lineHeight: 32,
                  }}
                >
                  Welcome to X
                </Text>
                <Text
                  selectable
                  style={{
                    color: "#71767B",
                    fontSize: 15,
                    lineHeight: 21,
                  }}
                >
                  When posts arrive, they will show up here.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <PostCard currentUser={user} post={item} />
          )}
        />

        <Pressable
          onPress={() => router.push("/compose" as never)}
          style={{
            position: "absolute",
            right: 18,
            bottom: 18,
            width: 58,
            height: 58,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1D9BF0",
            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.35)",
          }}
        >
          <Ionicons name="add" size={31} color="#FFFFFF" />
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}

function HomeHeader({ onSignOut }: { onSignOut(): void }) {
  return (
    <View
      style={{
        minHeight: 54,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#2F3336",
        paddingHorizontal: 16,
      }}
    >
      <View style={{ width: 38 }} />
      <Text
        selectable
        style={{
          color: "#E7E9EA",
          fontSize: 23,
          fontWeight: "900",
        }}
      >
        X
      </Text>
      <Pressable
        hitSlop={10}
        onPress={onSignOut}
        style={{
          minHeight: 38,
          minWidth: 38,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="log-out-outline" size={22} color="#E7E9EA" />
      </Pressable>
    </View>
  );
}

function InlineComposer({
  displayName,
  fallbackLabel,
  onPress,
}: {
  displayName?: string;
  fallbackLabel?: string;
  onPress(): void;
}) {
  const label = displayName ?? fallbackLabel ?? "X";

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#2F3336",
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          backgroundColor: "#202327",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#E7E9EA", fontSize: 17, fontWeight: "800" }}>
          {label.slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 14 }}>
        <Text
          selectable
          style={{ color: "#71767B", fontSize: 20, lineHeight: 28 }}
        >
          What is happening?!
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", gap: 18 }}>
            <Ionicons name="image-outline" size={20} color="#1D9BF0" />
            <Ionicons name="albums-outline" size={20} color="#1D9BF0" />
            <Ionicons name="bar-chart-outline" size={20} color="#1D9BF0" />
          </View>
          <View
            style={{
              minHeight: 34,
              minWidth: 64,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              backgroundColor: "#1D9BF0",
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>
              Post
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
