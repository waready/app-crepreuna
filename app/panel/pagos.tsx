import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  Landmark,
  Plus,
  ReceiptText,
  SearchCheck,
  Upload,
  WalletCards,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SelectField } from '@/components/ui/select-field';
import {
  AppText,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  LoadingState,
  Metric,
  PageHeader,
  Pill,
  Screen,
  SectionTitle,
} from '@/components/ui/primitives';
import { palette, theme } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';
import { api } from '@/services/api';
import type {
  PaymentItem,
  PaymentsData,
  PaymentValidation,
  TariffItem,
  UploadFile,
} from '@/services/api-types';
import { downloadAuthenticatedFile } from '@/services/files';
import { formatCurrency, formatDate, periodLabel } from '@/utils/format';

type PaymentForm = {
  secuencia: string;
  monto: string;
  fecha: string;
  folio: string;
  concepto: 'cuota' | 'mora';
  canal_pago: 'pagalo' | 'ventanilla';
};

const initialForm = (): PaymentForm => ({
  secuencia: '',
  monto: '',
  fecha: new Date().toISOString().slice(0, 10),
  folio: '',
  concepto: 'cuota',
  canal_pago: 'pagalo',
});

export default function PaymentsScreen() {
  const { period } = useSession();
  const [data, setData] = useState<PaymentsData>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setData(await api.student.payments());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el estado de pagos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const summary = data?.resumen ?? { pagado: 0, total: 0, deuda: 0 };
  const total = summary.total ?? Number(summary.pagado) + Number(summary.deuda);

  return (
    <Screen onRefresh={() => load(true)} refreshing={refreshing}>
      <PageHeader
        eyebrow="Estado financiero"
        period={periodLabel(period)}
        subtitle="Consulta tus cuotas y registra comprobantes sin salir de la app."
        title="Mis pagos"
      />
      <View style={styles.metrics}>
        <Metric icon={WalletCards} label="Total" value={formatCurrency(total)} />
        <Metric icon={BadgeCheck} label="Pagado" tone="success" value={formatCurrency(summary.pagado)} />
        <Metric icon={Clock3} label="Pendiente" tone="warning" value={formatCurrency(summary.deuda)} />
      </View>

      <View style={styles.content}>
        <Button fullWidth icon={Plus} label="Registrar nuevo pago" onPress={() => setOpen(true)} />
        {loading ? <LoadingState label="Consultando pagos y cuotas..." /> : null}
        {error ? <ErrorState message={error} onRetry={() => load()} /> : null}

        {!loading && !error && data ? (
          <>
            <EnrollmentSummary data={data} />
            <SectionTitle
              subtitle="Montos programados para tu modalidad"
              title="Cronograma de cuotas"
            />
            {data.tarifario.length ? data.tarifario.map((tariff) => (
              <TariffCard key={tariff.id} tariff={tariff} />
            )) : (
              <EmptyState
                icon={CalendarDays}
                message="No existe un cronograma configurado para tu matricula."
                title="Sin cuotas programadas"
              />
            )}

            <SectionTitle
              subtitle={`${data.pagos.length} comprobantes registrados`}
              title="Historial de pagos"
            />
            {data.pagos.length ? data.pagos.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} />
            )) : (
              <EmptyState
                icon={ReceiptText}
                message="Tus comprobantes apareceran aqui despues de registrarlos."
                title="Aun no hay pagos"
              />
            )}
          </>
        ) : null}
      </View>

      <PaymentModal
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          void load();
        }}
        visible={open}
      />
    </Screen>
  );
}

function EnrollmentSummary({ data }: { data: PaymentsData }) {
  const enrollment = data.inscripcion;
  if (!enrollment) return null;
  return (
    <Card style={styles.enrollmentCard}>
      <View style={styles.enrollmentIcon}>
        <Landmark color={palette.paper} size={24} />
      </View>
      <View style={styles.enrollmentCopy}>
        <AppText color={palette.paper} variant="heading">Matricula vigente</AppText>
        <AppText color="#CBE6F2" variant="caption">
          {[enrollment.modalidad, enrollment.tipo_estudiante, enrollment.sede].filter(Boolean).join(' / ') || 'Ciclo activo'}
        </AppText>
      </View>
      {enrollment.codigo ? <Pill label={enrollment.codigo} tone="glass" /> : null}
    </Card>
  );
}

