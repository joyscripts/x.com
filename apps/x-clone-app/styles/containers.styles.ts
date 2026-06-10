import { StyleSheet, ViewStyle } from "react-native";

type ContainerStyleProps = {
  pageContentStyles: ViewStyle;
};

export const getContainerStyles = ({
  pageContentStyles,
}: ContainerStyleProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    pageContent: {
      flex: 1,
      width: "100%",
      ...pageContentStyles,
    },
  });
