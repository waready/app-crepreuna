import { AlertTriangle, CheckCircle2, FileUp, MessageSquareText, Send, ShieldCheck } from 'lucide-react-native';
import type React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const cases = [
  { code: 'LR-2026-0018', title: 'Consulta sobre constancia', state: 'Respondido', color: '#0F7A59' },
  { code: 'LR-2026-0019', title: 'Revision de pago', state: 'En revision', color: '#C77700' },
];

export default function ClaimsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Libro de reclamaciones</Text>
          <Text style={styles.title}>Atencion transparente</Text>
          <Text style={styles.subtitle}>Registra consultas, reclamos o sugerencias y revisa el seguimiento de cada caso.</Text>
        </View>

        <View style={styles.notice}>
          <ShieldCheck color="#0F7A59" size={22} />
          <Text style={styles.noticeText}>Tus datos seran utilizados solo para gestionar la atencion institucional.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Nuevo registro</Text>
          <Field icon={<MessageSquareText color="#006CAF" size={17} />} label="Tipo de solicitud" value="Reclamo academico" />
          <Field icon={<AlertTriangle color="#006CAF" size={17} />} label="Motivo" value="Selecciona un motivo de atencion" />
          <Field icon={<FileUp color="#006CAF" size={17} />} label="Evidencia" value="Adjuntar imagen o documento" />
          <View style={styles.textArea}>
            <Text style={styles.textAreaLabel}>Detalle</Text>
            <Text style={styles.textAreaValue}>Describe brevemente lo ocurrido para que soporte pueda revisarlo.</Text>
          </View>
          <Pressable style={styles.submitButton}>
            <Send color="#ffffff" size={18} />
            <Text style={styles.submitText}>Enviar registro</Text>
          </Pressable>
        </View>

        <View style={styles.trackingCard}>
          <Text style={styles.sectionTitle}>Seguimiento</Text>
          {cases.map((item) => (
            <View key={item.code} style={styles.caseRow}>
              <View style={styles.caseIcon}>
                <CheckCircle2 color="#00365A" size={20} />
              </View>
              <View style={styles.caseCopy}>
                <Text style={styles.caseCode}>{item.code}</Text>
                <Text style={styles.caseTitle}>{item.title}</Text>
              </View>
              <View style={[styles.caseBadge, { backgroundColor: item.color }]}>
                <Text style={styles.caseBadgeText}>{item.state}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldIcon}>{icon}</View>
      <View style={styles.fieldCopy}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f3f7fa', flex: 1 },
  container: { gap: 14, padding: 16, paddingBottom: 86 },
  header: { backgroundColor: '#00365A', borderRadius: 8, padding: 18 },
  kicker: { color: '#BFE8FF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 30, fontWeight: '900', lineHeight: 34, marginTop: 4 },
  subtitle: { color: '#d9ebf5', fontSize: 13, lineHeight: 20, marginTop: 7 },
  notice: { alignItems: 'center', backgroundColor: '#eef9f4', borderColor: '#c9eadb', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 13 },
  noticeText: { color: '#0F7A59', flex: 1, fontSize: 12, fontWeight: '800', lineHeight: 18 },
  formCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, gap: 10, padding: 15 },
  sectionTitle: { color: '#00365A', fontSize: 19, fontWeight: '900', marginBottom: 2 },
  field: { alignItems: 'center', backgroundColor: '#f7fbfd', borderColor: '#edf3f7', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 },
  fieldIcon: { alignItems: 'center', backgroundColor: '#d8edf8', borderRadius: 8, height: 36, justifyContent: 'center', width: 36 },
  fieldCopy: { flex: 1 },
  fieldLabel: { color: '#006CAF', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  fieldValue: { color: '#00365A', fontSize: 13, fontWeight: '800', marginTop: 2 },
  textArea: { backgroundColor: '#f7fbfd', borderColor: '#edf3f7', borderRadius: 8, borderWidth: 1, minHeight: 104, padding: 12 },
  textAreaLabel: { color: '#006CAF', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  textAreaValue: { color: '#687784', fontSize: 13, lineHeight: 20, marginTop: 8 },
  submitButton: { alignItems: 'center', backgroundColor: '#006CAF', borderRadius: 8, flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 13 },
  submitText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  trackingCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, padding: 15 },
  caseRow: { alignItems: 'center', borderTopColor: '#edf3f7', borderTopWidth: 1, flexDirection: 'row', gap: 10, paddingVertical: 12 },
  caseIcon: { alignItems: 'center', backgroundColor: '#d8edf8', borderRadius: 8, height: 38, justifyContent: 'center', width: 38 },
  caseCopy: { flex: 1 },
  caseCode: { color: '#006CAF', fontSize: 10, fontWeight: '900' },
  caseTitle: { color: '#00365A', fontSize: 13, fontWeight: '900', marginTop: 2 },
  caseBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  caseBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
});