function TariffCard({ tariff }: { tariff: TariffItem }) {
  const amount = Number(tariff.monto || 0);
  const paid = Number(tariff.pagado || 0);
  const lateFee = Number(tariff.mora || 0);
  const pending = Math.max(0, amount + lateFee - paid);
  const complete = pending <= 0 && amount > 0;
  const progress = amount > 0 ? Math.min(100, Math.round((paid / (amount + lateFee)) * 100)) : 0;
  return (
    <Card style={styles.tariffCard}>
      <View style={styles.tariffTop}>
        <View style={styles.quotaNumber}>
          <AppText color={theme.colors.primary} variant="micro">CUOTA</AppText>
          <AppText color={theme.colors.primary} variant="title">{tariff.nro_cuota}</AppText>
        </View>
        <View style={styles.tariffCopy}>
          <AppText variant="heading">{formatCurrency(amount)}</AppText>
          <AppText color={theme.colors.textMuted} variant="caption">
            {[tariff.modalidad, tariff.tipo_estudiante].filter(Boolean).join(' / ') || 'Tarifa academica'}
          </AppText>
        </View>
        <Pill
          icon={complete ? CheckCircle2 : Clock3}
          label={complete ? 'Pagada' : `${formatCurrency(pending)} pendiente`}
          tone={complete ? 'success' : 'warning'}
        />
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      {lateFee > 0 ? (
        <AppText color={theme.colors.warning} variant="caption">Incluye mora: {formatCurrency(lateFee)}</AppText>
      ) : null}
    </Card>
  );
}

function PaymentCard({ payment }: { payment: PaymentItem }) {
  async function openVoucher() {
    if (!payment.voucher_url) return;
    try {
      await downloadAuthenticatedFile(payment.voucher_url, `voucher-${payment.secuencia}.pdf`);
    } catch (caught) {
      Alert.alert('No se pudo abrir', caught instanceof Error ? caught.message : 'Intenta nuevamente.');
    }
  }

  return (
    <Card style={styles.paymentCard}>
      <View style={styles.paymentTop}>
        <View style={styles.paymentIcon}>
          <ReceiptText color={theme.colors.success} size={23} />
        </View>
        <View style={styles.paymentCopy}>
          <AppText variant="heading">{formatCurrency(payment.monto_aplicado || payment.monto_banco)}</AppText>
          <AppText color={theme.colors.textMuted} variant="caption">Secuencia {payment.secuencia}</AppText>
        </View>
        <Pill icon={CheckCircle2} label="Registrado" tone="success" />
      </View>
      <Divider />
      <View style={styles.paymentDetails}>
        <Detail label="Fecha" value={formatDate(payment.fecha)} />
        <Detail label="Canal" value={payment.canal_pago || 'No indicado'} />
        <Detail label="Concepto" value={payment.concepto || 'Pago academico'} />
        <Detail label="Folio" value={payment.folio || 'Sin folio'} />
      </View>
      {payment.voucher_url ? (
        <Button compact icon={FileText} label="Abrir comprobante" onPress={() => void openVoucher()} variant="secondary" />
      ) : null}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <AppText color={theme.colors.textMuted} variant="micro">{label.toUpperCase()}</AppText>
      <AppText numberOfLines={1} variant="caption">{value}</AppText>
    </View>
  );
}

