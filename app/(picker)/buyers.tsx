// Informal Picker — Recycling Buyer Directory
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, TAB_BAR_HEIGHT,
  MATERIAL_CATEGORIES,
} from '../../src/constants';
import { Card, Badge, DemoDataBanner } from '../../src/components/ui';
import { DEMO_RECYCLING_BUYERS } from '../../src/lib/demo/demoData';

export default function BuyersScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filteredBuyers = DEMO_RECYCLING_BUYERS.filter(b => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return b.name.toLowerCase().includes(q) ||
      b.locality.toLowerCase().includes(q) ||
      b.acceptedMaterials.some(m => m.toLowerCase().includes(q));
  });

  const handleContact = (name: string, phone: string) => {
    Alert.alert(
      'Contact Buyer',
      `Buyer: ${name}\nDirect Phone: ${phone}\n\n⚠️ Demo mode: Direct phone dialing is simulated for hackathon evaluation.`
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Scrap Buyers Directory</Text>
        <Text style={styles.subtitle}>Verified recycling centres and scrap yards</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by buyer name, material, or locality..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <DemoDataBanner message="⚠️ DEMO BUYERS — Fictional recycling facilities with representative market purchase rates." />

        {filteredBuyers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No Buyers Found</Text>
            <Text style={styles.emptyText}>Try searching for another material like "metal", "plastic", or "paper".</Text>
          </Card>
        ) : (
          filteredBuyers.map((buyer) => (
            <Card key={buyer.id} style={styles.buyerCard}>
              <View style={styles.cardHeader}>
                <View style={styles.buyerInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.buyerName}>{buyer.name}</Text>
                    {buyer.isVerified && (
                      <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                    )}
                  </View>
                  <Text style={styles.localityText}>📍 {buyer.locality}</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={14} color="#FFA000" />
                  <Text style={styles.ratingText}>{buyer.rating ? buyer.rating.toFixed(1) : '4.5'}</Text>
                </View>
              </View>

              {/* Operating hours */}
              <View style={styles.hoursRow}>
                <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.hoursText}>Hours: {buyer.operatingHours || buyer.openingHours || '9 AM – 6 PM'}</Text>
              </View>

              {/* Materials accepted */}
              <View style={styles.materialsSection}>
                <Text style={styles.materialsTitle}>ACCEPTED MATERIALS & ESTIMATED RATES:</Text>
                <View style={styles.materialsGrid}>
                  {buyer.acceptedMaterials.map((mat) => {
                    const meta = MATERIAL_CATEGORIES.find(m => m.id === mat);
                    const rate = buyer.priceListPerKg ? buyer.priceListPerKg[mat] : undefined;
                    return (
                      <View key={mat} style={styles.matChip}>
                        <Text style={styles.matChipIcon}>{meta?.icon || '♻️'}</Text>
                        <Text style={styles.matChipName}>{meta?.label.split(' ')[0] || mat}:</Text>
                        <Text style={styles.matChipRate}>₹{rate || '-'}/kg</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Call / Navigate buttons */}
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => handleContact(buyer.name, buyer.phone || '+91-9876543210')}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={18} color={Colors.textInverse} />
                <Text style={styles.contactBtnText}>Call Buyer ({buyer.phone || 'Available'})</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
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
  searchWrap: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2.5],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    height: 44,
    gap: Spacing[2],
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary },
  content: { padding: Spacing[4], gap: Spacing[3] },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing[8], gap: Spacing[2] },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  buyerCard: { padding: Spacing[4], gap: Spacing[3] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  buyerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1.5] },
  buyerName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  localityText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  ratingText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#F57F17' },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1.5] },
  hoursText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  materialsSection: { gap: Spacing[1.5] },
  materialsTitle: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5 },
  materialsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[1.5] },
  matChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  matChipIcon: { fontSize: 13 },
  matChipName: { fontSize: FontSize.xs, color: Colors.textSecondary },
  matChipRate: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
  contactBtn: {
    minHeight: 50,
    backgroundColor: Colors.pickerAccent,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  contactBtnText: { color: Colors.textInverse, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
