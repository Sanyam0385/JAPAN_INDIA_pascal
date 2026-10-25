// Sell Recyclables Screen
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/appStore';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow, TAB_BAR_HEIGHT, MATERIAL_CATEGORIES } from '../../src/constants';
import { Card, Badge } from '../../src/components/ui';
import { FairValueReceiptModal } from '../../src/components/shared';
import { LocationStatusBadge } from '../../src/components/location/LocationStatusBadge';
import { LiveRouteTracker } from '../../src/components/location/LiveRouteTracker';
import { DEMO_MATERIAL_PRICE_RANGES } from '../../src/lib/demo/demoData';
import { useUserLocation } from '../../src/lib/location/useUserLocation';
import type { MaterialCategory, Receipt, PickupJob } from '../../src/types';

const STATUS_CHIP_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  listed: { label: 'Listed in Marketplace', bg: '#E3F2FD', text: '#1565C0', icon: 'list-outline' },
  rate_proposed: { label: 'Rate Proposed', bg: '#FFF3E0', text: '#E65100', icon: 'chatbubbles-outline' },
  rate_locked: { label: 'Rate Locked', bg: '#E8F5E9', text: '#1B5E20', icon: 'lock-closed' },
  claimed: { label: 'Collector Assigned', bg: '#E0F2F1', text: '#00695C', icon: 'bicycle-outline' },
  en_route: { label: 'Collector En Route', bg: '#FFF8E1', text: '#F57F17', icon: 'navigate-outline' },
  weighed: { label: 'Weighed at Doorstep', bg: '#EDE7F6', text: '#512DA8', icon: 'scale-outline' },
  handed_to_recycler: { label: 'In Transit to Recycler', bg: '#F3E5F5', text: '#7B1FA2', icon: 'business-outline' },
  completed: { label: 'Settled & Cleared', bg: '#E8F5E9', text: '#2E7D32', icon: 'checkmark-circle-outline' },
  disputed: { label: 'Quality Dispute / Contaminated', bg: '#FFEBEE', text: '#C62828', icon: 'alert-circle-outline' },
};

const PICKUP_WINDOWS = [
  '7:00 AM – 9:00 AM',
  '9:00 AM – 11:00 AM',
  '11:00 AM – 1:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
];

const UNITS = ['kg', 'pieces', 'bags', 'boxes'];

