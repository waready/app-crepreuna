import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { AlertCircle, Banknote, CalendarDays, Camera, CheckCircle2, CreditCard, FileUp, Hash, Images, ReceiptText, Save, ScanLine, TicketCheck, X } from 'lucide-react-native';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardSkeleton } from '@/components/ui/skeleton';
import { useApiResource } from '@/hooks/use-api-resource';
import { api } from '@/services/api';
import { findArray, findRecord, pickNumber, pickString } from '@/services/normalizers';

type PaymentTab = 'estado' | 'registrar' | 'vouchers';
type ScanMode = 'voucher' | 'pagalo';

const fallbackTariffs = [
  { cuota: 'Ins.', tarifa: '120.00', pagado: '120.00', mora: '0.00' },
  { cuota: '1', tarifa: '180.00', pagado: '180.00', mora: '0.00' },
  { cuota: '2', tarifa: '180.00', pagado: '0.00', mora: '0.00' },
  { cuota: '3', tarifa: '180.00', pagado: '0.00', mora: '0.00' },
];

const fallbackVouchers = [
  { id: 'V0', secuencia: '000845271', fecha: '16-04-2026', folio: 'BN-2048', monto: '181.00', tipo: 'Deposito Normal', estado: 'Validado' },
  { id: 'V1', secuencia: '000845803', fecha: '18-04-2026', folio: '-', monto: '120.00', tipo: 'Por Descuento', estado: 'Pendiente' },
];

const pendingPayment = [{ secuencia: '000846120', monto: '181.00', fecha: '19-04-2026' }];