function PaymentModal({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PaymentForm>(initialForm());
  const [file, setFile] = useState<UploadFile>();
  const [validation, setValidation] = useState<PaymentValidation>();
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setForm(initialForm());
    setFile(undefined);
    setValidation(undefined);
    setError('');
  }, [visible]);

  function update<Key extends keyof PaymentForm>(key: Key, value: PaymentForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setValidation(undefined);
    setError('');
  }

  function validateFields() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fecha)) return 'La fecha debe tener formato AAAA-MM-DD.';
    if (!form.secuencia.trim()) return 'Ingresa la secuencia de la operacion.';
    if (!form.monto.trim() || Number(form.monto) <= 0) return 'Ingresa un monto valido.';
    return '';
  }

  async function validatePayment() {
    const message = validateFields();
    if (message) {
      setError(message);
      return;
    }
    setValidating(true);
    setError('');
    try {
      const result = await api.student.validatePayment({
        ...form,
        monto: Number(form.monto),
        folio: form.folio.trim() || undefined,
      });
      setValidation(result);
      if (!result.valido) setError('La operacion no pudo ser validada por el servidor.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo validar el pago.');
    } finally {
      setValidating(false);
    }
  }

  async function pickVoucher() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ['application/pdf', 'image/jpeg', 'image/png'],
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 6 * 1024 * 1024) {
      setError('El comprobante no debe superar los 6 MB.');
      return;
    }
    setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size });
    setError('');
  }

  async function submit() {
    const message = validateFields();
    if (message) return setError(message);
    if (!validation?.valido) return setError('Primero valida los datos de la operacion.');
    if (!file) return setError('Adjunta el voucher en PDF, JPG o PNG.');
    setSaving(true);
    setError('');
    try {
      await api.student.submitPayment({
        ...form,
        monto: Number(form.monto),
        folio: form.folio.trim() || undefined,
        voucher: file,
      });
      Alert.alert('Pago registrado', 'El comprobante fue enviado correctamente.');
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo registrar el comprobante.');
    } finally {
      setSaving(false);
    }
  }

  const imagePreview = file?.mimeType?.startsWith('image/') || /\.(png|jpe?g)$/i.test(file?.name || '');

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.scrim}>
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
              <AppText variant="title">Registrar comprobante</AppText>
              <AppText color={theme.colors.textMuted} variant="caption">Valida la operacion antes de enviarla.</AppText>
            </View>
            <IconButton accessibilityLabel="Cerrar" icon={X} onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <View style={styles.notice}>
              <SearchCheck color={theme.colors.accent} size={22} />
              <AppText color={theme.colors.textSoft} style={styles.noticeCopy} variant="caption">
                Usa exactamente la secuencia, fecha y monto visibles en tu operacion bancaria.
              </AppText>
            </View>
            <Field
              icon={CreditCard}
              label="Secuencia de operacion"
              onChangeText={(value) => update('secuencia', value.replace(/\s/g, ''))}
              placeholder="Ej. 000123456"
              value={form.secuencia}
            />
            <View style={styles.formRow}>
              <Field
                containerStyle={styles.formColumn}
                icon={WalletCards}
                keyboardType="decimal-pad"
                label="Monto"
                onChangeText={(value) => update('monto', value.replace(',', '.'))}
                placeholder="0.00"
                value={form.monto}
              />
              <Field
                containerStyle={styles.formColumn}
                icon={CalendarDays}
                label="Fecha"
                maxLength={10}
                onChangeText={(value) => update('fecha', value)}
                placeholder="AAAA-MM-DD"
                value={form.fecha}
              />
            </View>
            <Field
              icon={ReceiptText}
              label="Folio (opcional)"
              onChangeText={(value) => update('folio', value)}
              placeholder="Numero de folio"
              value={form.folio}
            />
            <SelectField
              icon={Landmark}
              label="Canal de pago"
              onChange={(value) => update('canal_pago', value as PaymentForm['canal_pago'])}
              options={[
                { label: 'Pagalo.pe', value: 'pagalo', description: 'Operacion realizada en la plataforma Pagalo' },
                { label: 'Ventanilla', value: 'ventanilla', description: 'Pago presencial en entidad bancaria' },
              ]}
              value={form.canal_pago}
            />
            <SelectField
              icon={ReceiptText}
              label="Concepto"
              onChange={(value) => update('concepto', value as PaymentForm['concepto'])}
              options={[
                { label: 'Cuota academica', value: 'cuota' },
                { label: 'Mora', value: 'mora' },
              ]}
              value={form.concepto}
            />
            <Button
              fullWidth
              icon={SearchCheck}
              label={validation?.valido ? 'Operacion validada' : 'Validar operacion'}
              loading={validating}
              onPress={() => void validatePayment()}
              variant={validation?.valido ? 'soft' : 'secondary'}
            />
            {validation?.valido ? (
              <Card style={styles.validationCard}>
                <CheckCircle2 color={theme.colors.success} size={24} />
                <View style={styles.validationCopy}>
                  <AppText color={theme.colors.success} variant="label">Datos verificados</AppText>
                  <AppText color={theme.colors.textMuted} variant="caption">
                    Aplicable: {formatCurrency(validation.monto_aplicable)} / {formatDate(validation.fecha)}
                  </AppText>
                </View>
              </Card>
            ) : null}

            <SectionTitle subtitle="PDF, JPG o PNG / maximo 6 MB" title="Voucher" />
            {file ? (
              <View style={styles.preview}>
                {imagePreview ? (
                  <Image contentFit="contain" source={{ uri: file.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.pdfPreview}>
                    <FileCheck2 color={theme.colors.accent} size={42} />
                    <AppText variant="label">Documento PDF seleccionado</AppText>
                  </View>
                )}
                <View style={styles.previewFooter}>
                  <View style={styles.previewCopy}>
                    <AppText color={palette.paper} numberOfLines={1} variant="label">{file.name}</AppText>
                    <AppText color="#CBE6F2" variant="micro">{file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Archivo listo'}</AppText>
                  </View>
                  <Button compact label="Cambiar" onPress={() => void pickVoucher()} variant="secondary" />
                </View>
              </View>
            ) : (
              <Card onPress={() => void pickVoucher()} style={styles.uploadCard}>
                <View style={styles.uploadIcon}><Upload color={theme.colors.accent} size={26} /></View>
                <View style={styles.uploadCopy}>
                  <AppText variant="label">Seleccionar comprobante</AppText>
                  <AppText color={theme.colors.textMuted} variant="caption">Se mostrara una vista previa antes de enviar.</AppText>
                </View>
              </Card>
            )}

            {error ? <AppText color={theme.colors.danger} style={styles.formError} variant="caption">{error}</AppText> : null}
            <Button
              disabled={!validation?.valido || !file}
              fullWidth
              icon={Upload}
              label="Enviar comprobante"
              loading={saving}
              onPress={() => void submit()}
            />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 9, marginHorizontal: 16 },
  content: { gap: 14, paddingHorizontal: 16, paddingTop: 20 },
  enrollmentCard: { alignItems: 'center', backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, flexDirection: 'row', gap: 11 },
  enrollmentIcon: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 15, height: 48, justifyContent: 'center', width: 48 },
  enrollmentCopy: { flex: 1 },
  tariffCard: { gap: 12, marginBottom: 0 },
  tariffTop: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  quotaNumber: { alignItems: 'center', backgroundColor: theme.colors.accentSoft, borderRadius: 14, minWidth: 54, padding: 8 },
  tariffCopy: { flex: 1 },
  progressTrack: { backgroundColor: theme.colors.border, borderRadius: 5, height: 7, overflow: 'hidden' },
  progressFill: { backgroundColor: theme.colors.success, borderRadius: 5, height: '100%' },
  paymentCard: { gap: 12, marginBottom: 0 },
  paymentTop: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  paymentIcon: { alignItems: 'center', backgroundColor: theme.colors.successSoft, borderRadius: 14, height: 48, justifyContent: 'center', width: 48 },
  paymentCopy: { flex: 1 },
  paymentDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detail: { backgroundColor: theme.colors.surfaceMuted, borderRadius: 12, flexBasis: '46%', flexGrow: 1, gap: 3, padding: 10 },
  scrim: { backgroundColor: palette.scrim, flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '94%', minHeight: '72%', overflow: 'hidden' },
  handle: { alignSelf: 'center', backgroundColor: theme.colors.borderStrong, borderRadius: 4, height: 5, marginTop: 9, width: 46 },
  modalHeader: { alignItems: 'center', borderBottomColor: theme.colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: 12, padding: 18 },
  modalHeaderCopy: { flex: 1 },
  form: { gap: 14, padding: 16, paddingBottom: 44 },
  notice: { alignItems: 'flex-start', backgroundColor: theme.colors.accentSoft, borderRadius: theme.radius.md, flexDirection: 'row', gap: 9, padding: 12 },
  noticeCopy: { flex: 1 },
  formRow: { flexDirection: 'row', gap: 10 },
  formColumn: { flex: 1 },
  validationCard: { alignItems: 'center', backgroundColor: theme.colors.successSoft, borderColor: '#B8DEC9', flexDirection: 'row', gap: 10, marginHorizontal: 0 },
  validationCopy: { flex: 1 },
  uploadCard: { alignItems: 'center', borderColor: '#A8D8E8', borderStyle: 'dashed', flexDirection: 'row', gap: 12, marginHorizontal: 0 },
  uploadIcon: { alignItems: 'center', backgroundColor: theme.colors.accentSoft, borderRadius: 15, height: 50, justifyContent: 'center', width: 50 },
  uploadCopy: { flex: 1 },
  preview: { backgroundColor: theme.colors.primaryStrong, borderRadius: theme.radius.lg, minHeight: 240, overflow: 'hidden' },
  previewImage: { height: 270, width: '100%' },
  pdfPreview: { alignItems: 'center', backgroundColor: theme.colors.surface, gap: 9, height: 220, justifyContent: 'center' },
  previewFooter: { alignItems: 'center', flexDirection: 'row', gap: 10, padding: 12 },
  previewCopy: { flex: 1 },
  formError: { backgroundColor: theme.colors.dangerSoft, borderRadius: 12, padding: 11 },
});
