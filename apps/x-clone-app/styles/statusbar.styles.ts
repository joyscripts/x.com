import { StyleSheet, ViewStyle } from "react-native";

type StatusBarStyleProps = {
  wrapperViewStyles: ViewStyle;
};

export const getStatusbarStyles = ({
  wrapperViewStyles,
}: StatusBarStyleProps) =>
  StyleSheet.create({
    wrapperView: {
      flex: 1,
      ...wrapperViewStyles,
    },
  });
