// Reusable Fair Value Receipt / Circularity Passport Component
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import type { Receipt } from '../../types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Badge } from '../ui/Badge';
import { JourneyTimelineModal } from './JourneyTimelineModal';

export interface FairValueReceiptProps {
  receipt: Receipt;
  onClose?: () => void;
  onRaiseDispute?: (receipt: Receipt) => void;
  showActions?: boolean;
  style?: object;
}

// Jagged/Torn paper edge rendered via SVG
function TornPaperEdge({ position = 'top', color = '#FFFFFF' }: { position?: 'top' | 'bottom'; color?: string }) {
  const teeth = 28;
  let d = position === 'top' ? 'M0,10 ' : 'M0,0 ';
  for (let i = 0; i < teeth; i++) {
    const x1 = (i + 0.5) * (100 / teeth);
    const x2 = (i + 1) * (100 / teeth);
    if (position === 'top') {
      d += `L${x1},0 L${x2},10 `;
    } else {
      d += `L${x1},10 L${x2},0 `;
    }
  }
  if (position === 'top') {
    d += 'L100,10 L0,10 Z';
  } else {
    d += 'L100,0 L0,0 Z';
  }

  return (
    <View style={styles.tornEdgeContainer}>
      <Svg height="10" width="100%" viewBox="0 0 100 10" preserveAspectRatio="none">
        <Path d={d} fill={color} />
      </Svg>
    </View>
  );
}

