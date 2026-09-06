import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSidebar } from './SidebarContext';

export function MenuButton() {
  const { open } = useSidebar();

  return (
    <Pressable style={styles.button} onPress={open} testID="menu-button" hitSlop={8}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M4 6h16M4 12h16M4 18h16" stroke="#111827" strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { padding: 4, marginLeft: -4 },
});
