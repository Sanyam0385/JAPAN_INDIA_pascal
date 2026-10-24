// Informal Picker — Marketplace / Opportunities Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/stores/appStore';
import { useAuthStore } from '../../src/stores/authStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT,
  MATERIAL_CATEGORIES,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';

export default function OpportunitiesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { recyclingRequests, acceptRequest } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const openRequests = recyclingRequests.filter(r => {
    const isAvailable = r.status === 'open';
    if (!isAvailable) return false;
    if (selectedCategory === 'all') return true;
    return r.materialCategory === selectedCategory;
  });

  const handleAccept = (requestId: string, materialLabel: string) => {
    Alert.alert(
      'Accept Pickup Job',
      `Accept this ${materialLabel} pickup request? The household will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept Job',
          onPress: () => {
            acceptRequest(requestId, user?.id || 'demo-picker-1', user?.name || 'Meena Devi');
            Alert.alert('Job Accepted! 📦', 'Moved to "My Jobs" tab. Please head to the pickup address within the requested window.');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Marketplace</Text>
          <Text style={styles.subtitle}>Open recyclable waste pickups nearby</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{openRequests.length} Available</Text>
        </View>
      </View>

      {/* Category Horizontal Filter */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.filterChipText, selectedCategory === 'all' && styles.filterChipTextActive]}>
              All Materials
            </Text>
          </TouchableOpacity>
          {MATERIAL_CATEGORIES.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.filterChip, selectedCategory === m.id && styles.filterChipActive]}
              onPress={() => setSelectedCategory(m.id)}
            >
              <Text style={styles.filterChipIcon}>{m.icon}</Text>
              <Text style={[styles.filterChipText, selectedCategory === m.id && styles.filterChipTextActive]}>
                {m.label.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner message="⚠️ DEMO MARKETPLACE — Recyclable listings submitted by demo households." />

        {/* Informational Card */}
        <Card variant="filled" style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Picker Guidelines</Text>
          <Text style={styles.infoBody}>
            • Rates shown are market estimates — negotiate final price directly with household.{'\n'}
            • Inspect materials for cleanliness before weighing.{'\n'}
            • Maintain fair trade practices and record genuine collected weights.
          </Text>
        </Card>

        {openRequests.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>No Open Requests</Text>
            <Text style={styles.emptyText}>There are currently no open pickups matching your filter in this locality.</Text>
          </Card>
        ) : (
          openRequests.map((req) => {
            const mat = MATERIAL_CATEGORIES.find(m => m.id === req.materialCategory);
            return (
              <Card key={req.id} style={styles.requestCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.matBadge}>
                    <Text style={styles.matIcon}>{mat?.icon || '♻️'}</Text>
                    <View>
                      <Text style={styles.matTitle}>{mat?.label || req.materialCategory}</Text>
                      <Text style={styles.qtyText}>{req.approximateQuantityKg} {req.quantityUnit}</Text>
                    </View>
                  </View>
                  <View style={styles.priceEstimate}>
                    <Text style={styles.estLabel}>ESTIMATED VALUE</Text>
                    <Text style={styles.estPrice}>₹{req.estimatedPriceMin} - ₹{req.estimatedPriceMax}</Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={Colors.pickerAccent} />
                    <Text style={styles.detailText} numberOfLines={1}>{req.pickupAddress}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={Colors.pickerAccent} />
                    <Text style={styles.detailText}>Window: {req.preferredPickupWindow}</Text>
                  </View>
                  {req.notes ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.notesText} numberOfLines={2}>Note: {req.notes}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Big touch target for outdoor workers */}
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAccept(req.id, mat?.label || req.materialCategory)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textInverse} />
                  <Text style={styles.acceptButtonText}>Claim This Pickup</Text>
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  countPill: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.pickerAccent,
  },
  countText: { color: Colors.pickerAccent, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  filterWrap: { backgroundColor: Colors.surface, paddingVertical: Spacing[2], borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterScroll: { paddingHorizontal: Spacing[4], gap: Spacing[2] },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1.5],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing[1],
  },
  filterChipActive: { backgroundColor: Colors.pickerAccent, borderColor: Colors.pickerAccent },
  filterChipIcon: { fontSize: 14 },
  filterChipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  filterChipTextActive: { color: Colors.textInverse, fontWeight: FontWeight.bold },
  content: { padding: Spacing[4], gap: Spacing[3] },
  infoCard: { backgroundColor: '#FFF8E1', borderColor: '#FFE082' },
  infoTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#B78103', marginBottom: Spacing[1] },
  infoBody: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing[8], gap: Spacing[2] },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  requestCard: { padding: Spacing[4], gap: Spacing[3] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  matBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  matIcon: { fontSize: 32 },
  matTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  qtyText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  priceEstimate: { alignItems: 'flex-end' },
  estLabel: { fontSize: 9, color: Colors.textTertiary, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  estPrice: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.pickerAccent, marginTop: 1 },
  cardDetails: { backgroundColor: Colors.surfaceAlt, padding: Spacing[3], borderRadius: BorderRadius.md, gap: Spacing[1.5] },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  detailText: { fontSize: FontSize.xs, color: Colors.textPrimary, flex: 1 },
  notesText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontStyle: 'italic', flex: 1 },
  acceptButton: {
    minHeight: 56,
    backgroundColor: Colors.pickerAccent,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadow.base,
  },
  acceptButtonText: { color: Colors.textInverse, fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