export default function PaymentsScreen() {
  const [tab, setTab] = useState<PaymentTab>('estado');
  const [paidWithPagalo, setPaidWithPagalo] = useState(false);
  const loadPayments = useCallback(() => api.getPagePagos(), []);
  const { data, loading, error, refresh } = useApiResource(loadPayments);
  const paymentState = useMemo(() => normalizePayments(data), [data]);

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <CreditCard color="#ffffff" size={28} />
          </View>
          <Text style={styles.kicker}>Modulo financiero</Text>
          <Text style={styles.title}>Pagos</Text>
          <Text style={styles.subtitle}>Consulta tu deuda, valida vouchers y revisa pagos registrados.</Text>
        </View>

        <View style={styles.tabs}>
          <TabButton active={tab === 'estado'} label="Estado" onPress={() => setTab('estado')} />
          <TabButton active={tab === 'registrar'} label="Pagar" onPress={() => setTab('registrar')} />
          <TabButton active={tab === 'vouchers'} label="Vouchers" onPress={() => setTab('vouchers')} />
        </View>

        {loading && !paymentState.hasRemoteData ? <CardSkeleton rows={4} /> : null}
        {error ? <Text style={styles.errorText}>Modo demo: {error}</Text> : null}

        {tab === 'estado' && (!loading || paymentState.hasRemoteData) ? <StatusSection paymentState={paymentState} /> : null}
        {tab === 'registrar' ? (
          <RegisterSection
            paidWithPagalo={paidWithPagalo}
            setPaidWithPagalo={setPaidWithPagalo}
            userId={paymentState.userId}
            defaultDocument={paymentState.document}
            onSaved={refresh}
          />
        ) : null}
        {tab === 'vouchers' ? <VoucherSection vouchers={paymentState.vouchers} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusSection({ paymentState }: { paymentState: ReturnType<typeof normalizePayments> }) {
  const tariffs = paymentState.tariffs.length ? paymentState.tariffs : fallbackTariffs;

  return (
    <>
      <View style={styles.debtCard}>
        <Text style={styles.debtLabel}>Deuda actual</Text>
        <Text style={styles.debtSubLabel}>{paymentState.debtLabel}</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currency}>S/</Text>
          <Text style={styles.amount}>{paymentState.debtAmount}</Text>
        </View>
        <Text style={styles.discountText}>{paymentState.discountType}</Text>
      </View>

      <View style={styles.studentCard}>
        <Text style={styles.studentLabel}>Estudiante</Text>
        <Text style={styles.studentName}>{paymentState.studentName}</Text>
        <Text style={styles.studentMeta}>DNI {paymentState.document || '-'} ? {paymentState.institutionalEmail || 'Correo institucional pendiente'}</Text>
      </View>

      <View style={styles.noticeCard}>
        <AlertCircle color="#7A4E00" size={20} />
        <Text style={styles.noticeText}>Al pagar en el Banco de la Nacion agregue S/ 1.00 de comision por voucher.</Text>
      </View>

      <Text style={styles.sectionTitle}>Lista de pagos</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeadCell}>Cuota</Text>
          <Text style={styles.tableHeadCell}>Tarifa</Text>
          <Text style={styles.tableHeadCell}>Pagado</Text>
          <Text style={styles.tableHeadCell}>Mora</Text>
        </View>
        {tariffs.map((row) => (
          <View key={row.cuota} style={styles.tableRow}>
            <Text style={styles.tableCell}>{row.cuota}</Text>
            <Text style={styles.tableCell}>S/ {row.tarifa}</Text>
            <Text style={styles.tableCell}>S/ {row.pagado}</Text>
            <Text style={styles.tableCell}>S/ {row.mora}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function RegisterSection({
  paidWithPagalo,
  setPaidWithPagalo,
  userId,
  defaultDocument,
  onSaved,
}: {
  paidWithPagalo: boolean;
  setPaidWithPagalo: (value: boolean) => void;
  userId: number;
  defaultDocument?: string;
  onSaved: () => Promise<void>;
}) {
  const [documento, setDocumento] = useState(defaultDocument ?? '');
  const [secuencia, setSecuencia] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [file, setFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [validating, setValidating] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [previewZoomed, setPreviewZoomed] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>(paidWithPagalo ? 'pagalo' : 'voucher');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const previewSizeRef = useRef({ width: 0, height: 0 });
  const frameRectRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const [tokens, setTokens] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (defaultDocument && !documento) {
      setDocumento(defaultDocument);
    }
  }, [defaultDocument, documento]);

  const takeVoucherPhoto = async () => {
    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission.granted) {
      setMessage('Necesitamos permiso de camara para escanear el voucher.');
      return;
    }
    setScanMode(paidWithPagalo ? 'pagalo' : 'voucher');
    setScannerVisible(true);
  };

  const captureVoucher = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.92, skipProcessing: false });
    if (!photo?.uri) {
      setMessage('No se pudo capturar la imagen. Intenta nuevamente.');
      return;
    }

    const cropped = await cropToFrame(photo, previewSizeRef.current, frameRectRef.current);

    setFile({
      uri: cropped.uri,
      width: cropped.width,
      height: cropped.height,
      fileName: scanMode === 'pagalo' ? 'pagalo-voucher.jpg' : 'voucher-ventanilla.jpg',
      mimeType: 'image/jpeg',
    } as ImagePicker.ImagePickerAsset);
    setScannerVisible(false);
    setMessage(scanMode === 'pagalo'
      ? 'Pagalo.pe capturado. Verifica que todo el documento A4 se vea completo.'
      : 'Voucher capturado. Verifica que todo el recibo y la secuencia se vean completos.');
  };

  const pickVoucher = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage('Necesitamos permiso para elegir el voucher desde tu galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: paidWithPagalo ? [3, 4] : [16, 10],
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled) {
      setFile(result.assets[0]);
      setMessage('Voucher adjuntado. Verifica que la imagen sea legible antes de validar.');
    }
  };

  const validateVoucher = async () => {
    if (!file || !documento.trim() || !secuencia.trim() || !monto.trim() || !fecha.trim()) {
      setMessage('Completa documento, secuencia, monto, fecha y adjunta el voucher.');
      return;
    }
    setValidating(true);
    setMessage(null);
    try {
      const response = await api.validarCuota(userId, {
        pagarEnPagalo: paidWithPagalo,
        documento,
        secuencia,
        monto,
        fecha,
        file: { uri: file.uri, name: file.fileName ?? 'voucher.jpg', type: file.mimeType ?? 'image/jpeg' },
      });
      const record = findRecord(response, ['data', 'pago']);
      const directTokens = Array.isArray((response as Record<string, unknown>)?.tokens)
        ? ((response as { tokens: string[] }).tokens ?? []).map(String)
        : [];
      setTokens(directTokens.filter(Boolean));
      setMessage(pickString(record, ['message', 'mensaje'], 'Voucher validado correctamente.'));
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED_REDIRECT') {
        return;
      }
      setMessage(error instanceof Error ? error.message : 'No se pudo validar el voucher.');
    } finally {
      setValidating(false);
    }
  };

  const savePayment = async () => {
    if (!tokens.length) {
      setMessage('Primero valida el voucher para generar tokens de registro.');
      return;
    }
    setValidating(true);
    try {
      await api.registrarPago(tokens);
      setMessage('Pago registrado correctamente.');
      await onSaved();
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED_REDIRECT') {
        return;
      }
      setMessage(error instanceof Error ? error.message : 'No se pudo registrar el pago.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <>
      <View style={styles.noticeCard}>
        <AlertCircle color="#006CAF" size={20} />
        <Text style={styles.noticeText}>La validacion debe realizarse un dia despues del deposito o con anticipacion.</Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchTitle}>Pago mediante Pagalo.pe</Text>
            <Text style={styles.switchText}>Activa esta opcion si tu voucher viene de pagalo.pe.</Text>
          </View>
          <Switch
            value={paidWithPagalo}
            onValueChange={setPaidWithPagalo}
            trackColor={{ false: '#d8e1e8', true: '#9dd8c0' }}
            thumbColor={paidWithPagalo ? '#0F7A59' : '#ffffff'}
          />
        </View>

        <InputRow icon={<ReceiptText color="#687784" size={19} />} label="N de documento" placeholder="Ej. 70894512" value={documento} onChangeText={setDocumento} />
        <InputRow icon={<Hash color="#687784" size={19} />} label="Secuencia" placeholder="Ej. 000846120" value={secuencia} onChangeText={setSecuencia} />
        <InputRow icon={<Banknote color="#687784" size={19} />} label="Monto" placeholder="Ej. 181.00" value={monto} onChangeText={setMonto} />
        <InputRow icon={<CalendarDays color="#687784" size={19} />} label="Fecha" placeholder="dd-mm-aaaa" value={fecha} onChangeText={setFecha} />

        <View style={styles.scanCard}>
          <View style={styles.scanHeader}>
            <View style={styles.fileIcon}>
              <FileUp color="#00365A" size={22} />
            </View>
            <View style={styles.fileCopy}>
              <Text style={styles.fileTitle}>Voucher adjunto</Text>
              <Text style={styles.fileText}>{file?.fileName ?? (paidWithPagalo ? 'PDF de Pagalo.pe' : 'Imagen del voucher bancario')}</Text>
            </View>
          </View>
          <View style={styles.scanActions}>
            <Pressable style={styles.scanButtonPrimary} onPress={takeVoucherPhoto}>
              <Camera color="#ffffff" size={18} />
              <Text style={styles.scanButtonPrimaryText}>Escanear con camara</Text>
            </Pressable>
            <Pressable style={styles.scanButtonSecondary} onPress={pickVoucher}>
              <Images color="#00365A" size={18} />
              <Text style={styles.scanButtonSecondaryText}>Galeria</Text>
            </Pressable>
          </View>
          <Text style={styles.scanHint}>Tip: coloca el voucher sobre una superficie plana, con buena luz y sin recortar la secuencia.</Text>
        </View>

        {file ? (
          <Pressable style={styles.previewCard} onPress={() => setPreviewZoomed(true)}>
            <Image source={{ uri: file.uri }} style={styles.previewImage} contentFit="contain" />
            <View style={styles.previewOverlay}>
              <View style={styles.previewBadge}>
                <CheckCircle2 color="#ffffff" size={16} />
                <Text style={styles.previewBadgeText}>Toca para ver completa</Text>
              </View>
              <Pressable style={styles.previewReplaceButton} onPress={takeVoucherPhoto}>
                <Camera color="#00365A" size={16} />
                <Text style={styles.previewReplaceText}>Repetir captura</Text>
              </Pressable>
            </View>
          </Pressable>
        ) : (
          <View style={styles.exampleCard}>
            <Image
              source={paidWithPagalo ? require('@/assets/images/pagalo-example.jpg') : require('@/assets/images/voucher-example.jpg')}
              style={styles.exampleImage}
              contentFit="cover"
            />
          </View>
        )}

        {message ? <Text style={styles.messageText}>{message}</Text> : null}

        <Pressable style={[styles.validateButton, validating && styles.buttonDisabled]} onPress={validateVoucher} disabled={validating}>
          <TicketCheck color="#ffffff" size={19} />
          <Text style={styles.validateText}>{validating ? 'Validando...' : 'Validar pago'}</Text>
        </Pressable>
      </View>

      <VoucherScannerModal
        cameraRef={cameraRef}
        mode={scanMode}
        onCapture={captureVoucher}
        onChangeMode={setScanMode}
        onClose={() => setScannerVisible(false)}
        onPreviewLayout={(w, h) => { previewSizeRef.current = { width: w, height: h }; }}
        onFrameLayout={(x, y, w, h) => { frameRectRef.current = { x, y, width: w, height: h }; }}
        visible={scannerVisible}
      />

      <Modal animationType="fade" transparent visible={previewZoomed && !!file} onRequestClose={() => setPreviewZoomed(false)}>
        <Pressable style={styles.zoomBackdrop} onPress={() => setPreviewZoomed(false)}>
          {file ? (
            <Image source={{ uri: file.uri }} style={styles.zoomImage} contentFit="contain" />
          ) : null}
          <Pressable style={styles.zoomClose} onPress={() => setPreviewZoomed(false)}>
            <X color="#ffffff" size={24} />
          </Pressable>
        </Pressable>
      </Modal>

      <Text style={styles.sectionTitle}>Pagos validados pendientes</Text>
      <View style={styles.pendingList}>
        {pendingPayment.map((payment) => (
          <View key={payment.secuencia} style={styles.pendingItem}>
            <CheckCircle2 color="#0F7A59" size={20} />
            <View style={styles.pendingCopy}>
              <Text style={styles.pendingTitle}>{payment.secuencia}</Text>
              <Text style={styles.pendingText}>S/ {payment.monto} · {payment.fecha}</Text>
            </View>
          </View>
        ))}
        <Pressable style={[styles.saveButton, validating && styles.buttonDisabled]} onPress={savePayment} disabled={validating}>
          <Save color="#ffffff" size={18} />
          <Text style={styles.saveText}>Guardar pago</Text>
        </Pressable>
      </View>
    </>
  );
}