export default function RecycleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const {
    recyclingRequests, createRecyclingRequest, cancelRequest, receipts,
    pickupJobs, createPickupJob, respondToRateOffer, rateOffers, disputes,
  } = useAppStore();
  const { user } = useAuthStore();

  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Rate Review Modal state
  const [reviewJob, setReviewJob] = useState<PickupJob | null>(null);
  const [householdCounterInput, setHouseholdCounterInput] = useState<string>('');
  const [qrModalJob, setQrModalJob] = useState<PickupJob | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialCategory | null>(null);
  const { locality, wardName, displayLocation, isDemoUser } = useUserLocation();
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [pickupWindow, setPickupWindow] = useState('');
  const [address, setAddress] = useState(
    locality || (isDemoUser ? '42, 5th Cross, Koramangala 4th Block, Bengaluru' : '')
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { hydrateJobs } = useAppStore();

  useEffect(() => {
    hydrateJobs();
  }, []);

  useEffect(() => {
    if (locality && (!address || (address.includes('Koramangala') && !isDemoUser))) {
      setAddress(locality);
    }
  }, [locality, isDemoUser]);

  // Filter household jobs from the Shared Record Layer
  const myJobs = pickupJobs.filter(j =>
    j.householdId === 'hh-1' || j.householdId === user?.id || j.householdId === 'demo-household-1' || j.householdName === user?.name
  );
  const displayJobs = myJobs.length > 0 ? myJobs : pickupJobs.slice(0, 6);

  const priceRange = selectedMaterial
    ? DEMO_MATERIAL_PRICE_RANGES[selectedMaterial as keyof typeof DEMO_MATERIAL_PRICE_RANGES]
    : null;

  const estPrice = priceRange && quantity
    ? {
        min: Math.round(priceRange.min * parseFloat(quantity || '0')),
        max: Math.round(priceRange.max * parseFloat(quantity || '0')),
      }
    : null;

  const handleSubmit = () => {
    if (!selectedMaterial || !quantity || !pickupWindow || !address) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    const qty = parseFloat(quantity);
    const range = DEMO_MATERIAL_PRICE_RANGES[selectedMaterial as keyof typeof DEMO_MATERIAL_PRICE_RANGES] ?? { min: 5, max: 15 };
    const proposedRate = Math.round((range.min + range.max) / 2);

    const userWard = user?.wardName || user?.locality || wardName || 'Ward 151';
    const userCityKey = user?.cityKey || 'BLR';

    // Create in Shared Record Layer with user's real profile ward and city key
    const jobId = createPickupJob({
      householdId: user?.id || 'hh-1',
      householdName: user?.name || (isDemoUser ? 'Priya Sharma' : 'Household User'),
      householdAddress: address,
      material: selectedMaterial,
      estimatedKg: qty,
      status: 'listed',
      proposedRatePerKg: proposedRate,
      window: pickupWindow,
      pickupWindow,
      ward: userWard,
      cityKey: userCityKey,
      lat: user?.lat,
      lng: user?.lng,
      location: {
        ward: userWard,
        address,
        distanceKm: 1.2,
      },
    });

    // Also mirror to legacy requests
    createRecyclingRequest({
      householdId: user?.id || 'hh-1',
      householdName: user?.name || 'Priya Sharma',
      materialCategory: selectedMaterial,
      approximateQuantityKg: qty,
      quantityUnit: unit,
      status: 'open',
      pickupAddress: address,
      preferredPickupWindow: pickupWindow,
      estimatedPriceMin: Math.round(range.min * qty),
      estimatedPriceMax: Math.round(range.max * qty),
      notes,
    });

    setSubmitting(false);
    setShowForm(false);
    setSelectedMaterial(null);
    setQuantity('');
    setPickupWindow('');
    setNotes('');
    Alert.alert('Recyclables Listed ✅', `Your ${qty} kg of ${selectedMaterial.toUpperCase()} has been published to the verified picker marketplace at ₹${proposedRate}/kg asking rate.`);
  };

  const handleOpenReview = (job: PickupJob) => {
    setReviewJob(job);
    setHouseholdCounterInput(String(job.proposedRatePerKg ?? 15));
  };

  const handleAcceptPickerOffer = () => {
    if (!reviewJob) return;
    const rate = reviewJob.proposedRatePerKg ?? 15;
    respondToRateOffer(reviewJob.id, 'accept', rate);
    setReviewJob(null);
    Alert.alert('Rate Locked! 🔒', `Rate locked at ₹${rate.toFixed(2)}/kg. The collector will weigh at your doorstep using this tariff.`);
  };

  const handleSendHouseholdCounter = () => {
    if (!reviewJob) return;
    const counterRate = parseFloat(householdCounterInput);
    if (isNaN(counterRate) || counterRate <= 0) {
      Alert.alert('Invalid Rate', 'Please enter a valid rate per kg.');
      return;
    }

    const latestOffer = rateOffers.find(o => o.jobId === reviewJob.id);
    if (latestOffer?.counterOffer) {
      Alert.alert('Limit Reached', 'Only 1 counter-offer is permitted per transaction to maintain transparency.');
      return;
    }

    respondToRateOffer(reviewJob.id, 'counter', counterRate);
    setReviewJob(null);
    Alert.alert('Counter-Offer Sent 💬', `Counter-offer of ₹${counterRate.toFixed(2)}/kg sent to collector. Waiting for confirmation.`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>♻️ {t('recycle.title', 'Sell Recyclables')}</Text>
          <Text style={styles.subtitle}>{t('recycle.sellInstructions', 'Track circular handoffs, lock rates & view verified receipts')}</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={Colors.textInverse} />
          <Text style={styles.newBtnText}>{t('recycle.newRequest', 'New')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + Spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Fair Value Guarantee Banner */}
        <Card variant="filled" style={styles.disclaimer}>
          <View style={styles.disclaimerRow}>
            <Ionicons name="shield-checkmark" size={20} color="#1B5E20" />
            <View style={{ flex: 1 }}>
              <Text style={styles.disclaimerTitle}>Verified Circularity Guarantee</Text>
              <Text style={styles.disclaimerText}>
                {t('recycle.priceDisclaimer', "Every pickup is tracked through CIRCULO's Shared Record Layer. Rates are agreed and locked before doorstep weighing.")}
              </Text>
            </View>
          </View>
        </Card>

        {/* Shared Record Layer Handoff Tracker */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('recycle.myRequests', 'Recyclable Handoffs Tracker')}</Text>
          <Text style={styles.sectionSubtitle}>End-to-end audit trail from your home to registered MRFs</Text>
        </View>

        {displayJobs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>📭 {t('common.noResults', 'No active handoffs')}</Text>
            <Text style={styles.emptySubText}>{t('recycle.sellInstructions', 'Tap "+ New" to list your recyclable items for pickup')}</Text>
          </Card>
        ) : (
          displayJobs.map(job => {
            const mat = MATERIAL_CATEGORIES.find(m => m.id === job.material.toLowerCase());
            const rate = job.lockedRatePerKg ?? job.proposedRatePerKg ?? 15;
            const chip = STATUS_CHIP_CONFIG[job.status] || STATUS_CHIP_CONFIG.listed;
            const matchingReceipt = receipts.find(r => r.jobId === job.id) ||
              (job.status === 'completed' || job.status === 'weighed' ? receipts[0] : null);

            return (
              <Card key={job.id} style={styles.reqCard}>
                {/* Header: Icon, Material, Status Chip */}
                <View style={styles.reqHeader}>
                  <View style={styles.reqLeft}>
                    <Text style={styles.reqIcon}>{mat?.icon ?? '♻️'}</Text>
                    <View>
                      <Text style={styles.reqMat}>{t('materials.' + (mat?.id || job.material.toLowerCase()), mat?.label ?? job.material.toUpperCase())}</Text>
                      <Text style={styles.reqQty}>{job.estimatedKg} kg (estimated)</Text>
                    </View>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
                    <Ionicons name={chip.icon} size={12} color={chip.text} />
                    <Text style={[styles.statusChipText, { color: chip.text }]}>{t('status.' + job.status, chip.label)}</Text>
                  </View>
                </View>

                {/* Rate & Payout Row */}
                <View style={styles.rateHighlightBox}>
                  <View style={styles.rateCol}>
                    <Text style={styles.rateLabel}>
                      {job.status === 'rate_locked' ? 'LOCKED RATE' : 'CURRENT TARIFF'}
                    </Text>
                    <Text style={[styles.rateValue, job.status === 'rate_locked' && { color: '#1B5E20' }]}>
                      ₹{rate.toFixed(2)}/kg
                    </Text>
                  </View>
                  <View style={styles.rateDivider} />
                  <View style={styles.rateCol}>
                    <Text style={styles.rateLabel}>ESTIMATED PAYOUT</Text>
                    <Text style={styles.ratePayout}>
                      ₹{(rate * job.estimatedKg).toFixed(0)}
                    </Text>
                  </View>
                </View>

                {/* Details list */}
                <View style={styles.reqDetails}>
                  <Text style={styles.reqDetail}>📍 {job.location.ward} • {job.location.address || job.householdAddress}</Text>
                  <Text style={styles.reqDetail}>⏰ Pickup Window: {job.window}</Text>
                  {job.pickerName && (
                    <Text style={[styles.reqDetail, { color: Colors.primary, fontWeight: '600' }]}>
                      👤 Accredited Collector: {job.pickerName}
                    </Text>
                  )}
                  {job.status === 'rate_locked' && (
                    <Text style={[styles.reqDetail, { color: '#1B5E20', fontWeight: '600' }]}>
                      🔒 Rate locked — guaranteed minimum per kg at scale.
                    </Text>
                  )}
                  {job.status === 'en_route' && (
                    <LiveRouteTracker
                      jobId={job.id}
                      pickerName={job.pickerName || 'Lakshmi Bai'}
                      initialDistanceKm={job.location?.distanceKm ?? 1.2}
                    />
                  )}
                  {(() => {
                    const jobDispute = disputes.find(d => d.jobId === job.id || d.id === job.disputeId);
                    if (!jobDispute && job.status !== 'disputed') return null;

                    const isResolved = jobDispute?.status === 'resolved';

                    return (
                      <View style={[styles.disputeNotice, isResolved && styles.disputeNoticeResolved]}>
                        <Ionicons
                          name={isResolved ? 'checkmark-circle' : 'alert-circle'}
                          size={16}
                          color={isResolved ? '#2E7D32' : '#C62828'}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.disputeNoticeTitle, isResolved && styles.disputeNoticeTitleResolved]}>
                            {isResolved ? 'Dispute Resolved & Arbitrated' : 'Active Dispute Under Review'}
                          </Text>
                          <Text style={styles.disputeNoticeText}>
                            {isResolved
                              ? (jobDispute?.resolution ?? 'Arbitration completed by Municipal Administrator.')
                              : (jobDispute?.notes ?? 'Discrepancy submitted for neutral municipal supervisor review.')}
                          </Text>
                          {isResolved && jobDispute?.adjustedTotal !== undefined && (
                            <Text style={styles.disputeResolvedTotal}>
                              Reconciled Payout: ₹{jobDispute.adjustedTotal.toFixed(2)}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })()}
                </View>

                {/* Action: Rate Proposed -> Review Offer Button */}
                {job.status === 'rate_proposed' && (
                  <TouchableOpacity
                    style={styles.reviewOfferBtn}
                    onPress={() => handleOpenReview(job)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
                    <Text style={styles.reviewOfferBtnText}>
                      Review Collector Offer (₹{rate.toFixed(2)}/kg)
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Action: Rate Locked or Accepted -> Show Handoff QR Code */}
                {['rate_locked', 'accepted', 'en_route'].includes(job.status) && (
                  <TouchableOpacity
                    style={styles.showQrBtn}
                    onPress={() => setQrModalJob(job)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.showQrBtnText}>Show Doorstep Handoff QR Code</Text>
                  </TouchableOpacity>
                )}

                {/* Action: Weighed / Handed / Completed -> View Fair Value Receipt */}
                {matchingReceipt && ['completed', 'weighed', 'handed_to_recycler'].includes(job.status) && (
                  <TouchableOpacity
                    style={styles.receiptBtn}
                    onPress={() => setSelectedReceipt(matchingReceipt)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="receipt-outline" size={16} color={Colors.primary} />
                    <Text style={styles.receiptBtnText}>View Fair Value Receipt</Text>
                  </TouchableOpacity>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Household Rate Review Modal */}
      <Modal visible={!!reviewJob} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalSheet}>
            <View style={styles.reviewModalHeader}>
              <View>
                <Text style={styles.reviewModalTitle}>Review Collector Rate Offer</Text>
                <Text style={styles.reviewModalSubtitle}>Lock the rate before doorstep collection</Text>
              </View>
              <TouchableOpacity onPress={() => setReviewJob(null)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {reviewJob && (() => {
              const latestOffer = rateOffers.find(o => o.jobId === reviewJob.id);
              const hasCounterOffer = !!latestOffer?.counterOffer;
              const currentRate = reviewJob.proposedRatePerKg ?? 15;

              return (
                <View style={styles.reviewModalBody}>
                  <View style={styles.offerCardHighlight}>
                    <Text style={styles.offerCardTag}>COLLECTOR PROPOSED RATE</Text>
                    <Text style={styles.offerCardRate}>₹{currentRate.toFixed(2)} / kg</Text>
                    <Text style={styles.offerCardTotal}>
                      Est. Total Payout: ₹{(currentRate * reviewJob.estimatedKg).toFixed(2)}
                    </Text>
                    <Text style={styles.offerCardSub}>
                      For {reviewJob.estimatedKg} kg of {reviewJob.material.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.limitBox}>
                    <Ionicons name="information-circle" size={16} color={Colors.primary} />
                    <Text style={styles.limitBoxText}>
                      {hasCounterOffer
                        ? '1 counter-offer limit reached. Accept rate to lock or decline.'
                        : 'You can accept this offer to lock the rate, or submit 1 counter-offer.'}
                    </Text>
                  </View>

                  {!hasCounterOffer && (
                    <View style={styles.counterGroup}>
                      <Text style={styles.counterGroupLabel}>Your Counter Rate (₹/kg):</Text>
                      <TextInput
                        style={styles.counterInputField}
                        keyboardType="numeric"
                        value={householdCounterInput}
                        onChangeText={setHouseholdCounterInput}
                        placeholder="e.g. 15.50"
                      />
                    </View>
                  )}

                  <View style={styles.reviewActions}>
                    <TouchableOpacity
                      style={styles.acceptRateBtn}
                      onPress={handleAcceptPickerOffer}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                      <Text style={styles.acceptRateBtnText}>
                        Accept & Lock Rate at ₹{currentRate.toFixed(2)}/kg
                      </Text>
                    </TouchableOpacity>

                    {!hasCounterOffer && (
                      <TouchableOpacity
                        style={styles.counterRateBtn}
                        onPress={handleSendHouseholdCounter}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="send" size={15} color={Colors.primary} />
                        <Text style={styles.counterRateBtnText}>Send Counter-Offer</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Fair Value Receipt Modal */}
      <FairValueReceiptModal
        receipt={selectedReceipt}
        visible={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* New Request Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Recycling Request</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Ionicons name="close" size={26} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Material */}
            <Text style={styles.fieldLabel}>Material Category *</Text>
            <View style={styles.materialGrid}>
              {MATERIAL_CATEGORIES.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.matChip,
                    selectedMaterial === m.id && { backgroundColor: m.color + '20', borderColor: m.color },
                  ]}
                  onPress={() => setSelectedMaterial(m.id as MaterialCategory)}
                >
                  <Text style={styles.matIcon}>{m.icon}</Text>
                  <Text style={[styles.matLabel, selectedMaterial === m.id && { color: m.color }]}>
                    {m.label.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price estimate preview */}
            {priceRange && (
              <View style={styles.pricePreview}>
                <Text style={styles.pricePreviewText}>
                  📊 Market rate estimate: ₹{priceRange.min}–₹{priceRange.max} per kg
                </Text>
                <Text style={styles.pricePreviewNote}>(Estimate only — final rate locked before collection)</Text>
              </View>
            )}

            {/* Quantity */}
            <Text style={styles.fieldLabel}>Approximate Quantity *</Text>
            <View style={styles.qtyRow}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="e.g. 5"
                placeholderTextColor={Colors.textTertiary}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
              />
              <View style={styles.unitSelector}>
                {UNITS.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, unit === u && styles.unitChipActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Total estimate */}
            {estPrice && estPrice.min > 0 && (
              <View style={styles.totalEst}>
                <Text style={styles.totalEstText}>
                  Estimated total: ₹{estPrice.min} – ₹{estPrice.max}
                </Text>
                <Text style={styles.totalEstNote}>Estimate — rate locked with collector before pickup</Text>
              </View>
            )}

            {/* Pickup window */}
            <Text style={styles.fieldLabel}>Preferred Pickup Window *</Text>
            <View style={styles.windowList}>
              {PICKUP_WINDOWS.map(w => (
                <TouchableOpacity
                  key={w}
                  style={[styles.windowChip, pickupWindow === w && styles.windowChipActive]}
                  onPress={() => setPickupWindow(w)}
                >
                  <Text style={[styles.windowText, pickupWindow === w && styles.windowTextActive]}>⏰ {w}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Address */}
            <Text style={styles.fieldLabel}>Pickup Address *</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Enter pickup address"
              placeholderTextColor={Colors.textTertiary}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />

            {/* Notes */}
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="e.g. Items are bundled and kept near gate"
              placeholderTextColor={Colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />

            {/* Photo note */}
            <View style={styles.photoNote}>
              <Ionicons name="camera-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.photoNoteText}>
                Photo upload requires a development build (not available in Expo Go)
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Submitting...' : '✅ Post to Marketplace'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.submitDisclaimer}>
              By submitting, this listing is registered on the municipal Shared Record Layer.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Doorstep Handoff QR Modal */}
      <Modal visible={!!qrModalJob} transparent animationType="slide" onRequestClose={() => setQrModalJob(null)}>
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalCard}>
            <View style={styles.qrModalHeader}>
              <View>
                <Text style={styles.qrModalTitle}>Doorstep Handoff QR</Text>
                <Text style={styles.qrModalSubtitle}>Job #{qrModalJob?.id.slice(-6).toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => setQrModalJob(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Simulated QR Code Graphic */}
            <View style={styles.qrCodeContainer}>
              <View style={styles.qrPatternGrid}>
                <Ionicons name="qr-code" size={170} color="#1B5E20" />
              </View>
              <View style={styles.pinBadge}>
                <Text style={styles.pinText}>VERIFICATION PIN: 7492</Text>
              </View>
            </View>

            <View style={styles.qrJobSummary}>
              <Text style={styles.qrMaterialText}>
                {qrModalJob?.estimatedKg} kg · {qrModalJob?.material.toUpperCase()}
              </Text>
              <Text style={styles.qrRateText}>
                Agreed Rate: ₹{qrModalJob?.lockedRatePerKg ?? qrModalJob?.proposedRatePerKg ?? 15}/kg
              </Text>
              <Text style={styles.qrNote}>
                Present this QR code or PIN to the municipal collector upon doorstep arrival to seal the chain of custody.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.qrDoneBtn}
              onPress={() => setQrModalJob(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.qrDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing[5], paddingBottom: Spacing[3],
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[1],
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
  },
  newBtnText: { color: Colors.textInverse, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  content: { padding: Spacing[4], gap: Spacing[3] },
  disclaimer: { backgroundColor: '#F1F8E9', borderColor: '#C5E1A5' },
  disclaimerRow: { flexDirection: 'row', gap: Spacing[2.5], alignItems: 'center' },
  disclaimerTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#1B5E20' },
  disclaimerText: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18, marginTop: 2 },
  sectionHeader: { marginTop: Spacing[1], marginBottom: 2 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing[8] },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary, marginBottom: Spacing[1] },
  emptySubText: { fontSize: FontSize.sm, color: Colors.textTertiary },
  reqCard: { gap: Spacing[2.5], padding: Spacing[4] },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reqLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flex: 1 },
  reqIcon: { fontSize: 32 },
  reqMat: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  reqQty: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[2.5],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusChipText: { fontSize: 11, fontWeight: FontWeight.bold },
  rateHighlightBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    alignItems: 'center',
  },
  rateCol: { flex: 1, alignItems: 'center' },
  rateLabel: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5 },
  rateValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 2 },
  rateDivider: { width: 1, height: 24, backgroundColor: Colors.border },
  ratePayout: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary, marginTop: 2 },
  reqDetails: { gap: 4 },
  reqDetail: { fontSize: FontSize.xs, color: Colors.textSecondary },
  disputeNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: BorderRadius.md,
    padding: Spacing[2.5],
    gap: Spacing[2],
    marginTop: Spacing[1],
  },
  disputeNoticeResolved: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  disputeNoticeTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#C62828',
  },
  disputeNoticeTitleResolved: {
    color: '#2E7D32',
  },
  disputeNoticeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginTop: 1,
  },
  disputeResolvedTotal: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#2E7D32',
    marginTop: 3,
  },
  reviewOfferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.pickerAccent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    marginTop: Spacing[1],
  },
  reviewOfferBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.mintPale,
    borderWidth: 1,
    borderColor: Colors.mint,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[2.5],
    marginTop: Spacing[1],
  },
  receiptBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },

  // Review Modal
  reviewModalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing[5],
    maxHeight: '90%',
  },
  reviewModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing[3],
  },
  reviewModalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  reviewModalSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  reviewModalBody: { gap: Spacing[3] },
  offerCardHighlight: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    padding: Spacing[4],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: 3,
  },
  offerCardTag: { fontSize: 10, fontWeight: FontWeight.bold, color: '#B78103', letterSpacing: 0.5 },
  offerCardRate: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.pickerAccent },
  offerCardTotal: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  offerCardSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  limitBox: {
    flexDirection: 'row',
    gap: Spacing[2],
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  limitBoxText: { fontSize: 11, color: Colors.textSecondary, flex: 1, lineHeight: 16 },
  counterGroup: { gap: Spacing[1] },
  counterGroupLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  counterInputField: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  reviewActions: { gap: Spacing[2], marginTop: Spacing[2] },
  acceptRateBtn: {
    minHeight: 52,
    backgroundColor: '#1B5E20',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  acceptRateBtnText: { color: '#FFFFFF', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  counterRateBtn: {
    minHeight: 50,
    backgroundColor: Colors.mintPale,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.mint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  counterRateBtnText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // New Request Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing[5], borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalContent: { padding: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[12] },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  materialGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  matChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[1],
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    backgroundColor: Colors.surface,
  },
  matIcon: { fontSize: 18 },
  matLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  pricePreview: {
    backgroundColor: Colors.mintPale, borderRadius: BorderRadius.md,
    padding: Spacing[3], borderWidth: 1, borderColor: Colors.mint,
  },
  pricePreviewText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  pricePreviewNote: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  qtyRow: { flexDirection: 'row', gap: Spacing[3], alignItems: 'center' },
  unitSelector: { flex: 3, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[1] },
  unitChip: {
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.base, paddingHorizontal: Spacing[2], paddingVertical: Spacing[1],
  },
  unitChipActive: { borderColor: Colors.primary, backgroundColor: Colors.mintPale },
  unitText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  unitTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  totalEst: {
    backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.md, padding: Spacing[3],
    borderWidth: 1, borderColor: Colors.border,
  },
  totalEstText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  totalEstNote: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  windowList: { gap: Spacing[2] },
  windowChip: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingVertical: Spacing[3], paddingHorizontal: Spacing[4],
    backgroundColor: Colors.surface,
  },
  windowChipActive: { borderColor: Colors.primary, backgroundColor: Colors.mintPale },
  windowText: { fontSize: FontSize.base, color: Colors.textSecondary },
  windowTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    fontSize: FontSize.base, color: Colors.textPrimary,
  },
  multilineInput: { height: 72, textAlignVertical: 'top' },
  photoNote: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.md, padding: Spacing[3],
    borderWidth: 1, borderColor: Colors.border,
  },
  photoNoteText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4], alignItems: 'center',
    ...Shadow.base,
  },
  disabledBtn: { opacity: 0.6 },
  submitBtnText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  submitDisclaimer: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'center' },
  showQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: '#1B5E20',
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
    marginTop: Spacing[2],
  },
  showQrBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: Spacing[4],
  },
  qrModalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[5],
    alignItems: 'center',
    gap: Spacing[3],
    ...Shadow.lg,
  },
  qrModalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrModalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  qrModalSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F8E9',
    borderColor: '#C5E1A5',
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  qrPatternGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBadge: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
  },
  pinText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  qrJobSummary: {
    alignItems: 'center',
    gap: 4,
  },
  qrMaterialText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  qrRateText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  qrNote: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: Spacing[1],
  },
  qrDoneBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    marginTop: Spacing[1],
  },
  qrDoneBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  liveTrackingBanner: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginVertical: Spacing[1.5],
    gap: 4,
  },
  liveTrackingText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#1B5E20',
  },
  liveTrackingSub: {
    fontSize: FontSize.xs,
    color: '#2E7D32',
    lineHeight: 16,
  },
});
