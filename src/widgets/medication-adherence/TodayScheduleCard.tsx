import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../shared/lib/use-theme';
import { Card, CardBody } from '../../shared/ui';
import { useTodayMedicationSchedule } from '../../features/track-medication/useTodayMedicationSchedule';
import { Medication } from '../../shared/api/medication-repository';


export default function TodayScheduleCard() {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const { medications, todayLogs, logDose, isLogging } = useTodayMedicationSchedule();

  if (medications.length === 0) return null;

  const loggedMedIds = new Set(todayLogs.filter(l => l.status === 'taken').map(l => l.medication_id));
  const pendingMeds = medications.filter((m: Medication) => !loggedMedIds.has(m.id));

  if (pendingMeds.length === 0) return null;

  const handleTaken = async (med: Medication) => {
    await logDose({
      medication_id: med.id,
      timestamp: Math.floor(Date.now() / 1000),
      status: 'taken',
    });
  };

  return (
    <View style={styles.cardMargin}>
      <Card variant="outline" size="md" style={styles.cardRadius}>
        <CardBody style={styles.cardBodyNoPadding}>
          <View style={styles.header}>
            <Icon name="medical" size={18} color={colors.accent} />
            <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.md }]}>
              {t('medication:todayTitle', 'Today\'s Medications')}
            </Text>
          </View>

          {pendingMeds.map((med: Medication) => {
            let times: string[] = [];
            try { times = JSON.parse(med.reminder_times || '[]'); } catch {}

            return (
              <View key={med.id} style={[styles.row, { borderTopColor: colors.border }]}>
                <View style={styles.info}>
                  <Text style={[styles.name, { color: colors.textPrimary, fontSize: typography.sm }]}>{med.name}</Text>
                  <Text style={[styles.detail, { color: colors.textSecondary, fontSize: typography.xs }]}>
                    {med.dosage}{times.length > 0 ? ` · ${times.join(', ')}` : ''}
                  </Text>
                </View>
                <Pressable
                  style={[styles.markBtn, { backgroundColor: colors.iconCircleBg, borderColor: colors.accent }]}
                  onPress={() => handleTaken(med)}
                  disabled={isLogging}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('medication:markTaken', {defaultValue: 'Mark {{name}} as taken', name: med.name})}
                >
                  <Icon name="checkmark" size={18} color={colors.accent} />
                </Pressable>
              </View>
            );
          })}
        </CardBody>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  cardMargin: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  cardRadius: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardBodyNoPadding: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
  },
  title: {
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1 },
  name: {
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  detail: {
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
    marginTop: 2,
  },
  markBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
