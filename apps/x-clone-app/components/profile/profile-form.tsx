import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { UpdateUserProfileRequest, UserProfile } from "@repo/contracts";

type ProfileFormProps = {
  initialUser: UserProfile;
  isSubmitting: boolean;
  errorMessage: string | null;
  submitLabel: string;
  title: string;
  subtitle: string;
  onSubmit(input: UpdateUserProfileRequest): void;
};

export function ProfileForm({
  initialUser,
  isSubmitting,
  errorMessage,
  submitLabel,
  title,
  subtitle,
  onSubmit,
}: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(
    initialUser.displayName.startsWith("X user ") ? "" : initialUser.displayName,
  );
  const [handle, setHandle] = useState(
    initialUser.handle.startsWith("user_") ? "" : initialUser.handle,
  );
  const [bio, setBio] = useState(initialUser.bio ?? "");

  const normalizedHandle = useMemo(
    () =>
      handle
        .trim()
        .toLowerCase()
        .replace(/^@/, "")
        .replace(/[^a-z0-9_]/g, ""),
    [handle],
  );
  const canSubmit =
    displayName.trim().length > 0 &&
    normalizedHandle.length >= 3 &&
    normalizedHandle.length <= 15 &&
    !isSubmitting;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: "#000000" }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 22,
        paddingVertical: 18,
        gap: 28,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 48,
        }}
      >
        <Text
          selectable
          style={{
            color: "#E7E9EA",
            fontSize: 18,
            fontWeight: "800",
          }}
        >
          X
        </Text>
        <Pressable
          disabled={!canSubmit}
          onPress={() =>
            onSubmit({
              handle: normalizedHandle,
              displayName: displayName.trim(),
              bio: bio.trim() || null,
              avatarUrl: initialUser.avatarUrl,
            })
          }
          style={{
            minHeight: 36,
            minWidth: 76,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            backgroundColor: canSubmit ? "#E7E9EA" : "#2F3336",
            paddingHorizontal: 16,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0F1419" />
          ) : (
            <Text
              style={{
                color: canSubmit ? "#0F1419" : "#71767B",
                fontSize: 14,
                fontWeight: "800",
              }}
            >
              {submitLabel}
            </Text>
          )}
        </Pressable>
      </View>

      <View style={{ gap: 10 }}>
        <Text
          selectable
          style={{
            color: "#E7E9EA",
            fontSize: 30,
            fontWeight: "800",
            lineHeight: 36,
          }}
        >
          {title}
        </Text>
        <Text
          selectable
          style={{
            color: "#71767B",
            fontSize: 15,
            lineHeight: 21,
          }}
        >
          {subtitle}
        </Text>
      </View>

      <View style={{ gap: 18 }}>
        <ProfileInput
          label="Name"
          maxLength={50}
          onChangeText={setDisplayName}
          placeholder="Your name"
          value={displayName}
        />
        <ProfileInput
          label="Handle"
          maxLength={15}
          onChangeText={setHandle}
          placeholder="username"
          prefix="@"
          value={handle}
        />
        <ProfileInput
          label="Bio"
          maxLength={160}
          multiline
          onChangeText={setBio}
          placeholder="What are you building?"
          value={bio}
        />
      </View>

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
          borderWidth: 1,
          borderColor: "#2F3336",
          borderRadius: 8,
          borderCurve: "continuous",
          overflow: "hidden",
        }}
      >
        <View style={{ height: 92, backgroundColor: "#333639" }} />
        <View style={{ padding: 16, paddingTop: 0, gap: 8 }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 999,
              backgroundColor: "#000000",
              borderWidth: 4,
              borderColor: "#000000",
              marginTop: -38,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "#E7E9EA",
                fontSize: 24,
                fontWeight: "800",
              }}
            >
              {(displayName.trim() || "X").slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <Text
            selectable
            style={{
              color: "#E7E9EA",
              fontSize: 20,
              fontWeight: "800",
            }}
          >
            {displayName.trim() || "Your name"}
          </Text>
          <Text
            selectable
            style={{
              color: "#71767B",
              fontSize: 15,
            }}
          >
            @{normalizedHandle || "username"}
          </Text>
          {bio.trim() ? (
            <Text
              selectable
              style={{
                color: "#E7E9EA",
                fontSize: 15,
                lineHeight: 21,
              }}
            >
              {bio.trim()}
            </Text>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

function ProfileInput({
  label,
  maxLength,
  multiline,
  onChangeText,
  placeholder,
  prefix,
  value,
}: {
  label: string;
  maxLength: number;
  multiline?: boolean;
  onChangeText(value: string): void;
  placeholder: string;
  prefix?: string;
  value: string;
}) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#2F3336",
        borderRadius: 4,
        borderCurve: "continuous",
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 2,
      }}
    >
      <Text style={{ color: "#71767B", fontSize: 13 }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {prefix ? (
          <Text
            style={{
              color: "#71767B",
              fontSize: 20,
              paddingRight: 2,
            }}
          >
            {prefix}
          </Text>
        ) : null}
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={maxLength}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#71767B"
          style={{
            color: "#E7E9EA",
            flex: 1,
            fontSize: 20,
            minHeight: multiline ? 84 : 42,
            textAlignVertical: multiline ? "top" : "center",
          }}
          value={value}
        />
      </View>
    </View>
  );
}
