// Modal wrapper for FairValueReceipt
import React from 'react';
import {
  Modal, View, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Receipt } from '../../types';
import { FairValueReceipt } from './FairValueReceipt';
import { RaiseDisputeModal } from './RaiseDisputeModal';
import { Spacing } from '../../constants';

interface FairValueReceiptModalProps {
  receipt: Receipt | null;
  visible: boolean;
  onClose: () => void;
  onRaiseDispute?: (receipt: Receipt) => void;
}

export function FairValueReceiptModal({
  receipt,
  visible,
  onClose,
  onRaiseDispute,
}: FairValueReceiptModalProps) {
  const insets = useSafeAreaInsets();
  const [disputeModalVisible, setDisputeModalVisible] = React.useState(false);

  if (!receipt) return null;

  const handleDisputePress = (r: Receipt) => {
    if (onRaiseDispute) {
      onRaiseDispute(r);
    } else {
      setDisputeModalVisible(true);
    }
  };

  return (
    <>
      <Modal
        visible={visible && !disputeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={[styles.modalOverlay, { paddingTop: insets.top + Spacing[2], paddingBottom: insets.bottom + Spacing[2] }]}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.floatingCloseBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close-circle" size={30} color="#374151" />
            </TouchableOpacity>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <FairValueReceipt
                receipt={receipt}
                onClose={onClose}
                onRaiseDispute={handleDisputePress}
                showActions
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <RaiseDisputeModal
        receipt={receipt}
        visible={disputeModalVisible}
        onClose={() => setDisputeModalVisible(false)}
        onSuccess={() => {
          setDisputeModalVisible(false);
          onClose();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: 'transparent',
    borderRadius: 8,
    position: 'relative',
  },
  floatingCloseBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
  },
});
