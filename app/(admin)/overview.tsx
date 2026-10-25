// Municipal Administrator — Overview / Command Center with Contamination Hotspots & Shared Record Layer Metrics
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/appStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, TAB_BAR_HEIGHT,
} from '../../src/constants';
import { Card, Badge } from '../../src/components/ui';

export default function AdminOverviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    complaints, recyclingRequests, receipts, disputes, issues, recyclers,
  } = useAppStore();

  const [alertSent, setAlertSent] = useState(false);

  const openComplaints = complaints.filter(c => c.status !== 'resolved');
  const activeDisputes = disputes.filter(d => d.status !== 'resolved');
  const pendingSettlement = receipts.filter(r => r.paymentStatus === 'pending');
  const totalKgSettled = receipts.reduce((sum, r) => sum + r.measuredKg, 0);
  const totalValueSettled = receipts.reduce((sum, r) => sum + r.total, 0);

  const handleSendWardAlert = () => {
    setAlertSent(true);
    Alert.alert(
      t('admin.advisoryDispatched'),
      t('admin.advisoryBody'),
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.wardTag}>{t('admin.commandDesk')}</Text>
          <Text style={styles.title}>{t('admin.supervisoryOverview')}</Text>
        </View>
        <View style={styles.statusLive}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{t('admin.liveTelemetry')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 4 Shared Record Layer KPI Tiles */}
        <View style={styles.kpiGrid}>
          <Card style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>{t('admin.totalKgDiverted')}</Text>
              <Ionicons name="leaf-outline" size={14} color={Colors.primary} />
            </View>
            <Text style={[styles.kpiValue, { color: Colors.primary }]}>
              {(totalKgSettled + 148.5).toFixed(1)} kg
            </Text>
            <Text style={styles.kpiSub}>{t('admin.todayMotd')}</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>{t('admin.fairValueDisbursed')}</Text>
              <Ionicons name="cash-outline" size={14} color="#1565C0" />
            </View>
            <Text style={[styles.kpiValue, { color: '#1565C0' }]}>
              ₹{(totalValueSettled + 2840).toFixed(0)}
            </Text>
            <Text style={styles.kpiSub}>{t('admin.clearedUpi')}</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>{t('admin.activeDisputes')}</Text>
              <Ionicons name="scale-outline" size={14} color={activeDisputes.length > 0 ? '#E65100' : Colors.success} />
            </View>
            <Text style={[styles.kpiValue, { color: activeDisputes.length > 0 ? '#E65100' : Colors.success }]}>
              {t('admin.activeLotDisputes', { count: activeDisputes.length })}
            </Text>
            <Text style={styles.kpiSub}>2.1% of verified lots</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>{t('admin.accreditedPickers')}</Text>
              <Ionicons name="people-outline" size={14} color={Colors.collectorAccent} />
            </View>
            <Text style={[styles.kpiValue, { color: Colors.collectorAccent }]}>
              {t('admin.certifiedPickers', { count: 6 })}
            </Text>
            <Text style={styles.kpiSub}>{t('admin.mrfHubs')}</Text>
          </Card>
        </View>

        {/* CONTAMINATION REPORTS & RISK HOTSPOTS CARD (PHASE 6) */}
        <Card style={styles.contaminationCard}>
          <View style={styles.contamHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.contamBadgeRow}>
                <Ionicons name="warning-outline" size={16} color="#C62828" />
                <Text style={styles.contamBadgeText}>{t('admin.contaminationHotspots')}</Text>
              </View>
              <Text style={styles.cardHeading}>Ward Segregation Quality & Risk Hotspots</Text>
            </View>
            <View style={styles.trendPill}>
              <Ionicons name="trending-down" size={14} color="#2E7D32" />
              <Text style={styles.trendPillText}>-4.2% MoM</Text>
            </View>
          </View>

          {/* Offending Wards Breakdown */}
          <Text style={styles.sectionMiniTitle}>OFFENDING LOCALITIES (LOT REJECTION RATE):</Text>
          <View style={styles.hotspotsList}>
            {[
              { ward: 'Koramangala Ward 151', rate: 18.2, level: 'High Risk', color: '#D32F2F', barWidth: '82%' },
              { ward: 'Indiranagar Ward 82', rate: 12.4, level: 'Moderate', color: '#F57F17', barWidth: '58%' },
              { ward: 'HSR Layout Sector 2', rate: 6.1, level: 'Low / Compliant', color: '#388E3C', barWidth: '28%' },
            ].map(item => (
              <View key={item.ward} style={styles.hotspotRow}>
                <View style={styles.hotspotLabelRow}>
                  <Text style={styles.hotspotWard}>{item.ward}</Text>
                  <Text style={[styles.hotspotRate, { color: item.color }]}>{item.rate}% ({item.level})</Text>
                </View>
                <View style={styles.hotspotTrack}>
                  <View style={[styles.hotspotFill, { width: item.barWidth as any, backgroundColor: item.color }]} />
                </View>
              </View>
            ))}
          </View>

          {/* Materials Breakdown Contaminated */}
          <View style={styles.contamMaterialsBox}>
            <Text style={styles.sectionMiniTitle}>CHIEF CONTAMINANTS BY MATERIAL TYPE:</Text>
            <View style={styles.contamMaterialsGrid}>
              <View style={styles.contamMatItem}>
                <Text style={styles.contamMatPct}>42%</Text>
                <Text style={styles.contamMatLbl}>Paper (Food grease)</Text>
              </View>
              <View style={styles.contamMatItem}>
                <Text style={styles.contamMatPct}>38%</Text>
                <Text style={styles.contamMatLbl}>Plastic (Dirty milk pouch)</Text>
              </View>
              <View style={styles.contamMatItem}>
                <Text style={styles.contamMatPct}>12%</Text>
                <Text style={styles.contamMatLbl}>Metal (Sludge / paint)</Text>
              </View>
              <View style={styles.contamMatItem}>
                <Text style={styles.contamMatPct}>8%</Text>
                <Text style={styles.contamMatLbl}>Glass (Ceramic shards)</Text>
              </View>
            </View>
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={[styles.deployAlertBtn, alertSent && { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border }]}
            onPress={handleSendWardAlert}
            disabled={alertSent}
            activeOpacity={0.85}
          >
            <Ionicons
              name={alertSent ? 'checkmark-circle' : 'notifications-outline'}
              size={18}
              color={alertSent ? Colors.success : Colors.textInverse}
            />
            <Text style={[styles.deployAlertBtnText, alertSent && { color: Colors.textSecondary }]}>
              {alertSent ? t('admin.advisoryDispatched') : t('admin.sendAdvisory')}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* MATERIALS BY STREAM PROGRESS BARS (PHASE 7) */}
        <Card style={styles.compositionCard}>
          <Text style={styles.cardHeading}>Recyclables Diverted by Stream (Current Cycle)</Text>
          <Text style={styles.compSub}>Verified intake across registered Material Recovery Facilities</Text>

          <View style={styles.streamProgressList}>
            {[
              { label: 'Cardboard & Paper', kg: 68.4, pct: 45, color: '#F57F17' },
              { label: 'Rigid Plastics (HDPE/PET)', kg: 44.2, pct: 30, color: '#1976D2' },
              { label: 'Scrap Metal (Copper/Alum)', kg: 24.8, pct: 16, color: '#388E3C' },
              { label: 'Glass Bottles', kg: 8.5, pct: 6, color: '#7B1FA2' },
              { label: 'Domestic E-Waste', kg: 4.2, pct: 3, color: '#D32F2F' },
            ].map(stream => (
              <View key={stream.label} style={styles.streamRow}>
                <View style={styles.streamLabelRow}>
                  <Text style={styles.streamName}>{stream.label}</Text>
                  <Text style={styles.streamKg}>{stream.kg} kg ({stream.pct}%)</Text>
                </View>
                <View style={styles.streamTrack}>
                  <View style={[styles.streamFill, { width: `${stream.pct}%`, backgroundColor: stream.color }]} />
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Circular Economy Marketplace Status */}
        <Card style={styles.circularCard}>
          <View style={styles.circularHeader}>
            <View>
              <Text style={styles.cardHeading}>Informal Picker Marketplace</Text>
              <Text style={styles.compSub}>{recyclingRequests.length} active collection listings in ward</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(admin)/requests')}>
              <Text style={styles.viewLink}>Audit Ledger →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.miniStatsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniNum}>6</Text>
              <Text style={styles.miniLbl}>Accredited Pickers</Text>
            </View>
            <View style={styles.miniDiv} />
            <View style={styles.miniStat}>
              <Text style={styles.miniNum}>3.8T</Text>
              <Text style={styles.miniLbl}>Diverted from Landfill</Text>
            </View>
            <View style={styles.miniDiv} />
            <View style={styles.miniStat}>
              <Text style={styles.miniNum}>₹84.2K</Text>
              <Text style={styles.miniLbl}>Worker Income</Text>
            </View>
          </View>
        </Card>

        {/* Quick Links to Complaints & Disputes */}
        <Card style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Ionicons name="chatbubbles-outline" size={20} color={Colors.adminAccent} />
            <Text style={[styles.cardHeading, { color: Colors.adminAccent }]}>Arbitration & Grievance Actions</Text>
          </View>

          <View style={styles.actionLinksRow}>
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => router.push('/(admin)/complaints')}
            >
              <View style={styles.actionTileTop}>
                <Text style={styles.actionTileNum}>{activeDisputes.length}</Text>
                <Ionicons name="scale-outline" size={18} color="#E65100" />
              </View>
              <Text style={styles.actionTileLbl}>Fair Value Disputes</Text>
              <Text style={styles.actionTileSub}>Pending supervisor ruling</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => router.push('/(admin)/complaints')}
            >
              <View style={styles.actionTileTop}>
                <Text style={styles.actionTileNum}>{openComplaints.length}</Text>
                <Ionicons name="megaphone-outline" size={18} color={Colors.error} />
              </View>
              <Text style={styles.actionTileLbl}>Citizen Complaints</Text>
              <Text style={styles.actionTileSub}>Field inspection required</Text>
            </TouchableOpacity>
          </View>
        </Card>
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
  wardTag: { fontSize: 10, color: Colors.adminAccent, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  statusLive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE7F6',
    paddingHorizontal: Spacing[2.5],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.adminAccent },
  liveText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.adminAccent },
  content: { padding: Spacing[4], gap: Spacing[3] },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2.5] },
  kpiCard: { flex: 1, minWidth: '47%', padding: Spacing[3.5], gap: 2 },
  kpiTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiLabel: { fontSize: 9, color: Colors.textTertiary, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  kpiValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, marginVertical: 2 },
  kpiSub: { fontSize: 10, color: Colors.textSecondary },
  contaminationCard: { padding: Spacing[4], gap: Spacing[3], borderWidth: 1, borderColor: '#FFCDD2' },
  contamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  contamBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  contamBadgeText: { fontSize: 10, fontWeight: FontWeight.bold, color: '#C62828', letterSpacing: 0.5 },
  cardHeading: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 2 },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  trendPillText: { fontSize: 10, fontWeight: FontWeight.bold, color: '#2E7D32' },
  sectionMiniTitle: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5 },
  hotspotsList: { gap: Spacing[2] },
  hotspotRow: { gap: 3 },
  hotspotLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hotspotWard: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  hotspotRate: { fontSize: 10, fontWeight: FontWeight.bold },
  hotspotTrack: { height: 6, backgroundColor: Colors.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  hotspotFill: { height: '100%', borderRadius: 3 },
  contamMaterialsBox: { backgroundColor: Colors.surfaceAlt, padding: Spacing[3], borderRadius: BorderRadius.md, gap: Spacing[2] },
  contamMaterialsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  contamMatItem: { alignItems: 'center', flex: 1 },
  contamMatPct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  contamMatLbl: { fontSize: 9, color: Colors.textSecondary, textAlign: 'center', marginTop: 1 },
  deployAlertBtn: {
    minHeight: 48,
    backgroundColor: '#C62828',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
  },
  deployAlertBtnText: { color: Colors.textInverse, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  compositionCard: { padding: Spacing[4], gap: Spacing[3] },
  compSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
  streamProgressList: { gap: Spacing[2.5], marginTop: Spacing[1] },
  streamRow: { gap: 4 },
  streamLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streamName: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  streamKg: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  streamTrack: { height: 8, backgroundColor: Colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  streamFill: { height: '100%', borderRadius: 4 },
  circularCard: { padding: Spacing[4], gap: Spacing[3] },
  circularHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewLink: { fontSize: FontSize.xs, color: Colors.adminAccent, fontWeight: FontWeight.bold },
  miniStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
  },
  miniStat: { flex: 1, alignItems: 'center' },
  miniNum: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  miniLbl: { fontSize: 9, color: Colors.textSecondary, marginTop: 1, textAlign: 'center' },
  miniDiv: { width: 1, height: 24, backgroundColor: Colors.border },
  alertCard: { padding: Spacing[4], gap: Spacing[3] },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  actionLinksRow: { flexDirection: 'row', gap: Spacing[3] },
  actionTile: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    gap: 2,
  },
  actionTileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionTileNum: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  actionTileLbl: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 4 },
  actionTileSub: { fontSize: 10, color: Colors.textSecondary },
});
