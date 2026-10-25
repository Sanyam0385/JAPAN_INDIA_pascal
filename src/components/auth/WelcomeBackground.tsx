// Rich nature & circularity background for Welcome Screen matching welcome.png
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path, Circle, G, Defs, LinearGradient as SvgGradient, Stop, Rect,
} from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function WelcomeBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base Full-Screen Lush Green Gradient */}
      <LinearGradient
        colors={['#43A047', '#2E7D32', '#1B5E20', '#0D3812']}
        locations={[0, 0.35, 0.7, 1.0]}
        style={StyleSheet.absoluteFill}
      />

      <Svg
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          {/* Subtle Sun / Sky Glow */}
          <SvgGradient id="skyGlow" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#A5D6A7" stopOpacity="0.4" />
            <Stop offset="1" stopColor="#2E7D32" stopOpacity="0" />
          </SvgGradient>

          {/* Distant Hills Gradient */}
          <SvgGradient id="distantHillsGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#66BB6A" stopOpacity="0.35" />
            <Stop offset="1" stopColor="#1B5E20" stopOpacity="0.6" />
          </SvgGradient>

          {/* Mid Hills Gradient */}
          <SvgGradient id="midHillsGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#388E3C" stopOpacity="0.7" />
            <Stop offset="1" stopColor="#14532D" stopOpacity="0.95" />
          </SvgGradient>

          {/* River Water Glow */}
          <SvgGradient id="riverGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#81C784" stopOpacity="0.4" />
            <Stop offset="0.5" stopColor="#C8E6C9" stopOpacity="0.6" />
            <Stop offset="1" stopColor="#66BB6A" stopOpacity="0.3" />
          </SvgGradient>

          {/* Foreground Forest Gradient */}
          <SvgGradient id="foregroundForestGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2E7D32" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#0B2E10" stopOpacity="1" />
          </SvgGradient>
        </Defs>

        {/* Ambient Top Glow */}
        <Circle cx={SCREEN_WIDTH * 0.5} cy={SCREEN_HEIGHT * 0.15} r={SCREEN_WIDTH * 0.8} fill="url(#skyGlow)" />

        {/* TOP LEFT LEAVES / FOLIAGE SILHOUETTE */}
        <G fill="#2E7D32" opacity="0.45">
          {/* Main Leaf 1 */}
          <Path d="M-20,-10 C20,30 50,80 30,130 C10,90 -10,50 -20,-10 Z" />
          {/* Main Leaf 2 */}
          <Path d="M10,-20 C60,20 110,60 100,110 C70,80 30,40 10,-20 Z" />
          {/* Smaller Accent Leaf */}
          <Path d="M40,5 C75,35 95,75 80,105 C65,75 50,45 40,5 Z" />
          {/* Leaf Vine */}
          <Path d="M-10,0 Q60,60 110,90" stroke="#1B5E20" strokeWidth="2.5" fill="none" opacity="0.6" />
        </G>

        {/* TOP RIGHT LEAVES / FOLIAGE SILHOUETTE */}
        <G fill="#2E7D32" opacity="0.4">
          <Path d={`M${SCREEN_WIDTH + 20},-10 C${SCREEN_WIDTH - 20},30 ${SCREEN_WIDTH - 50},80 ${SCREEN_WIDTH - 30},130 C${SCREEN_WIDTH - 10},90 ${SCREEN_WIDTH + 10},50 ${SCREEN_WIDTH + 20},-10 Z`} />
          <Path d={`M${SCREEN_WIDTH - 10},-20 C${SCREEN_WIDTH - 60},20 ${SCREEN_WIDTH - 100},65 ${SCREEN_WIDTH - 90},110 C${SCREEN_WIDTH - 60},80 ${SCREEN_WIDTH - 30},40 ${SCREEN_WIDTH - 10},-20 Z`} />
        </G>

        {/* DISTANT MOUNTAINS & MIST (Bottom 35%) */}
        {(() => {
          const baseY = SCREEN_HEIGHT * 0.68;
          return (
            <G>
              {/* Layer 1: Distant Misty Ridge */}
              <Path
                d={`M0,${baseY} Q${SCREEN_WIDTH * 0.25},${baseY - 40} ${SCREEN_WIDTH * 0.5},${baseY - 20} T${SCREEN_WIDTH},${baseY - 30} L${SCREEN_WIDTH},${SCREEN_HEIGHT} L0,${SCREEN_HEIGHT} Z`}
                fill="url(#distantHillsGrad)"
              />

              {/* Distant Sustainable City Skyline Silhouette */}
              <G fill="#C8E6C9" opacity="0.32">
                <Rect x={SCREEN_WIDTH * 0.55} y={baseY - 35} width={12} height={35} rx={2} />
                <Rect x={SCREEN_WIDTH * 0.59} y={baseY - 50} width={16} height={50} rx={2} />
                <Rect x={SCREEN_WIDTH * 0.64} y={baseY - 40} width={14} height={40} rx={2} />
                <Rect x={SCREEN_WIDTH * 0.68} y={baseY - 62} width={18} height={62} rx={2} />
                <Path d={`M${SCREEN_WIDTH * 0.69},${baseY - 62} L${SCREEN_WIDTH * 0.70},${baseY - 78} L${SCREEN_WIDTH * 0.71},${baseY - 62} Z`} />
                <Rect x={SCREEN_WIDTH * 0.74} y={baseY - 45} width={14} height={45} rx={2} />
                <Rect x={SCREEN_WIDTH * 0.78} y={baseY - 30} width={15} height={30} rx={2} />
                <Rect x={SCREEN_WIDTH * 0.83} y={baseY - 52} width={14} height={52} rx={2} />
                <Path d={`M${SCREEN_WIDTH * 0.835},${baseY - 52} L${SCREEN_WIDTH * 0.842},${baseY - 68} L${SCREEN_WIDTH * 0.849},${baseY - 52} Z`} />
              </G>

              {/* Wind Turbines on the Left Ridge */}
              <G stroke="#E8F5E9" opacity="0.6" strokeLinecap="round">
                {/* Turbine 1 */}
                <Path d={`M${SCREEN_WIDTH * 0.12},${baseY - 15} L${SCREEN_WIDTH * 0.12},${baseY - 65}`} strokeWidth="2" />
                <Circle cx={SCREEN_WIDTH * 0.12} cy={baseY - 65} r="2.5" fill="#E8F5E9" />
                <Path d={`M${SCREEN_WIDTH * 0.12},${baseY - 65} L${SCREEN_WIDTH * 0.12 - 14},${baseY - 74}`} strokeWidth="1.5" />
                <Path d={`M${SCREEN_WIDTH * 0.12},${baseY - 65} L${SCREEN_WIDTH * 0.12 + 14},${baseY - 74}`} strokeWidth="1.5" />
                <Path d={`M${SCREEN_WIDTH * 0.12},${baseY - 65} L${SCREEN_WIDTH * 0.12},${baseY - 49}`} strokeWidth="1.5" />

                {/* Turbine 2 (smaller, further) */}
                <Path d={`M${SCREEN_WIDTH * 0.05},${baseY - 10} L${SCREEN_WIDTH * 0.05},${baseY - 50}`} strokeWidth="1.6" />
                <Circle cx={SCREEN_WIDTH * 0.05} cy={baseY - 50} r="2" fill="#E8F5E9" />
                <Path d={`M${SCREEN_WIDTH * 0.05},${baseY - 50} L${SCREEN_WIDTH * 0.05 - 11},${baseY - 58}`} strokeWidth="1.2" />
                <Path d={`M${SCREEN_WIDTH * 0.05},${baseY - 50} L${SCREEN_WIDTH * 0.05 + 11},${baseY - 58}`} strokeWidth="1.2" />
                <Path d={`M${SCREEN_WIDTH * 0.05},${baseY - 50} L${SCREEN_WIDTH * 0.05},${baseY - 38}`} strokeWidth="1.2" />
              </G>

              {/* Layer 2: Mid Rolling Green Hills */}
              <Path
                d={`M0,${baseY + 15} Q${SCREEN_WIDTH * 0.3},${baseY - 15} ${SCREEN_WIDTH * 0.6},${baseY + 20} T${SCREEN_WIDTH},${baseY + 10} L${SCREEN_WIDTH},${SCREEN_HEIGHT} L0,${SCREEN_HEIGHT} Z`}
                fill="url(#midHillsGrad)"
              />

              {/* Serene River Curve */}
              <Path
                d={`M${SCREEN_WIDTH * 0.25},${baseY + 45} Q${SCREEN_WIDTH * 0.5},${baseY + 35} ${SCREEN_WIDTH * 0.8},${baseY + 50} L${SCREEN_WIDTH * 0.85},${baseY + 62} Q${SCREEN_WIDTH * 0.5},${baseY + 45} ${SCREEN_WIDTH * 0.2},${baseY + 58} Z`}
                fill="url(#riverGrad)"
              />

              {/* Layer 3: Lush Foreground Terraces & Low Hills */}
              <Path
                d={`M0,${baseY + 60} Q${SCREEN_WIDTH * 0.35},${baseY + 40} ${SCREEN_WIDTH * 0.7},${baseY + 70} T${SCREEN_WIDTH},${baseY + 55} L${SCREEN_WIDTH},${SCREEN_HEIGHT} L0,${SCREEN_HEIGHT} Z`}
                fill="url(#foregroundForestGrad)"
              />
            </G>
          );
        })()}

        {/* BOTTOM VIBRANT LEAF BORDER (Framing bottom) */}
        <G fill="#1B5E20" opacity="0.85">
          <Path d={`M-30,${SCREEN_HEIGHT - 30} C10,${SCREEN_HEIGHT - 80} 40,${SCREEN_HEIGHT - 120} 80,${SCREEN_HEIGHT - 80} C40,${SCREEN_HEIGHT - 40} 0,${SCREEN_HEIGHT} -30,${SCREEN_HEIGHT - 30} Z`} />
          <Path d={`M20,${SCREEN_HEIGHT} C60,${SCREEN_HEIGHT - 60} 100,${SCREEN_HEIGHT - 90} 140,${SCREEN_HEIGHT - 50} C100,${SCREEN_HEIGHT - 20} 60,${SCREEN_HEIGHT + 10} 20,${SCREEN_HEIGHT} Z`} />
          <Path d={`M${SCREEN_WIDTH + 30},${SCREEN_HEIGHT - 20} C${SCREEN_WIDTH - 20},${SCREEN_HEIGHT - 70} ${SCREEN_WIDTH - 60},${SCREEN_HEIGHT - 100} ${SCREEN_WIDTH - 100},${SCREEN_HEIGHT - 60} C${SCREEN_WIDTH - 50},${SCREEN_HEIGHT - 20} ${SCREEN_WIDTH},${SCREEN_HEIGHT} ${SCREEN_WIDTH + 30},${SCREEN_HEIGHT - 20} Z`} />
        </G>
      </Svg>
    </View>
  );
}
