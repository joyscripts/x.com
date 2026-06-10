import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import useStatusBarStyles from "@/hooks/useStatusBarStyles";
import useContainerStyles from "@/hooks/useContainerStyles";

type Props = {
  children: React.ReactNode;
};

const ScreenWrapper = ({ children }: Props) => {
  const styles = useStatusBarStyles();
  const containerStyles = useContainerStyles();

  return (
    <View style={styles.wrapperView}>
      <SystemBars style={styles.barStyle} />
      <SafeAreaView style={containerStyles.container} edges={["top"]}>
        <View style={containerStyles.pageContent}>{children}</View>
      </SafeAreaView>
    </View>
  );
};

export default ScreenWrapper;
