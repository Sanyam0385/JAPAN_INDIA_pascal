// Auth Text Input Field matching design references login.png and register.png
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  TextInputProps, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow,
} from '../../constants';

interface AuthTextFieldProps extends TextInputProps {
  label?: string;
  required?: boolean;
  leadingIcon?: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  hint?: string | null;
  isPassword?: boolean;
  rightAction?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function AuthTextField({
  label,
  required = false,
  leadingIcon,
  error,
  hint,
  isPassword = false,
  rightAction,
  containerStyle,
  style,
  ...rest
}: AuthTextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.requiredAsterisk}> *</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {leadingIcon ? (
          <View style={styles.leadingIconWrap}>
            <Ionicons
              name={leadingIcon}
              size={20}
              color={error ? Colors.error : isFocused ? '#1B5E20' : '#718276'}
            />
          </View>
        ) : null}

        <TextInput
          style={[styles.input, leadingIcon ? { paddingLeft: 0 } : null, style]}
          placeholderTextColor="#9EB3A4"
          secureTextEntry={isPassword ? !showPassword : rest.secureTextEntry}
          onFocus={e => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.rightActionBtn}
            onPress={() => setShowPassword(!showPassword)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#5A7361"
            />
          </TouchableOpacity>
        ) : (
          rightAction ? <View style={styles.rightActionSlot}>{rightAction}</View> : null
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing[1.5],
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#0A2E12',
    letterSpacing: 0.1,
  },
  requiredAsterisk: {
    color: '#D32F2F',
    fontWeight: FontWeight.bold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2ECE4',
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: Spacing[3.5],
    ...Shadow.sm,
  },
  inputFocused: {
    borderColor: '#1B5E20',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF8F8',
  },
  leadingIconWrap: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: FontSize.base,
    color: '#0A2E12',
    paddingVertical: 0,
  },
  rightActionBtn: {
    padding: Spacing[1.5],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActionSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingHorizontal: Spacing[1],
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontWeight: FontWeight.medium,
  },
  hintText: {
    fontSize: FontSize.xs,
    color: '#5A7361',
    paddingHorizontal: Spacing[1],
  },
});
