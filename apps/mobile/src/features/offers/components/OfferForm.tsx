import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CURRENCIES, PERIODS, type Offer, type OfferFormData, type OfferPeriod } from '../types';

interface OfferFormProps {
  initialData?: Offer | null;
  onSubmit: (data: OfferFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function OfferForm({ initialData, onSubmit, onCancel, loading }: OfferFormProps) {
  const [baseSalary, setBaseSalary] = useState(String(initialData?.baseSalary ?? ''));
  const [bonus, setBonus] = useState(initialData?.bonus != null ? String(initialData.bonus) : '');
  const [currency, setCurrency] = useState(initialData?.currency ?? 'USD');
  const [period, setPeriod] = useState<OfferPeriod>(initialData?.period ?? 'yearly');
  const [equity, setEquity] = useState(initialData?.equity ?? '');
  const [benefits, setBenefits] = useState(initialData?.benefits ?? '');
  const [costOfLiving, setCostOfLiving] = useState(
    initialData?.costOfLivingAdjustment != null ? String(initialData.costOfLivingAdjustment) : '',
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  const baseSalaryNumber = Number(baseSalary);
  const canSubmit = baseSalary.trim() !== '' && baseSalaryNumber > 0;

  const onSave = () => {
    if (!canSubmit) return;
    onSubmit({
      baseSalary: baseSalaryNumber,
      bonus: bonus.trim() ? Number(bonus) : null,
      equity,
      benefits,
      costOfLivingAdjustment: costOfLiving.trim() ? Number(costOfLiving) : null,
      currency,
      period,
      notes,
    });
  };

  return (
    <View style={styles.form}>
      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Base salary</Text>
          <TextInput
            style={styles.input}
            value={baseSalary}
            onChangeText={setBaseSalary}
            keyboardType="numeric"
            testID="offer-base-salary-input"
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Bonus</Text>
          <TextInput
            style={styles.input}
            value={bonus}
            onChangeText={setBonus}
            keyboardType="numeric"
            testID="offer-bonus-input"
          />
        </View>
      </View>

      <Text style={styles.label}>Currency</Text>
      <View style={styles.chipRow} testID="offer-currency-picker">
        {CURRENCIES.map((c) => (
          <Pressable
            key={c}
            style={[styles.chip, currency === c && styles.chipActive]}
            onPress={() => setCurrency(c)}
            testID={`offer-currency-${c}`}
          >
            <Text style={[styles.chipText, currency === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Period</Text>
      <View style={styles.chipRow} testID="offer-period-picker">
        {PERIODS.map((p) => (
          <Pressable
            key={p}
            style={[styles.chip, period === p && styles.chipActive]}
            onPress={() => setPeriod(p)}
            testID={`offer-period-${p}`}
          >
            <Text style={[styles.chipText, period === p && styles.chipTextActive]}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Equity</Text>
      <TextInput
        style={styles.input}
        value={equity}
        onChangeText={setEquity}
        placeholder="e.g. 0.1% over 4 years"
        testID="offer-equity-input"
      />

      <Text style={styles.label}>Benefits</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={benefits}
        onChangeText={setBenefits}
        multiline
        testID="offer-benefits-input"
      />

      <Text style={styles.label}>Cost of living adjustment</Text>
      <TextInput
        style={styles.input}
        value={costOfLiving}
        onChangeText={setCostOfLiving}
        keyboardType="numeric"
        testID="offer-col-input"
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={notes}
        onChangeText={setNotes}
        multiline
        testID="offer-notes-input"
      />

      <View style={styles.actions}>
        <Pressable onPress={onCancel} testID="offer-form-cancel-button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.saveButton, (!canSubmit || loading) && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={!canSubmit || loading}
          testID="offer-form-save-button"
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveText}>Save offer</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 8 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1, gap: 4 },
  label: { fontSize: 12, fontWeight: '600', color: '#374151', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#374151' },
  chipTextActive: { color: '#ffffff' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  cancelText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  saveButton: {
    minWidth: 110,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
