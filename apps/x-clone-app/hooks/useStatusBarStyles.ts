import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getStatusbarStyles } from "@/styles/statusbar.styles";
import { SystemBarStyle } from "react-native-edge-to-edge";

const useStatusBarStyles = () => {
  const theme = useColorScheme();
  const styles = getStatusbarStyles({
    wrapperViewStyles: {
      backgroundColor: Colors[theme].background,
    },
  });

  const barStyle: SystemBarStyle = theme === "dark" ? "light" : "dark";

  return { barStyle, ...styles };
};

export default useStatusBarStyles;
