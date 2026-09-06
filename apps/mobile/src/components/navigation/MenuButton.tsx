import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSidebar } from './SidebarContext';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';

export function MenuButton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { open } = useSidebar();

  return (
    <Pressable style={styles.button} onPress={open} testID="menu-button" hitSlop={8}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 6h16M4 12h16M4 18h16"
          stroke={colors.text}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    button: { padding: 4, marginLeft: -4 },
  });
}
