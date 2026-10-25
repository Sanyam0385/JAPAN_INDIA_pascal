// CIRCULO Circular Logo Badge matching welcome.png and login.png
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, {
  Path, Circle, Defs, RadialGradient, Stop, G,
} from 'react-native-svg';

interface CirculoLogoBadgeProps {
  size?: number;
  onLongPress?: () => void;
  onPress?: () => void;
}

export function CirculoLogoBadge({
  size = 110,
  onLongPress,
  onPress,
}: CirculoLogoBadgeProps) {
  const scale = size / 110;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={600}
      accessibilityRole="button"
      accessibilityLabel="CIRCULO Emblem. Long press for quick demo role switcher."
      style={[styles.container, { width: size, height: size }]}
    >
      <Svg width={size} height={size} viewBox="0 0 110 110">
        <Defs>
          {/* Subtle Outer Glow */}
          <RadialGradient id="badgeOuterGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>

          {/* Disc Fill: Soft Pale Mint to White */}
          <RadialGradient id="badgeDisc" cx="40%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <Stop offset="70%" stopColor="#E8F5E9" stopOpacity="0.95" />
            <Stop offset="100%" stopColor="#C8E6C9" stopOpacity="0.95" />
          </RadialGradient>

          {/* Left Leaf Gradient */}
          <RadialGradient id="leftLeafGrad" cx="30%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#66BB6A" />
            <Stop offset="100%" stopColor="#1B5E20" />
          </RadialGradient>

          {/* Right Leaf Gradient */}
          <RadialGradient id="rightLeafGrad" cx="30%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#81C784" />
            <Stop offset="100%" stopColor="#2E7D32" />
          </RadialGradient>
        </Defs>

        {/* Outer Glow Halo */}
        <Circle cx="55" cy="55" r="54" fill="url(#badgeOuterGlow)" />

        {/* Main Badge Disc */}
        <Circle cx="55" cy="55" r="44" fill="url(#badgeDisc)" stroke="#E0F2F1" strokeWidth="1.5" />

        {/* Inner Subtle Ring */}
        <Circle cx="55" cy="55" r="41" fill="none" stroke="rgba(27, 94, 32, 0.12)" strokeWidth="1" />

        {/* LEFT NATURAL LEAF (curling around bottom-left of badge) */}
        <G>
          <Path
            d="M20,68 C12,50 20,32 30,28 C34,42 30,60 20,68 Z"
            fill="url(#leftLeafGrad)"
          />
          {/* Leaf vein */}
          <Path
            d="M20,68 Q24,48 30,28"
            stroke="#A5D6A7"
            strokeWidth="0.8"
            fill="none"
            opacity="0.8"
          />
        </G>

        {/* RIGHT NATURAL LEAF (curling around bottom-right of badge) */}
        <G>
          <Path
            d="M90,68 C98,50 90,32 80,28 C76,42 80,60 90,68 Z"
            fill="url(#rightLeafGrad)"
          />
          {/* Leaf vein */}
          <Path
            d="M90,68 Q86,48 80,28"
            stroke="#C8E6C9"
            strokeWidth="0.8"
            fill="none"
            opacity="0.8"
          />
        </G>

        {/* RECYCLE TRIANGLE SYMBOL (Deep Forest Green, 3 folded arrow loop) */}
        <G fill="#1B5E20" transform="translate(55, 55) scale(0.9) translate(-55, -55)">
          {/* Top Arrow Block */}
          <Path
            d="M55,30 L65,42 L58,42 L58,46 L52,46 L52,42 L45,42 Z"
          />
          {/* Right Arrow Block */}
          <Path
            d="M74,62 L74,48 L69,52 L66,48 L62,51 L66,55 L61,58 Z"
          />
          {/* Left Arrow Block */}
          <Path
            d="M36,62 L49,58 L44,55 L48,51 L44,48 L41,52 L36,48 Z"
          />
          {/* Central Loop Body */}
          <Path
            d="M51,44 L59,44 C65,44 69,48 71,53 L66,56 C65,53 62,50 59,50 L51,50 Z"
          />
          <Path
            d="M68,57 L64,64 C61,69 56,71 50,71 L50,65 C54,65 57,63 59,60 L63,53 Z"
          />
          <Path
            d="M47,68 L42,68 C36,68 32,64 30,59 L35,56 C36,60 39,62 42,62 L47,62 Z"
          />
        </G>
      </Svg>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
