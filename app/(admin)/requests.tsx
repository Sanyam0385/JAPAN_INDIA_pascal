// Municipal Administrator — Ward Recycling Requests Audit
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/stores/appStore';
import {
  Colors, FontSize, FontWeight, Spacing, TAB_BAR_HEIGHT,
  MATERIAL_CATEGORIES,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';

export default function AdminRequestsScreen() {
  const insets = useSafeAreaInsets();
  const { recyclingRequests } = useAppStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Ward Recycling Ledger</Text>
        <Text style={styles.subtitle}>Audit trail of household recyclable transfers</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner message="⚠️ DEMO AUDIT LEDGER — Complete cross-role visibility of all household recycling activity." />

        {recyclingRequests.map((req) => {
          const mat = MATERIAL_CATEGORIES.find(m => m.id === req.materialCategory);
          return (
            <Card key={req.id} style={styles.reqCard}>
              <View style={styles.cardHeader}>
                <View style={styles.matRow}>
                  <Text style={styles.matIcon}>{mat?.icon || '♻️'}</Text>
                  <View>
                    <Text style={styles.matTitle}>{mat?.label || req.materialCategory}</Text>
                    <Text style={styles.qtyText}>{req.approximateQuantityKg} {req.quantityUnit}</Text>
                  </View>
                </View>
                <Badge
                  label={req.status.replace(/_/g, ' ')}
                  variant={req.status === 'completed' ? 'success' : req.status === 'open' ? 'info' : 'warning'}
                />
              </View>

              <View style={styles.detailsBox}>
                <Text style={styles.detailItem}>📍 Pickup: {req.pickupAddress}</Text>
                <Text style={styles.detailItem}>
                  👤 Collector: {req.assignedPickerName ? `${req.assignedPickerName} (Accredited Picker)` : 'Unassigned (In Marketplace)'}
                </Text>
                <Text style={styles.detailItem}>
                  💰 Transaction: {req.agreedPrice ? `₹${req.agreedPrice.toFixed(2)} finalized` : `Est. ₹${req.estimatedPriceMin} - ₹${req.estimatedPriceMax}`}
                </Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  content: { padding: Spacing[4], gap: Spacing[3] },
  reqCard: { padding: Spacing[4], gap: Spacing[3] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2.5] },
  matIcon: { fontSize: 26 },
  matTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  qtyText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  detailsBox: { backgroundColor: Colors.surfaceAlt, padding: Spacing[3], borderRadius: 8, gap: Spacing[1] },
  detailItem: { fontSize: FontSize.xs, color: Colors.textSecondary },
});
