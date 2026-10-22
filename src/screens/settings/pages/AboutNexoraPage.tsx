import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AboutNexoraPageProps {
  onBack: () => void;
}

export const AboutNexoraPage: React.FC<AboutNexoraPageProps> = ({ onBack }) => {
  const [showLegalModal, setShowLegalModal] = useState<'terms' | 'privacy' | null>(null);

  return (
    <ScrollView
      testID="settings-page-aboutnexora"
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* App Branding Card */}
      <View style={styles.brandingCard}>
        <View style={styles.logoBadge}>
          <Ionicons name="sparkles" size={32} color="#00E5FF" />
        </View>
        <Text style={styles.brandTitle}>NEXORA AI</Text>
        <Text style={styles.brandSubtitle}>Intelligent Living Companion</Text>
        <View style={styles.versionTag}>
          <Text style={styles.versionText}>Version 1.0.0 (Production Stable)</Text>
        </View>
      </View>

      {/* Specifications Card */}
      <View style={styles.glassCard}>
        <View style={styles.headerRow}>
          <Ionicons name="hardware-chip-outline" size={20} color="#00E5FF" />
          <Text style={styles.cardTitle}>Runtime Architecture</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Package ID</Text>
          <Text style={styles.codeValue} selectable>com.nexora.ai</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>JavaScript Engine</Text>
          <Text style={styles.infoValue}>Hermes Bytecode</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Framework Core</Text>
          <Text style={styles.infoValue}>React Native 0.86 / Expo SDK 57</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Device Compatibility</Text>
          <Text style={styles.infoValue}>Universal (arm64, armeabi, x86_64)</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Memory Storage</Text>
          <Text style={styles.infoValue}>Encrypted Local Vault</Text>
        </View>
      </View>

      {/* Legal & Governance */}
      <View style={styles.glassCard}>
        <View style={styles.headerRow}>
          <Ionicons name="document-text-outline" size={20} color="#00E5FF" />
          <Text style={styles.cardTitle}>Governance & Compliance</Text>
        </View>

        <TouchableOpacity
          style={styles.legalBtn}
          onPress={() => setShowLegalModal('privacy')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Read Privacy Policy"
        >
          <View style={styles.legalBtnContent}>
            <Ionicons name="shield-outline" size={18} color="#00E5FF" />
            <Text style={styles.legalBtnText}>Privacy Policy & Airgap Protocol</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(0, 229, 255, 0.6)" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.legalBtn}
          onPress={() => setShowLegalModal('terms')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Read Terms of Service"
        >
          <View style={styles.legalBtnContent}>
            <Ionicons name="reader-outline" size={18} color="#00E5FF" />
            <Text style={styles.legalBtnText}>Terms of Service & Usage</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(0, 229, 255, 0.6)" />
        </TouchableOpacity>
      </View>

      {/* Legal Modal */}
      <Modal
        visible={showLegalModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLegalModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showLegalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowLegalModal(null)}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close document"
              >
                <Ionicons name="close" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {showLegalModal === 'privacy' ? (
                <View style={styles.legalDocument}>
                  <Text style={styles.legalHeading}>1. Sovereign Data Isolation</Text>
                  <Text style={styles.legalParagraph}>
                    NEXORA AI isolates user tasks, reminders, health observations, and memory records to your authenticated account ID. Unauthenticated sessions are stored in an isolated guest boundary.
                  </Text>
                  <Text style={styles.legalHeading}>2. Zero Ad Telemetry</Text>
                  <Text style={styles.legalParagraph}>
                    Your voice interactions, conversational transcripts, and notes are never sold, rented, or distributed to advertising networks.
                  </Text>
                  <Text style={styles.legalHeading}>3. Client-Side Encryption</Text>
                  <Text style={styles.legalParagraph}>
                    Sensitive credentials and critical memory tiers are encrypted using native Android Keystore and SecureStore APIs.
                  </Text>
                </View>
              ) : (
                <View style={styles.legalDocument}>
                  <Text style={styles.legalHeading}>1. Permitted Use</Text>
                  <Text style={styles.legalParagraph}>
                    NEXORA AI is provided as a personal companion application for productivity, calendar planning, health logging, and daily news synthesis.
                  </Text>
                  <Text style={styles.legalHeading}>2. Health & Medical Notice</Text>
                  <Text style={styles.legalParagraph}>
                    Health logging features are for personal tracking only and do not constitute clinical diagnosis, medical treatment, or prescription guidance. Always consult licensed healthcare professionals for medical decisions.
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowLegalModal(null)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss document"
            >
              <Text style={styles.modalDoneBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  brandingCard: {
    backgroundColor: 'rgba(13, 21, 44, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.22)',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 2,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  brandSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 12,
  },
  versionTag: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  versionText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
  },
  glassCard: {
    backgroundColor: 'rgba(13, 21, 44, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.18)',
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  codeValue: {
    color: '#00E5FF',
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  legalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  legalBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legalBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 25, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#0B1224',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 360,
    marginBottom: 16,
  },
  legalDocument: {
    gap: 10,
  },
  legalHeading: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  legalParagraph: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  modalDoneBtn: {
    backgroundColor: '#00E5FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#050B14',
    fontSize: 14,
    fontWeight: '700',
  },
});