function VoucherScannerModal({
  cameraRef,
  mode,
  visible,
  onCapture,
  onChangeMode,
  onClose,
  onPreviewLayout,
  onFrameLayout,
}: {
  cameraRef: React.MutableRefObject<CameraView | null>;
  mode: ScanMode;
  visible: boolean;
  onCapture: () => Promise<void>;
  onChangeMode: (mode: ScanMode) => void;
  onClose: () => void;
  onPreviewLayout: (width: number, height: number) => void;
  onFrameLayout: (x: number, y: number, width: number, height: number) => void;
}) {
  const isPagalo = mode === 'pagalo';
  const frameViewRef = useRef<View | null>(null);

  const handleFrameLayout = () => {
    frameViewRef.current?.measureInWindow((x, y, w, h) => {
      onFrameLayout(x, y, w, h);
    });
  };

  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible={visible} onRequestClose={onClose}>
      <View style={styles.scannerRoot}>
        <CameraView
          ref={cameraRef}
          facing="back"
          style={styles.cameraPreview}
          onLayout={(e) => onPreviewLayout(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}
        />
        <View style={styles.scannerShade}>
          <View style={styles.scannerTopBar}>
            <Pressable style={styles.scannerClose} onPress={onClose}>
              <X color="#ffffff" size={22} />
            </Pressable>
            <View style={styles.scannerTitleWrap}>
              <Text style={styles.scannerTitle}>{isPagalo ? 'Escanear Pagalo.pe' : 'Escanear voucher'}</Text>
              <Text style={styles.scannerSubtitle}>{isPagalo ? 'Documento completo tipo A4' : 'Recibo rectangular de ventanilla'}</Text>
            </View>
          </View>

          <View style={styles.scanModeSwitch}>
            <ScannerModeButton active={mode === 'voucher'} label="Voucher" onPress={() => onChangeMode('voucher')} />
            <ScannerModeButton active={mode === 'pagalo'} label="Pagalo.pe" onPress={() => onChangeMode('pagalo')} />
          </View>

          <View style={styles.frameStage}>
            <View
              ref={frameViewRef}
              style={[styles.documentFrame, isPagalo ? styles.a4Frame : styles.voucherFrame]}
              onLayout={handleFrameLayout}
            >
              <View style={styles.frameBadge}>
                <Text style={styles.frameBadgeText}>{isPagalo ? 'PAGALO.PE - A4 COMPLETO' : 'VENTANILLA - RECIBO COMPLETO'}</Text>
              </View>
              <View style={styles.frameInnerBorder} />
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
              <View style={[styles.frameCenterGuide, isPagalo ? styles.frameCenterGuideA4 : styles.frameCenterGuideVoucher]} />
            </View>
          </View>

          <View style={styles.scannerBottomPanel}>
            <Text style={styles.scannerHint}>{isPagalo
              ? 'Acerca el celular hasta que el comprobante llene el marco. Deja visibles los bordes y la fecha.'
              : 'Centra todo el recibo de ventanilla en el marco ancho. La secuencia, fecha y monto deben quedar legibles.'}
            </Text>
            <Pressable style={styles.captureButton} onPress={onCapture}>
              <ScanLine color="#00365A" size={24} />
            </Pressable>
            <Text style={styles.captureText}>Capturar voucher</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ScannerModeButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.scannerModeButton, active && styles.scannerModeButtonActive]} onPress={onPress}>
      <Text style={[styles.scannerModeText, active && styles.scannerModeTextActive]}>{label}</Text>
    </Pressable>
  );
}

