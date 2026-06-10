import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getContainerStyles } from "@/styles/containers.styles";

const useContainerStyles = () => {
  const theme = useColorScheme();
  const styles = getContainerStyles({
    pageContentStyles: {
      backgroundColor: Colors[theme].background,
    },
  });

  return styles;
};

export default useContainerStyles;
