import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import type { CreatePostRequest, UserProfile } from "@repo/contracts";

type ComposePostFormProps = {
  currentUser: UserProfile | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  onCancel(): void;
  onSubmit(input: CreatePostRequest, media: DraftMedia[]): void;
};

const maxPostLength = 280;
const maxImageCount = 4;

export type DraftMedia = {
  id: string;
  uri: string;
  filename: string;
  mimeType: string;
  mediaType: "image" | "video";
  sizeBytes: number;
  file?: Blob;
};

export function ComposePostForm({
  currentUser,
  errorMessage,
  isSubmitting,
  onCancel,
  onSubmit,
}: ComposePostFormProps) {
  const inputRef = useRef<TextInput>(null);
  const [content, setContent] = useState("");
  const [draftMedia, setDraftMedia] = useState<DraftMedia[]>([]);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
  const remainingCharacters = maxPostLength - content.trimEnd().length;
  const canPost =
    (content.trim().length > 0 || draftMedia.length > 0) &&
    remainingCharacters >= 0 &&
    !isSubmitting;
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
            onSubmit(
              {
                content: content.trim(),
              },
              draftMedia,
            )
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

          {draftMedia.length > 0 ? (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {draftMedia.map((media) => (
                <View
                  key={media.id}
                  style={{
                    width: draftMedia.length === 1 ? "100%" : "48.5%",
                    aspectRatio: media.mediaType === "video" ? 16 / 10 : 1,
                    overflow: "hidden",
                    borderRadius: 8,
                    borderCurve: "continuous",
                    backgroundColor: "#16181C",
                  }}
                >
                  {media.mediaType === "image" ? (
                    <Image
                      source={{ uri: media.uri }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="play-circle" size={44} color="#E7E9EA" />
                    </View>
                  )}
                  <Pressable
                    hitSlop={8}
                    onPress={() =>
                      setDraftMedia((currentMedia) =>
                        currentMedia.filter((item) => item.id !== media.id),
                      )
                    }
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(0,0,0,0.65)",
                    }}
                  >
                    <Ionicons name="close" size={19} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {localErrorMessage ?? errorMessage ? (
            <Text
              selectable
              style={{
                color: "#F4212E",
                fontSize: 14,
                lineHeight: 20,
              }}
            >
              {localErrorMessage ?? errorMessage}
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
              <ComposerIcon name="image-outline" onPress={() => void pickImages()} />
              <ComposerIcon name="videocam-outline" onPress={() => void pickVideo()} />
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

  async function pickImages() {
    setLocalErrorMessage(null);

    if (draftMedia.some((media) => media.mediaType === "video")) {
      setLocalErrorMessage("Remove the video before adding images.");
      return;
    }

    if (draftMedia.length >= maxImageCount) {
      setLocalErrorMessage("You can add up to 4 images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: maxImageCount - draftMedia.length,
      quality: 0.9,
    });

    if (result.canceled) {
      return;
    }

    setDraftMedia((currentMedia) => [
      ...currentMedia,
      ...result.assets
        .filter((asset) => asset.type === "image")
        .slice(0, maxImageCount - currentMedia.length)
        .map(toDraftMedia),
    ]);
  }

  async function pickVideo() {
    setLocalErrorMessage(null);

    if (draftMedia.length > 0) {
      setLocalErrorMessage("Remove images before adding a video.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    setDraftMedia([toDraftMedia(result.assets[0])]);
  }
}

function ComposerIcon({
  name,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  return (
    <Pressable
      hitSlop={10}
      onPress={onPress}
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

function toDraftMedia(asset: ImagePicker.ImagePickerAsset): DraftMedia {
  const mediaType = asset.type === "video" ? "video" : "image";
  const fallbackExtension = mediaType === "video" ? "mp4" : "jpg";

  return {
    id: `${asset.uri}-${Date.now()}`,
    uri: asset.uri,
    filename: asset.fileName ?? `upload-${Date.now()}.${fallbackExtension}`,
    mimeType: asset.mimeType ?? (mediaType === "video" ? "video/mp4" : "image/jpeg"),
    mediaType,
    sizeBytes: asset.fileSize ?? 1,
    file: asset.file,
  };
}
