import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../shared/lib/use-theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { useManageMedications } from '../../../features/track-medication/useManageMedications';
import { Medication } from '../../../shared/api/medication-repository';
import MedicationModal from './MedicationModal';

export default function MedicationPage() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const { medications, isLoading, deleteMedication } = useManageMedications();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  const handleOpenAdd = () => {
    setEditingMedication(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (med: Medication) => {
    setEditingMedication(med);
    setModalVisible(true);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      t('medication:deleteTitle', 'Delete Medication'),
      t('medication:deleteConfirm', `Are you sure you want to delete ${name}?`),
      [
        { text: t('common:cancel', 'Cancel'), style: 'cancel' },
        { text: t('common:delete', 'Delete'), style: 'destructive', onPress: () => deleteMedication(id) },
      ],
    );
  };

  const renderMedicationCard = ({ item }: { item: Medication }) => {
    let times: string[] = [];
    try { times = JSON.parse(item.reminder_times || '[]'); } catch {}

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => handleOpenEdit(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="medical" size={20} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.medName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.medDosage, { color: colors.textSecondary }]}>{item.dosage}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(item.id, item.name)}
            style={styles.deleteButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={[styles.reminderRow, { borderTopColor: colors.border }]}>
          <Icon name="alarm-outline" size={15} color={colors.accent} />
          <Text style={[styles.reminderText, { color: colors.textSecondary }]}>
            {times.length > 0
              ? times.join(' · ')
              : t('medication:noReminders', 'No reminders set')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('medication:title', 'Medications')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('medication:subtitle', 'Track adherence & set reminders')}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>{t('common:loading', 'Loading...')}</Text>
        </View>
      ) : medications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="medical-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {t('medication:emptyTitle', 'No medications yet')}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('medication:emptyState', 'Add your medications to track adherence and set daily reminders.')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          renderItem={renderMedicationCard}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={handleOpenAdd}
        activeOpacity={0.85}
      >
        <Icon name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <MedicationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        medication={editingMedication}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    fontSize: 28,
  },
  subtitle: {
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
    fontSize: 14,
    marginTop: 2,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medName: {
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    fontSize: 17,
  },
  medDosage: {
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
    fontSize: 14,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  reminderText: {
    fontFamily: 'Nunito-Medium',
    fontWeight: '500',
    fontSize: 13,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    fontSize: 20,
  },
  emptyText: {
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
