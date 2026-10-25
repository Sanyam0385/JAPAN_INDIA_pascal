// Shared organic watercolor leaf & hills background matching login.png & register.png
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path, G, Defs, LinearGradient as SvgGradient, Stop,
} from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function AuthBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          {/* Top Right Organic Blob Gradient */}
          <SvgGradient id="topBlobGrad" x1="1" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#A5D6A7" stopOpacity="0.5" />
            <Stop offset="60%" stopColor="#C8E6C9" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#E8F5E9" stopOpacity="0" />
          </SvgGradient>

          {/* Bottom Wave 1 Gradient */}
          <SvgGradient id="bottomWave1" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#C8E6C9" stopOpacity="0.45" />
            <Stop offset="100%" stopColor="#81C784" stopOpacity="0.35" />
          </SvgGradient>

          {/* Bottom Wave 2 Gradient */}
          <SvgGradient id="bottomWave2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#81C784" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#43A047" stopOpacity="0.4" />
          </SvgGradient>

          {/* Natural Leaf Gradient */}
          <SvgGradient id="authLeafGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#43A047" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#1B5E20" stopOpacity="0.95" />
          </SvgGradient>
        </Defs>

        {/* TOP RIGHT ORGANIC BLOBS & LEAF MOTIFS */}
        <G>
          {/* Soft Fluid Organic Blob */}
          <Path
            d={`M${SCREEN_WIDTH * 0.45},0 C${SCREEN_WIDTH * 0.55},70 ${SCREEN_WIDTH * 0.75},110 ${SCREEN_WIDTH},90 L${SCREEN_WIDTH},0 Z`}
            fill="url(#topBlobGrad)"
          />
          <Path
            d={`M${SCREEN_WIDTH * 0.6},0 C${SCREEN_WIDTH * 0.7},90 ${SCREEN_WIDTH * 0.85},140 ${SCREEN_WIDTH},160 L${SCREEN_WIDTH},0 Z`}
            fill="#E8F5E9"
            opacity="0.6"
          />

          {/* Top-Right Large Foliage Leaf 1 */}
          <Path
            d={`M${SCREEN_WIDTH},70 C${SCREEN_WIDTH - 60},85 ${SCREEN_WIDTH - 90},140 ${SCREEN_WIDTH - 80},210 C${SCREEN_WIDTH - 30},170 ${SCREEN_WIDTH},120 ${SCREEN_WIDTH},70 Z`}
            fill="url(#authLeafGrad)"
            opacity="0.85"
          />
          {/* Leaf 1 Center Vein */}
          <Path
            d={`M${SCREEN_WIDTH},70 Q${SCREEN_WIDTH - 50},130 ${SCREEN_WIDTH - 80},210`}
            stroke="#A5D6A7"
            strokeWidth="1.2"
            fill="none"
            opacity="0.75"
          />

          {/* Floating Small Leaf Near Top */}
          <Path
            d={`M${SCREEN_WIDTH - 110},80 C${SCREEN_WIDTH - 130},65 ${SCREEN_WIDTH - 145},40 ${SCREEN_WIDTH - 120},30 C${SCREEN_WIDTH - 105},45 ${SCREEN_WIDTH - 100},65 ${SCREEN_WIDTH - 110},80 Z`}
            fill="#43A047"
            opacity="0.6"
          />
          <Path
            d={`M${SCREEN_WIDTH - 85},95 C${SCREEN_WIDTH - 95},80 ${SCREEN_WIDTH - 105},60 ${SCREEN_WIDTH - 90},50 C${SCREEN_WIDTH - 80},60 ${SCREEN_WIDTH - 75},75 ${SCREEN_WIDTH - 85},95 Z`}
            fill="#66BB6A"
            opacity="0.5"
          />
        </G>

        {/* BOTTOM LAYERED ROLLING WAVY GREEN HILLS & FLOATING LEAVES */}
        {(() => {
          const bY = SCREEN_HEIGHT * 0.84;
          return (
            <G>
              {/* Back Wave (Very Light Mint) */}
              <Path
                d={`M0,${bY - 40} C${SCREEN_WIDTH * 0.25},${bY - 10} ${SCREEN_WIDTH * 0.65},${bY - 60} ${SCREEN_WIDTH},${bY - 20} L${SCREEN_WIDTH},${SCREEN_HEIGHT} L0,${SCREEN_HEIGHT} Z`}
                fill="url(#bottomWave1)"
              />

              {/* Mid Wave (Medium Spring Green) */}
              <Path
                d={`M0,${bY} C${SCREEN_WIDTH * 0.3},${bY - 30} ${SCREEN_WIDTH * 0.7},${bY + 20} ${SCREEN_WIDTH},${bY - 10} L${SCREEN_WIDTH},${SCREEN_HEIGHT} L0,${SCREEN_HEIGHT} Z`}
                fill="url(#bottomWave2)"
              />

              {/* Front Wave (Deepest Soft Green) */}
              <Path
                d={`M0,${bY + 30} C${SCREEN_WIDTH * 0.4},${bY + 10} ${SCREEN_WIDTH * 0.75},${bY + 45} ${SCREEN_WIDTH},${bY + 25} L${SCREEN_WIDTH},${SCREEN_HEIGHT} L0,${SCREEN_HEIGHT} Z`}
                fill="#43A047"
                opacity="0.25"
              />

              {/* Floating Leaf 1 (Left) */}
              <Path
                d={`M-10,${bY + 5} C20,${bY - 30} 45,${bY - 70} 70,${bY - 40} C40,${bY - 10} 15,${bY + 20} -10,${bY + 5} Z`}
                fill="url(#authLeafGrad)"
                opacity="0.8"
              />
              <Path
                d={`M25,${bY + 40} C45,${bY + 15} 65,${bY - 10} 80,${bY + 10} C60,${bY + 30} 40,${bY + 50} 25,${bY + 40} Z`}
                fill="#2E7D32"
                opacity="0.75"
              />

              {/* Floating Little Leaves (Center) */}
              <Path
                d={`M${SCREEN_WIDTH * 0.32},${bY - 35} C${SCREEN_WIDTH * 0.35},${bY - 50} ${SCREEN_WIDTH * 0.38},${bY - 52} ${SCREEN_WIDTH * 0.37},${bY - 38} C${SCREEN_WIDTH * 0.35},${bY - 32} ${SCREEN_WIDTH * 0.33},${bY - 30} ${SCREEN_WIDTH * 0.32},${bY - 35} Z`}
                fill="#388E3C"
                opacity="0.7"
              />

              {/* Floating Leaf (Right) */}
              <Path
                d={`M${SCREEN_WIDTH + 10},${bY + 15} C${SCREEN_WIDTH - 30},${bY - 20} ${SCREEN_WIDTH - 60},${bY - 50} ${SCREEN_WIDTH - 85},${bY - 25} C${SCREEN_WIDTH - 55},${bY - 5} ${SCREEN_WIDTH - 25},${bY + 25} ${SCREEN_WIDTH + 10},${bY + 15} Z`}
                fill="url(#authLeafGrad)"
                opacity="0.8"
              />
              <Path
                d={`M${SCREEN_WIDTH - 35},${bY + 45} C${SCREEN_WIDTH - 55},${bY + 25} ${SCREEN_WIDTH - 75},${bY} ${SCREEN_WIDTH - 90},${bY + 18} C${SCREEN_WIDTH - 70},${bY + 35} ${SCREEN_WIDTH - 50},${bY + 55} ${SCREEN_WIDTH - 35},${bY + 45} Z`}
                fill="#2E7D32"
                opacity="0.75"
              />
            </G>
          );
        })()}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FAFDF9',
  },
});