function VoucherSection({ vouchers }: { vouchers: typeof fallbackVouchers }) {
  const visibleVouchers = vouchers.length ? vouchers : fallbackVouchers;

  return (
    <>
      <View style={styles.noticeCard}>
        <AlertCircle color="#006CAF" size={20} />
        <Text style={styles.noticeText}>Pagos con comision al Banco de la Nacion S/ 1.00.</Text>
      </View>
      <View style={styles.voucherList}>
        {visibleVouchers.map((voucher) => (
          <View key={`${voucher.id}-${voucher.secuencia}`} style={styles.voucherCard}>
            <View style={styles.voucherTop}>
              <Text style={styles.voucherId}>{voucher.id}</Text>
              <View style={styles.voucherBadges}>
                <Text style={styles.voucherType}>{voucher.tipo}</Text>
                <Text style={styles.voucherStatus}>{voucher.estado}</Text>
              </View>
            </View>
            <View style={styles.voucherGrid}>
              <Field label="Secuencia" value={voucher.secuencia} />
              <Field label="Fecha" value={voucher.fecha} />
              <Field label="Folio" value={voucher.folio} />
              <Field label="Monto" value={`S/ ${voucher.monto}`} />
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function InputRow({
  icon,
  label,
  placeholder,
  value,
  disabled,
  onChangeText,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  onChangeText?: (value: string) => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrap, disabled && styles.inputDisabled]}>
        {icon}
        <TextInput
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor="#9aa6af"
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
        />
      </View>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function normalizePayments(data: unknown) {
  const props = findRecord(data, ['props']);
  const payload = findRecord((props as { data?: unknown }).data ?? data, ['data', 'estado']);
  const user = findRecord((props as { user?: unknown }).user ?? data, ['user', 'estudiante', 'usuario']);
  const usuario = findRecord((props as { usuario?: unknown }).usuario ?? user, ['usuario', 'user']);
  const cronograma = findRecord((payload as { cronograma?: unknown }).cronograma ?? payload, ['cronograma']);

  const tariffSource = findArray((payload as { tarifario?: unknown }).tarifario ?? data, ['tarifario', 'cuotas', 'tarifas', 'pagos']);
  const tariffs = tariffSource.map((item, index) => {
    const cuota = pickString(item, ['nro_cuota', 'cuota', 'numero', 'concepto'], String(index));
    return {
      cuota: cuota === '0' ? 'Ins.' : cuota,
      tarifa: pickString(item, ['monto', 'tarifa', 'importe'], '0.00'),
      pagado: pickString(item, ['pagado', 'monto_pagado'], '0.00'),
      mora: pickString(item, ['mora'], '0.00'),
    };
  });

  const voucherSource = findArray((payload as { vouchers?: unknown }).vouchers ?? data, ['vouchers', 'voucher', 'constancias']);
  const vouchers = voucherSource.map((item, index) => ({
    id: pickString(item, ['id', 'codigo'], `V${index + 1}`),
    secuencia: pickString(item, ['secuencia', 'nro_operacion'], '-'),
    fecha: formatDateLabel(pickString(item, ['fecha', 'created_at'], '-')),
    folio: pickString(item, ['folio', 'constancia', 'documento'], '-') || '-',
    monto: pickString(item, ['monto', 'importe'], '0.00'),
    tipo: paymentTypeLabel(pickString(item, ['tipo_pago', 'tipo', 'concepto'], '1')),
    estado: voucherStatusLabel(pickString(item, ['estado'], '')),
  }));

  const inicio = pickString(cronograma, ['inicio'], '');
  const fin = pickString(cronograma, ['fin'], '');
  const nroCuota = pickString(cronograma, ['nro_cuota'], '');
  const cronogramaLabel = nroCuota
    ? `Cuota N ${nroCuota} ? ${inicio && fin ? `del ${inicio} al ${fin}` : 'cronograma vigente'}`
    : 'Cronograma por confirmar';
  const nombres = pickString(usuario, ['nombres'], pickString(user, ['nombres'], 'Estudiante'));
  const paterno = pickString(usuario, ['paterno'], pickString(user, ['paterno'], ''));
  const materno = pickString(usuario, ['materno'], pickString(user, ['materno'], ''));

  return {
    hasRemoteData: Boolean((props as { data?: unknown }).data || tariffSource.length || voucherSource.length),
    userId: pickNumber(user, ['id', 'user_id', 'usuario_id', 'estudiante_id'], 1),
    studentName: [nombres, paterno, materno].filter(Boolean).join(' '),
    document: pickString(usuario, ['dni', 'nro_documento'], pickString(user, ['nro_documento', 'dni'], '')),
    institutionalEmail: pickString(usuario, ['email'], pickString(user, ['usuario', 'email'], '')),
    debtLabel: cronogramaLabel,
    debtAmount: pickString(payload, ['deuda', 'deuda_actual', 'monto_deuda', 'total'], '0.00'),
    discountType: pickString(payload, ['tipo_descuento'], 'Normal (sin descuento)'),
    tariffs,
    vouchers,
  };
}

function paymentTypeLabel(value: string) {
  if (value === '1') return 'Deposito normal';
  if (value === '2') return 'Pagalo.pe';
  return value || 'Voucher';
}

function voucherStatusLabel(value: string) {
  if (value === '1') return 'Pendiente';
  if (value === '2') return 'Validado';
  if (value === '3') return 'Rechazado';
  return value || 'Registrado';
}

function formatDateLabel(value: string) {
  if (!value || value === '-') return '-';
  const [date] = value.split('T');
  return date;
}

async function cropToFrame(
  photo: { uri: string; width: number; height: number },
  preview: { width: number; height: number },
  frame: { x: number; y: number; width: number; height: number },
) {
  if (!preview.width || !preview.height || !frame.width || !frame.height) {
    return { uri: photo.uri, width: photo.width, height: photo.height };
  }

  const previewIsPortrait = preview.height >= preview.width;
  const photoIsPortrait = photo.height >= photo.width;
  const photoW = previewIsPortrait === photoIsPortrait ? photo.width : photo.height;
  const photoH = previewIsPortrait === photoIsPortrait ? photo.height : photo.width;

  const scale = Math.max(preview.width / photoW, preview.height / photoH);
  const visibleW = preview.width / scale;
  const visibleH = preview.height / scale;
  const visibleX = (photoW - visibleW) / 2;
  const visibleY = (photoH - visibleH) / 2;

  const marginFrac = 0.03;
  const expX = Math.max(0, frame.x - frame.width * marginFrac);
  const expY = Math.max(0, frame.y - frame.height * marginFrac);
  const expW = Math.min(preview.width - expX, frame.width * (1 + 2 * marginFrac));
  const expH = Math.min(preview.height - expY, frame.height * (1 + 2 * marginFrac));

  const originX = Math.max(0, Math.round(visibleX + (expX / preview.width) * visibleW));
  const originY = Math.max(0, Math.round(visibleY + (expY / preview.height) * visibleH));
  const width = Math.max(1, Math.round(Math.min((expW / preview.width) * visibleW, photoW - originX)));
  const height = Math.max(1, Math.round(Math.min((expH / preview.height) * visibleH, photoH - originY)));

  try {
    const result = await ImageManipulator.manipulateAsync(
      photo.uri,
      [{ crop: { originX, originY, width, height } }],
      { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG },
    );
    return { uri: result.uri, width: result.width, height: result.height };
  } catch {
    return { uri: photo.uri, width: photo.width, height: photo.height };
  }
}

const styles = StyleSheet.create({

  scannerRoot: { backgroundColor: '#000000', flex: 1 },
  cameraPreview: { ...StyleSheet.absoluteFillObject },
  scannerShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 14, 24, 0.24)', justifyContent: 'space-between', padding: 18, paddingBottom: 28, paddingTop: 44 },
  scannerTopBar: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  scannerClose: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 999, height: 44, justifyContent: 'center', width: 44 },
  scannerTitleWrap: { flex: 1 },
  scannerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  scannerSubtitle: { color: '#d9ebf5', fontSize: 12, fontWeight: '700', marginTop: 3 },
  scanModeSwitch: { alignSelf: 'center', backgroundColor: 'rgba(0, 0, 0, 0.45)', borderRadius: 999, flexDirection: 'row', gap: 5, padding: 5 },
  scannerModeButton: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  scannerModeButtonActive: { backgroundColor: '#ffffff' },
  scannerModeText: { color: '#d9ebf5', fontSize: 11, fontWeight: '900' },
  scannerModeTextActive: { color: '#00365A' },
  frameStage: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  documentFrame: { alignItems: 'center', backgroundColor: 'rgba(0, 54, 90, 0.10)', borderColor: 'rgba(255,255,255,0.78)', borderRadius: 18, borderWidth: 1.6, justifyContent: 'center', overflow: 'hidden' },
  voucherFrame: { height: '58%', width: '94%' },
  a4Frame: { height: '88%', width: '84%' },
  frameBadge: { backgroundColor: 'rgba(0, 54, 90, 0.86)', borderColor: 'rgba(191,232,255,0.55)', borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, position: 'absolute', top: 12 },
  frameBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  frameInnerBorder: { borderColor: 'rgba(191,232,255,0.34)', borderRadius: 14, borderWidth: 1, bottom: 12, left: 12, position: 'absolute', right: 12, top: 12 },
  corner: { borderColor: '#ffffff', height: 38, position: 'absolute', width: 38 },
  cornerTopLeft: { borderLeftWidth: 6, borderTopWidth: 6, left: -2, top: -2 },
  cornerTopRight: { borderRightWidth: 6, borderTopWidth: 6, right: -2, top: -2 },
  cornerBottomLeft: { borderBottomWidth: 6, borderLeftWidth: 6, bottom: -2, left: -2 },
  cornerBottomRight: { borderBottomWidth: 6, borderRightWidth: 6, bottom: -2, right: -2 },
  frameCenterGuide: { alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999 },
  frameCenterGuideVoucher: { height: 2, width: '82%' },
  frameCenterGuideA4: { height: '82%', width: 2 },
  scannerBottomPanel: { alignItems: 'center', backgroundColor: 'rgba(0, 20, 34, 0.74)', borderRadius: 18, gap: 10, padding: 16 },
  scannerHint: { color: '#e8f5fb', fontSize: 12, fontWeight: '700', lineHeight: 18, textAlign: 'center' },
  captureButton: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#BFE8FF', borderRadius: 999, borderWidth: 5, height: 78, justifyContent: 'center', width: 78 },
  captureText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  safeArea: { backgroundColor: '#f3f7fa', flex: 1 },
  container: { gap: 14, padding: 16, paddingBottom: 86 },
  header: { backgroundColor: '#00365A', borderRadius: 8, padding: 18 },
  headerIcon: { alignItems: 'center', backgroundColor: '#006CAF', borderRadius: 8, height: 52, justifyContent: 'center', marginBottom: 14, width: 52 },
  kicker: { color: '#BFE8FF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 30, fontWeight: '900', letterSpacing: 0, marginTop: 4 },
  subtitle: { color: '#d9ebf5', fontSize: 13, lineHeight: 20, marginTop: 7 },
  tabs: { backgroundColor: '#e8f0f5', borderRadius: 8, flexDirection: 'row', gap: 5, padding: 5 },
  tabButton: { alignItems: 'center', borderRadius: 7, flex: 1, justifyContent: 'center', minHeight: 42 },
  tabButtonActive: { backgroundColor: '#ffffff', boxShadow: '0px 5px 14px rgba(0, 28, 48, 0.12)' },
  tabText: { color: '#687784', fontSize: 12, fontWeight: '900' },
  tabTextActive: { color: '#00365A' },
  debtCard: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, padding: 18 },
  debtLabel: { color: '#00365A', fontSize: 17, fontWeight: '900' },
  debtSubLabel: { color: '#687784', fontSize: 12, marginTop: 4, textAlign: 'center' },
  amountRow: { alignItems: 'flex-end', flexDirection: 'row', gap: 7, marginTop: 16 },
  currency: { color: '#F27A1A', fontSize: 20, fontWeight: '900', marginBottom: 8 },
  amount: { color: '#F27A1A', fontSize: 50, fontWeight: '900', letterSpacing: 0 },
  discountText: { color: '#45525d', fontSize: 13, fontWeight: '800', marginTop: 8 },
  studentCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, padding: 14 },
  studentLabel: { color: '#687784', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  studentName: { color: '#00365A', fontSize: 17, fontWeight: '900', marginTop: 5 },
  studentMeta: { color: '#687784', fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 4 },
  noticeCard: { alignItems: 'center', backgroundColor: '#fff8e8', borderColor: '#f1dfb5', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 },
  noticeText: { color: '#614918', flex: 1, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  sectionTitle: { color: '#00365A', fontSize: 20, fontWeight: '900' },
  table: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { backgroundColor: '#00365A', flexDirection: 'row', paddingVertical: 11 },
  tableHeadCell: { color: '#ffffff', flex: 1, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  tableRow: { borderTopColor: '#eef2f5', borderTopWidth: 1, flexDirection: 'row', paddingVertical: 12 },
  tableCell: { color: '#45525d', flex: 1, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  formCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, gap: 12, padding: 15 },
  switchRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  switchTitle: { color: '#00365A', fontSize: 15, fontWeight: '900' },
  switchText: { color: '#687784', fontSize: 12, lineHeight: 18, marginTop: 3, maxWidth: 230 },
  inputGroup: { gap: 6 },
  inputLabel: { color: '#45525d', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  inputWrap: { alignItems: 'center', backgroundColor: '#f9fbfd', borderColor: '#d8e1e8', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 9, minHeight: 52, paddingHorizontal: 12 },
  inputDisabled: { backgroundColor: '#eef2f5' },
  input: { color: '#1f2d38', flex: 1, fontSize: 15 },
  fileCard: { alignItems: 'center', backgroundColor: '#f4f9fc', borderRadius: 8, flexDirection: 'row', gap: 11, padding: 12 },
  scanCard: { backgroundColor: '#f4f9fc', borderColor: '#d8edf8', borderRadius: 8, borderWidth: 1, gap: 12, padding: 12 },
  scanHeader: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  scanActions: { flexDirection: 'row', gap: 8 },
  scanButtonPrimary: { alignItems: 'center', backgroundColor: '#00365A', borderRadius: 8, flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 46, paddingHorizontal: 10 },
  scanButtonPrimaryText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  scanButtonSecondary: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#c9d8e2', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 46, paddingHorizontal: 12 },
  scanButtonSecondaryText: { color: '#00365A', fontSize: 12, fontWeight: '900' },
  scanHint: { color: '#687784', fontSize: 11, fontWeight: '700', lineHeight: 16 },
  fileIcon: { alignItems: 'center', backgroundColor: '#d8edf8', borderRadius: 8, height: 44, justifyContent: 'center', width: 44 },
  fileCopy: { flex: 1 },
  fileTitle: { color: '#00365A', fontSize: 15, fontWeight: '900' },
  fileText: { color: '#687784', fontSize: 12, marginTop: 2 },
  exampleCard: { borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, height: 150, overflow: 'hidden' },
  exampleImage: { height: '100%', width: '100%' },
  previewCard: { backgroundColor: '#0b1a27', borderColor: '#bfe3d2', borderRadius: 8, borderWidth: 1, height: 260, overflow: 'hidden' },
  previewImage: { height: '100%', width: '100%' },
  zoomBackdrop: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.94)', flex: 1, justifyContent: 'center' },
  zoomImage: { height: '100%', width: '100%' },
  zoomClose: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, height: 44, justifyContent: 'center', position: 'absolute', right: 18, top: 44, width: 44 },
  previewOverlay: { bottom: 0, gap: 8, left: 0, padding: 10, position: 'absolute', right: 0 },
  previewBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(15, 122, 89, 0.92)', borderRadius: 999, flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  previewBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  previewReplaceButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 8, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  previewReplaceText: { color: '#00365A', fontSize: 12, fontWeight: '900' },
  validateButton: { alignItems: 'center', backgroundColor: '#00365A', borderRadius: 8, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 52 },
  buttonDisabled: { opacity: 0.7 },
  validateText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  pendingList: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, gap: 10, padding: 12 },
  pendingItem: { alignItems: 'center', backgroundColor: '#f0f8f4', borderRadius: 8, flexDirection: 'row', gap: 10, padding: 10 },
  pendingCopy: { flex: 1 },
  pendingTitle: { color: '#00365A', fontSize: 14, fontWeight: '900' },
  pendingText: { color: '#687784', fontSize: 12, marginTop: 2 },
  saveButton: { alignItems: 'center', backgroundColor: '#0F7A59', borderRadius: 8, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 50 },
  saveText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  voucherList: { gap: 12 },
  voucherCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, gap: 12, padding: 14 },
  voucherTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  voucherId: { backgroundColor: '#00365A', borderRadius: 7, color: '#ffffff', fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 7 },
  voucherBadges: { alignItems: 'flex-end', gap: 6 },
  voucherType: { color: '#006CAF', fontSize: 12, fontWeight: '900' },
  voucherStatus: { backgroundColor: '#e8f7ef', borderRadius: 999, color: '#0F7A59', fontSize: 10, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 4 },
  voucherGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  field: { backgroundColor: '#f4f9fc', borderRadius: 8, flexBasis: '47%', flexGrow: 1, padding: 10 },
  fieldLabel: { color: '#687784', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  fieldValue: { color: '#00365A', fontSize: 14, fontWeight: '900', marginTop: 4 },
  infoText: { backgroundColor: '#eef7fc', borderColor: '#cfe7f5', borderRadius: 8, borderWidth: 1, color: '#365465', fontSize: 12, fontWeight: '800', lineHeight: 18, padding: 10 },
  errorText: { backgroundColor: '#fff8e8', borderColor: '#f1dfb5', borderRadius: 8, borderWidth: 1, color: '#614918', fontSize: 12, fontWeight: '800', lineHeight: 18, padding: 10 },
  messageText: { backgroundColor: '#eef7fc', borderColor: '#cfe7f5', borderRadius: 8, borderWidth: 1, color: '#365465', fontSize: 12, fontWeight: '800', lineHeight: 18, padding: 10 },
});
