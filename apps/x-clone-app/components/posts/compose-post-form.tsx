import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { CreatePostRequest, UserProfile } from "@repo/contracts";

type ComposePostFormProps = {
  currentUser: UserProfile | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  onCancel(): void;
  onSubmit(input: CreatePostRequest): void;
};

const maxPostLength = 280;

export function ComposePostForm({
  currentUser,
  errorMessage,
  isSubmitting,
  onCancel,
  onSubmit,
}: ComposePostFormProps) {
  const inputRef = useRef<TextInput>(null);
  const [content, setContent] = useState("");
  const remainingCharacters = maxPostLength - content.trimEnd().length;
  const canPost = content.trim().length > 0 && remainingCharacters >= 0 && !isSubmitting;
  const avatarInitial = useMemo(
    () => (currentUser?.displayName ?? "X").slice(0, 1).toUpperCase(),
    [currentUser?.displayName],
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: "#000000" }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: 24,
      }}
      onLayout={() => inputRef.current?.focus()}
    >
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
        <Pressable
          hitSlop={10}
          onPress={onCancel}
          style={{
            minHeight: 36,
            minWidth: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="close" size={26} color="#E7E9EA" />
        </Pressable>

        <Pressable
          disabled={!canPost}
          onPress={() =>
            onSubmit({
              content: content.trim(),
            })
          }
          style={{
            minHeight: 34,
            minWidth: 70,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            backgroundColor: canPost ? "#1D9BF0" : "#0F4E78",
            paddingHorizontal: 16,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{
                color: canPost ? "#FFFFFF" : "#8ECDF8",
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              Post
            </Text>
          )}
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: 12, padding: 16 }}>
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
            {avatarInitial}
          </Text>
        </View>

        <View style={{ flex: 1, gap: 14 }}>
          <TextInput
            ref={inputRef}
            multiline
            maxLength={maxPostLength}
            onChangeText={setContent}
            placeholder="What is happening?!"
            placeholderTextColor="#71767B"
            style={{
              color: "#E7E9EA",
              fontSize: 21,
              lineHeight: 28,
              minHeight: 180,
              textAlignVertical: "top",
            }}
            value={content}
          />

          {errorMessage ? (
            <Text
              selectable
              style={{
                color: "#F4212E",
                fontSize: 14,
                lineHeight: 20,
              }}
            >
              {errorMessage}
            </Text>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderTopWidth: 1,
              borderTopColor: "#2F3336",
              paddingTop: 12,
            }}
          >
            <View style={{ flexDirection: "row", gap: 18 }}>
              <ComposerIcon name="image-outline" />
              <ComposerIcon name="albums-outline" />
              <ComposerIcon name="bar-chart-outline" />
              <ComposerIcon name="happy-outline" />
              <ComposerIcon name="calendar-outline" />
              <ComposerIcon name="location-outline" />
            </View>
            <Text
              selectable
              style={{
                color:
                  remainingCharacters < 20
                    ? remainingCharacters < 0
                      ? "#F4212E"
                      : "#FFD400"
                    : "#71767B",
                fontSize: 13,
                fontVariant: ["tabular-nums"],
              }}
            >
              {remainingCharacters}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function ComposerIcon({ name }: { name: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable
      hitSlop={10}
      style={{
        minHeight: 28,
        minWidth: 24,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={20} color="#1D9BF0" />
    </Pressable>
  );
}
