// Role Selection Card matching register.png
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow,
} from '../../constants';

interface RoleCardProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}

export function RoleCard({
  label,
  icon,
  selected,
  onPress,
}: RoleCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected ? styles.cardSelected : styles.cardUnselected]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`Select role: ${label}`}
    >
      {selected && (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
        </View>
      )}

      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons
          name={icon}
          size={32}
          color={selected ? '#1B5E20' : '#2E7D32'}
        />
      </View>

      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 104,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[1],
    ...Shadow.sm,
  },
  cardUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2ECE4',
  },
  cardSelected: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#1B5E20',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginBottom: Spacing[1.5],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    transform: [{ scale: 1.05 }],
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#34523C',
    textAlign: 'center',
  },
  labelSelected: {
    color: '#0A2E12',
    fontWeight: FontWeight.extrabold,
  },
});
