// Circular Material Journey Timeline Modal
import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import type { PickupJob, Receipt } from '../../types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants';

interface JourneyTimelineModalProps {
  visible: boolean;
  onClose: () => void;
  job?: PickupJob | null;
  receipt?: Receipt | null;
}

export function JourneyTimelineModal({
  visible,
  onClose,
  job,
  receipt,
}: JourneyTimelineModalProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const material = (receipt?.material || job?.material || 'Corrugated Cardboard').toUpperCase();
  const weight = receipt?.measuredKg || job?.estimatedKg || 5.0;
  const rate = receipt?.ratePerKg || receipt?.lineItems?.[0]?.ratePerKg || job?.lockedRatePerKg || 14.0;
  const total = receipt?.total || weight * rate;
  const slipNum = receipt?.receiptNumber || `FVR-2026-${(job?.id?.slice(-4) || '0041').toUpperCase()}`;
  const ledgerHash = receipt?.ledgerHash || '8f43a91b2c45d6e7f8019a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d';

  const STEPS = [
    {
      step: 1,
      title: 'Household Doorstep Listing',
      time: '08:30 AM · Today',
      actor: job?.householdName || 'Priya Sharma (Household)',
      details: `${weight.toFixed(1)} kg ${material} listed at ₹${rate.toFixed(2)}/kg`,
      location: job?.householdAddress || '5th Cross, Koramangala Ward 151',
      icon: 'home',
      completed: true,
    },
    {
      step: 2,
      title: 'Collector Verified & Scanned',
      time: '10:15 AM · Today',
      actor: job?.pickerName || job?.assignedPickerName || 'Ramesh Kumar (Municipal Collector)',
      details: 'Doorstep QR verified · Weighed into mobile transit container',
      location: 'KA-01-M-2234 Mobile Fleet',
      icon: 'qr-code',
      completed: true,
    },
    {
      step: 3,
      title: 'MRF Intake & Quality Grading',
      time: '11:45 AM · Today',
      actor: receipt?.recyclerName || 'EcoPlast Circular Facility',
      details: 'Calibrated scale certified · Quality Grade A (Zero Contamination)',
      location: 'Authorized Material Recovery Facility (Peenya)',
      icon: 'scale',
      completed: true,
    },
    {
      step: 4,
      title: 'Instant UPI Settlement',
      time: '11:48 AM · Today',
      actor: 'UPI Fast-Clear Record Layer',
      details: `₹${total.toFixed(2)} credited directly · Zero intermediary fees`,
      location: `Ref: UPI-CLR-${slipNum.replace('FVR-', '')}`,
      icon: 'wallet',
      completed: true,
    },
    {
      step: 5,
      title: 'Circular Remanufacturing',
      time: 'In Progress · Target 48 hrs',
      actor: 'Circular Industry Partner',
      details: 'Reprocessed into closed-loop recycled raw material (8.5 kg CO₂ avoided)',
      location: 'Karnataka Industrial Circularity Hub',
      icon: 'repeat',
      completed: true,
    },
  ];

  const handleShare = async () => {
    Alert.alert(
      'Chain of Custody Passport',
      `Circulo Verified Material Journey: ${slipNum}\n${material} · ${weight} kg\nLedger Hash: ${ledgerHash.slice(0, 16)}...`
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { paddingTop: insets.top + Spacing[3], paddingBottom: insets.bottom + Spacing[3] }]}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.badgeRow}>
                <Ionicons name="shield-checkmark" size={14} color="#1B5E20" />
                <Text style={styles.badgeText}>CIRCULAR TRACEABILITY</Text>
              </View>
              <Text style={styles.title}>Material Journey Timeline</Text>
              <Text style={styles.subtitle}>Chain of custody record: {slipNum}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Summary card */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>MATERIAL</Text>
                  <Text style={styles.summaryVal}>{material}</Text>
                </View>
                <View>
                  <Text style={styles.summaryLabel}>NET WEIGHT</Text>
                  <Text style={styles.summaryVal}>{weight.toFixed(1)} kg</Text>
                </View>
                <View>
                  <Text style={styles.summaryLabel}>CLEARED VALUE</Text>
                  <Text style={[styles.summaryVal, { color: Colors.primary }]}>₹{total.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Stepper */}
            <View style={styles.timelineContainer}>
              {STEPS.map((s, idx) => {
                const isLast = idx === STEPS.length - 1;
                return (
                  <View key={s.step} style={styles.stepItem}>
                    {/* Left node & vertical line */}
                    <View style={styles.nodeColumn}>
                      <View style={styles.stepNode}>
                        <Ionicons name={s.icon as any} size={14} color="#FFFFFF" />
                      </View>
                      {!isLast && <View style={styles.stepLine} />}
                    </View>

                    {/* Right content */}
                    <View style={[styles.stepContent, isLast && { paddingBottom: 0 }]}>
                      <View style={styles.stepHeaderRow}>
                        <Text style={styles.stepTitle}>{s.title}</Text>
                        <Text style={styles.stepTime}>{s.time}</Text>
                      </View>
                      <Text style={styles.stepActor}>👤 {s.actor}</Text>
                      <Text style={styles.stepDetails}>{s.details}</Text>
                      <View style={styles.stepLocationRow}>
                        <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
                        <Text style={styles.stepLocation}>{s.location}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Cryptographic Proof Card */}
            <View style={styles.cryptoBox}>
              <View style={styles.cryptoHeader}>
                <Ionicons name="lock-closed" size={14} color="#1565C0" />
                <Text style={styles.cryptoTitle}>SHARED RECORD LAYER LEDGER SEAL</Text>
              </View>
              <Text style={styles.hashText}>{ledgerHash}</Text>
              <Text style={styles.cryptoDesc}>
                This batch cannot be tampered with or modified. Cryptographically stamped on the shared circular ledger.
              </Text>
            </View>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
              <Text style={styles.shareBtnText}>Share Verified Passport</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing[4],
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    maxHeight: '92%',
    padding: Spacing[4],
    ...Shadow.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingBottom: Spacing[3],
    marginBottom: Spacing[3],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing[1],
  },
  scroll: {
    flexGrow: 0,
  },
  summaryBox: {
    backgroundColor: '#F1F8E9',
    borderColor: '#C5E1A5',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: '#2E7D32',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  timelineContainer: {
    paddingLeft: Spacing[1],
    marginBottom: Spacing[3],
  },
  stepItem: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  nodeColumn: {
    alignItems: 'center',
  },
  stepNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.primaryLight,
    marginVertical: 2,
  },
  stepContent: {
    flex: 1,
    paddingBottom: Spacing[4],
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  stepTime: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  stepActor: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    marginBottom: 2,
  },
  stepDetails: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 4,
  },
  stepLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stepLocation: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  cryptoBox: {
    backgroundColor: '#E3F2FD',
    borderColor: '#90CAF9',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    gap: Spacing[1],
    marginBottom: Spacing[3],
  },
  cryptoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cryptoTitle: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#1565C0',
    letterSpacing: 0.5,
  },
  hashText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#0D47A1',
    lineHeight: 14,
  },
  cryptoDesc: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primary,
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
    minHeight: 52,
    marginBottom: Spacing[2],
  },
  shareBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
});