export function FairValueReceipt({
  receipt,
  onClose,
  onRaiseDispute,
  showActions = true,
  style,
}: FairValueReceiptProps) {
  const receiptRef = useRef<React.ElementRef<typeof View>>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showJourneyModal, setShowJourneyModal] = useState(false);

  const formattedDate = new Date(receipt.issuedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleShare = async () => {
    try {
      setIsSharing(true);
      if (!receiptRef.current) {
        Alert.alert('Error', 'Receipt view not ready for capture.');
        setIsSharing(false);
        return;
      }

      const uri = await captureRef(receiptRef, {
        format: 'png',
        quality: 0.95,
        result: 'tmpfile',
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `CIRCULO Fair Value Receipt — ${receipt.receiptNumber}`,
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Receipt Captured', `Saved image to: ${uri}`);
      }
    } catch (error) {
      Alert.alert('Share Failed', (error as Error).message || 'Could not export receipt image.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={[styles.outerWrapper, style]}>
      {/* Captured Receipt Container */}
      <View
        ref={receiptRef}
        collapsable={false}
        style={styles.paperReceipt}
      >
        {/* Top Torn Edge */}
        <TornPaperEdge position="top" color="#FFFFFF" />

        <View style={styles.receiptContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.brandIconCircle}>
                <Ionicons name="leaf" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.brandName}>CIRCULO</Text>
            </View>

            <Text style={styles.receiptTitle}>FAIR VALUE RECEIPT</Text>
            <Text style={styles.receiptSubtitle}>CIRCULARITY PASSPORT</Text>
            <Text style={styles.receiptNumber}>№ {receipt.receiptNumber}</Text>
            <Text style={styles.receiptDate}>{formattedDate}</Text>
          </View>

          {/* Dotted Perforation Line */}
          <View style={styles.perforatedLine} />

          {/* Chain of Custody */}
          <View style={styles.chainSection}>
            <Text style={styles.sectionLabel}>CHAIN OF CUSTODY</Text>
            <View style={styles.chainRow}>
              <View style={styles.chainNode}>
                <Text style={styles.nodeRole}>ORIGIN</Text>
                <Text style={styles.nodeName} numberOfLines={1}>{receipt.householdName ?? 'Household'}</Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color={Colors.gray400} />
              <View style={styles.chainNode}>
                <Text style={styles.nodeRole}>COLLECTOR</Text>
                <Text style={styles.nodeName} numberOfLines={1}>{receipt.pickerName ?? 'Meena Devi'}</Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color={Colors.gray400} />
              <View style={styles.chainNode}>
                <Text style={styles.nodeRole}>DESTINATION</Text>
                <Text style={styles.nodeName} numberOfLines={1}>{receipt.destinationName ?? 'MRF Facility'}</Text>
              </View>
            </View>
          </View>

          {/* Core Metrics Box */}
          <View style={styles.metricsBox}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>MATERIAL</Text>
              <Text style={styles.metricValue}>{receipt.material.toUpperCase()}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>MEASURED WEIGHT</Text>
              <Text style={styles.metricValue}>{receipt.measuredKg.toFixed(2)} kg</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>AGREED RATE</Text>
              <Text style={styles.metricValue}>₹{receipt.ratePerKg.toFixed(2)}/kg</Text>
            </View>
          </View>

          {/* Dotted Perforation Line */}
          <View style={styles.perforatedLine} />

          {/* Itemized Line Items */}
          <View style={styles.lineItemsSection}>
            <View style={styles.lineItemHeaderRow}>
              <Text style={styles.lineItemHeaderText}>ITEM SPECIFICATION</Text>
              <Text style={styles.lineItemHeaderText}>AMOUNT (INR)</Text>
            </View>

            {receipt.lineItems.map((item, idx) => {
              const isDeduction = item.amount < 0 || item.isDeduction;
              return (
                <View key={idx} style={styles.lineItemRow}>
                  <View style={styles.lineItemLeft}>
                    <Text style={[styles.lineItemLabel, isDeduction && styles.deductionText]}>
                      {item.label}
                    </Text>
                    {item.reason && (
                      <Text style={styles.deductionReason}>Note: {item.reason}</Text>
                    )}
                  </View>
                  <Text style={[styles.lineItemAmount, isDeduction && styles.deductionAmount]}>
                    {isDeduction ? `- ₹${Math.abs(item.amount).toFixed(2)}` : `₹${item.amount.toFixed(2)}`}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Double Perforated Line */}
          <View style={styles.doublePerforatedLine}>
            <View style={styles.perforatedLine} />
            <View style={[styles.perforatedLine, { marginTop: 3 }]} />
          </View>

          {/* Total Value */}
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>TOTAL FAIR VALUE</Text>
              <Text style={styles.totalSub}>Agreed rate × Verified weight</Text>
            </View>
            <Text style={styles.totalAmount}>₹{receipt.total.toFixed(2)}</Text>
          </View>

          {/* Payment Status & Destination */}
          <View style={styles.settlementSection}>
            <View style={styles.settlementRow}>
              <Text style={styles.settleLabel}>Payment Status:</Text>
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#1B5E20" />
                <Text style={styles.statusBadgeText}>
                  {receipt.paymentStatus === 'cleared_upi_simulated'
                    ? 'Cleared (UPI, simulated)'
                    : 'Pending Settlement'}
                </Text>
              </View>
            </View>

            <View style={styles.settlementRow}>
              <Text style={styles.settleLabel}>Destination MRF:</Text>
              <Text style={styles.destinationText} numberOfLines={1}>
                {receipt.destinationName ?? 'City Center Recycler'}
              </Text>
            </View>

            <View style={styles.settlementRow}>
              <Text style={styles.settleLabel}>Audit Passport ID:</Text>
              <Text style={styles.hashText}>CRC-PASSPORT-2026-X88</Text>
            </View>
          </View>

          {/* Dispute Status Card if applicable */}
          {(receipt.disputeStatus === 'under_review' || receipt.disputeStatus === 'open') && (
            <View style={styles.disputeStatusCard}>
              <Ionicons name="alert-circle" size={16} color="#E65100" />
              <View style={{ flex: 1 }}>
                <Text style={styles.disputeStatusTitle}>Active Dispute Under Review</Text>
                <Text style={styles.disputeStatusSub}>Case assigned to Municipal Administrator for side-by-side arbitration.</Text>
              </View>
            </View>
          )}

          {receipt.disputeStatus === 'resolved' && (
            <View style={[styles.disputeStatusCard, { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.disputeStatusTitle, { color: '#2E7D32' }]}>Dispute Resolved by Admin</Text>
                <Text style={styles.disputeStatusSub}>Settlement reconciled and audited in Shared Record Layer.</Text>
              </View>
            </View>
          )}

          {/* Barcode / Stamp */}
          <View style={styles.stampBox}>
            <View style={styles.barcodeLines}>
              {[12, 4, 8, 16, 6, 14, 20, 5, 10, 18, 7, 15, 9, 12, 6, 18, 8, 14, 22, 5, 11].map((h, i) => (
                <View key={i} style={[styles.barcodeBar, { width: (i % 3 === 0 ? 3 : 1.5) }]} />
              ))}
            </View>
            <Text style={styles.stampCaption}>IMMUTABLE SHARED RECORD LAYER</Text>
          </View>

          {/* Footer Motto */}
          <View style={styles.footer}>
            <Text style={styles.mottoText}>"From Waste to New Possibilities"</Text>
            <Text style={styles.footerSub}>Zero Silent Deductions • Fair Value for Informal Workers</Text>
          </View>
        </View>

        {/* Bottom Torn Edge */}
        <TornPaperEdge position="bottom" color="#FFFFFF" />
      </View>

      {/* Action Buttons */}
      {showActions && (
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShare}
            disabled={isSharing}
            activeOpacity={0.8}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>Share Receipt Image</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.journeyBtn}
            onPress={() => setShowJourneyModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="git-network-outline" size={18} color="#1B5E20" />
            <Text style={styles.journeyBtnText}>View Material Journey Timeline</Text>
          </TouchableOpacity>

          {onRaiseDispute && (
            (receipt.disputeStatus === 'under_review' || receipt.disputeStatus === 'open') ? (
              <View style={styles.disputeBtnDisabled}>
                <Ionicons name="time-outline" size={18} color="#E65100" />
                <Text style={styles.disputeBtnTextDisabled}>Dispute Under Review ⚠️</Text>
              </View>
            ) : receipt.disputeStatus === 'resolved' ? (
              <View style={styles.disputeBtnResolved}>
                <Ionicons name="checkmark-done-circle" size={18} color="#2E7D32" />
                <Text style={styles.disputeBtnTextResolved}>Dispute Arbitrated & Resolved ✅</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.disputeBtn}
                onPress={() => onRaiseDispute(receipt)}
                activeOpacity={0.8}
              >
                <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
                <Text style={styles.disputeBtnText}>Raise a Dispute</Text>
              </TouchableOpacity>
            )
          )}

          {onClose && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Material Journey Timeline Modal */}
      <JourneyTimelineModal
        visible={showJourneyModal}
        onClose={() => setShowJourneyModal(false)}
        receipt={receipt}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: Spacing[2],
  },
  paperReceipt: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  tornEdgeContainer: {
    width: '100%',
    height: 10,
    backgroundColor: 'transparent',
  },
  receiptContent: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    paddingBottom: Spacing[3],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1.5],
    marginBottom: Spacing[1],
  },
  brandIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.mintPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  receiptTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  receiptSubtitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginTop: 1,
  },
  receiptNumber: {
    fontSize: FontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginTop: Spacing[1.5],
  },
  receiptDate: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  perforatedLine: {
    width: '100%',
    height: 1,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderStyle: 'dashed',
    marginVertical: Spacing[2],
  },
  doublePerforatedLine: {
    marginVertical: Spacing[2],
  },
  chainSection: {
    paddingVertical: Spacing[1],
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing[1.5],
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: Spacing[2],
    borderRadius: BorderRadius.sm,
  },
  chainNode: {
    flex: 1,
    alignItems: 'center',
  },
  nodeRole: {
    fontSize: 8,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  nodeName: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.mintPale,
    borderRadius: BorderRadius.md,
    padding: Spacing[2.5],
    marginVertical: Spacing[1],
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(27, 94, 32, 0.2)',
  },
  lineItemsSection: {
    paddingVertical: Spacing[1],
  },
  lineItemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    marginBottom: Spacing[1],
  },
  lineItemHeaderText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing[1],
  },
  lineItemLeft: {
    flex: 1,
    paddingRight: Spacing[2],
  },
  lineItemLabel: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  deductionText: {
    color: Colors.error,
  },
  deductionReason: {
    fontSize: 10,
    color: Colors.error,
    fontStyle: 'italic',
    marginTop: 1,
  },
  lineItemAmount: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  deductionAmount: {
    color: Colors.error,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[1.5],
  },
  totalLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  totalSub: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  totalAmount: {
    fontSize: FontSize['2xl'],
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
  },
  settlementSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: BorderRadius.sm,
    padding: Spacing[2.5],
    gap: Spacing[1.5],
    marginVertical: Spacing[2],
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settleLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.mintPale,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
  },
  destinationText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    maxWidth: 200,
  },
  hashText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.textSecondary,
  },
  stampBox: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
    gap: 4,
  },
  barcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    gap: 3,
  },
  barcodeBar: {
    height: '100%',
    backgroundColor: '#374151',
    borderRadius: 0.5,
  },
  stampCaption: {
    fontSize: 8,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.2,
    color: Colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
    gap: 2,
  },
  mottoText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    fontStyle: 'italic',
    color: Colors.primary,
  },
  footerSub: {
    fontSize: 8,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionsBar: {
    width: '100%',
    maxWidth: 390,
    marginTop: Spacing[3],
    gap: Spacing[2],
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primary,
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
    minHeight: 48,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  journeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
    borderWidth: 1,
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
    minHeight: 48,
  },
  journeyBtnText: {
    color: '#1B5E20',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  disputeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.md,
    minHeight: 46,
  },
  disputeBtnText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  disputeBtnDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.md,
    minHeight: 46,
  },
  disputeBtnTextDisabled: {
    color: '#E65100',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  disputeBtnResolved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    paddingVertical: Spacing[2.5],
    borderRadius: BorderRadius.md,
    minHeight: 46,
  },
  disputeBtnTextResolved: {
    color: '#2E7D32',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  disputeStatusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFB74D',
    borderRadius: BorderRadius.sm,
    padding: Spacing[2.5],
    marginHorizontal: Spacing[4],
    marginTop: Spacing[3],
    gap: Spacing[2],
  },
  disputeStatusTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#E65100',
  },
  disputeStatusSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2.5],
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
