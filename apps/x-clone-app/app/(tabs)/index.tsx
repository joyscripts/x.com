import { Pressable, Text, View } from "react-native";
import ScreenWrapper from "@/components/ui/screen-wrapper";
import { useAuthSession } from "@/hooks/use-auth-session";

export default function TabOneScreen() {
  const { session, signOut } = useAuthSession();

  return (
    <ScreenWrapper>
      <View style={{ flex: 1, gap: 24 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: "#2F3336",
            paddingBottom: 14,
          }}
        >
          <Text
            selectable
            style={{
              color: "#E7E9EA",
              fontSize: 28,
              fontWeight: "800",
            }}
          >
            X
          </Text>
          <Pressable
            onPress={() => void signOut()}
            style={{
              minHeight: 38,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#536471",
              borderRadius: 999,
              paddingHorizontal: 16,
            }}
          >
            <Text
              style={{
                color: "#E7E9EA",
                fontSize: 14,
                fontWeight: "700",
              }}
            >
              Log out
            </Text>
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          <Text
            selectable
            style={{
              color: "#E7E9EA",
              fontSize: 21,
              fontWeight: "800",
            }}
          >
            Welcome back
          </Text>
          <Text
            selectable
            style={{
              color: "#71767B",
              fontSize: 15,
              lineHeight: 21,
            }}
          >
            {session?.phoneNumber ?? "Authenticated session"}
          </Text>
        </View>

        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "#2F3336",
            paddingVertical: 18,
            gap: 8,
          }}
        >
          <Text
            selectable
            style={{
              color: "#E7E9EA",
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            Home
          </Text>
          <Text
            selectable
            style={{
              color: "#71767B",
              fontSize: 15,
              lineHeight: 21,
            }}
          >
            Your feed is ready for posts, follows, and timeline events next.
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}
