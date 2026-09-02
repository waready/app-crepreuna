import * as ImagePicker from 'expo-image-picker';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Camera,
  Download,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AuthenticatedAvatar } from '@/components/ui/authenticated-avatar';
import {
  AppText,
  Button,
  Card,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  Pill,
  Screen,
  SectionTitle,
} from '@/components/ui/primitives';
import { palette, theme } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';
import { api } from '@/services/api';
import type { UserProfile } from '@/services/api-types';
import { downloadAuthenticatedFile } from '@/services/files';
import { periodLabel } from '@/utils/format';

type EditableProfile = {
  celular: string;
  email: string;
  direccion: string;
  fecha_nac: string;
  anio_egreso: string;
};

export default function ProfileScreen() {
  const { role, period, setUser } = useSession();
  const [profile, setProfile] = useState<UserProfile>();
  const [form, setForm] = useState<EditableProfile>({ celular: '', email: '', direccion: '', fecha_nac: '', anio_egreso: '' });
  const [photoVersion, setPhotoVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void load();
    // Profile restoration runs once after authentication.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const next = await api.profile.show();
      applyProfile(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function applyProfile(next: UserProfile) {
    setProfile(next);
    setUser(next);
    setForm({
      celular: next.celular || '',
      email: next.email || '',
      direccion: next.direccion || '',
      fecha_nac: next.fecha_nac || '',
      anio_egreso: next.anio_egreso ? String(next.anio_egreso) : '',
    });
  }

  async function save() {
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError('Ingresa un correo valido.');
      return;
    }
    if (form.fecha_nac && !/^\d{4}-\d{2}-\d{2}$/.test(form.fecha_nac)) {
      setError('La fecha de nacimiento debe tener formato AAAA-MM-DD.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const next = await api.profile.update({
        celular: form.celular.trim() || null,
        email: form.email.trim() || null,
        direccion: form.direccion.trim() || null,
        fecha_nac: form.fecha_nac || null,
        anio_egreso: form.anio_egreso ? Number(form.anio_egreso) : null,
      });
      applyProfile(next);
      Alert.alert('Perfil actualizado', 'Tus datos fueron guardados correctamente.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron guardar los datos.');
    } finally {
      setSaving(false);
    }
  }

  async function updatePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Permite el acceso a tus fotos para actualizar tu perfil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.82,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    setError('');
    try {
      const next = await api.profile.updatePhoto({
        uri: asset.uri,
        name: asset.fileName || `perfil-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      });
      applyProfile(next);
      setPhotoVersion(Date.now());
      Alert.alert('Foto actualizada', 'Tu nueva foto ya esta disponible.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo actualizar la foto.');
    } finally {
      setUploading(false);
    }
  }

  async function confirmData() {
    setConfirming(true);
    setError('');
    try {
      await api.profile.confirm();
      Alert.alert('Datos confirmados', 'La confirmacion fue registrada correctamente.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron confirmar los datos.');
    } finally {
      setConfirming(false);
    }
  }

  async function enrollmentCertificate() {
    try {
      await downloadAuthenticatedFile(api.student.enrollmentCertificateUrl(), 'constancia-matricula.pdf');
    } catch (caught) {
      Alert.alert('No se pudo abrir', caught instanceof Error ? caught.message : 'Intenta nuevamente.');
    }
  }

  const photoUrl = profile
    ? `${profile.foto_url || api.profile.photoUrl()}${(profile.foto_url || api.profile.photoUrl()).includes('?') ? '&' : '?'}v=${photoVersion}`
    : undefined;

  return (
    <Screen onRefresh={() => load(true)} refreshing={refreshing}>
      <PageHeader
        back
        eyebrow="Cuenta personal"
        period={periodLabel(period)}
        subtitle="Mantiene tus datos de contacto actualizados."
        title="Mi perfil"
      />
      <View style={styles.content}>
        {loading ? <LoadingState label="Consultando tu informacion..." /> : null}
        {error && !profile ? <ErrorState message={error} onRetry={() => load()} /> : null}
        {profile ? (
          <>
            <Card style={styles.hero}>
              <View style={styles.avatarWrap}>
                <AuthenticatedAvatar name={profile.nombre_completo} size={94} url={photoUrl} />
                <View style={styles.cameraBadge}><Camera color={palette.paper} size={17} /></View>
              </View>
              <View style={styles.heroCopy}>
                <AppText color={palette.paper} style={styles.name} variant="title">{profile.nombre_completo}</AppText>
                <AppText color="#CBE6F2" variant="caption">{role === 'docente' ? 'Docente CEPREUNA' : 'Estudiante CEPREUNA'}</AppText>
                <View style={styles.heroPills}>
                  <Pill icon={ShieldCheck} label="Ciclo activo" tone="glass" />
                  {profile.condicion ? <Pill label={profile.condicion} tone="glass" /> : null}
                </View>
              </View>
              <Button compact icon={Camera} label="Cambiar" loading={uploading} onPress={() => void updatePhoto()} variant="secondary" />
            </Card>

            <View style={styles.identityGrid}>
              <Identity icon={IdCard} label="Documento" value={profile.nro_documento || 'No registrado'} />
              <Identity icon={GraduationCap} label="Rol" value={role === 'docente' ? 'Docente' : 'Estudiante'} />
              <Identity icon={Building2} label="Sede" value={profile.inscripcion?.sede || profile.programa || 'No indicada'} />
              <Identity icon={BadgeCheck} label="Modalidad" value={profile.inscripcion?.modalidad || profile.condicion || 'No indicada'} />
            </View>

            <SectionTitle subtitle="Estos datos pueden ser actualizados" title="Informacion de contacto" />
            <Card style={styles.formCard}>
              <Field icon={Phone} keyboardType="phone-pad" label="Celular" onChangeText={(celular) => setForm((current) => ({ ...current, celular }))} placeholder="Numero de contacto" value={form.celular} />
              <Field autoCapitalize="none" icon={Mail} keyboardType="email-address" label="Correo personal" onChangeText={(email) => setForm((current) => ({ ...current, email }))} placeholder="correo@ejemplo.com" value={form.email} />
              <Field icon={MapPin} label="Direccion" multiline onChangeText={(direccion) => setForm((current) => ({ ...current, direccion }))} placeholder="Direccion actual" value={form.direccion} />
              {role === 'estudiante' ? (
                <View style={styles.formRow}>
                  <Field containerStyle={styles.formColumn} icon={CalendarDays} label="Nacimiento" maxLength={10} onChangeText={(fecha_nac) => setForm((current) => ({ ...current, fecha_nac }))} placeholder="AAAA-MM-DD" value={form.fecha_nac} />
                  <Field containerStyle={styles.formColumn} icon={GraduationCap} keyboardType="number-pad" label="Egreso escolar" maxLength={4} onChangeText={(anio_egreso) => setForm((current) => ({ ...current, anio_egreso }))} placeholder="2025" value={form.anio_egreso} />
                </View>
              ) : null}
              {error ? <AppText color={theme.colors.danger} style={styles.error} variant="caption">{error}</AppText> : null}
              <Button fullWidth icon={Save} label="Guardar cambios" loading={saving} onPress={() => void save()} />
              <Button fullWidth icon={BadgeCheck} label="Confirmar mis datos" loading={confirming} onPress={() => void confirmData()} variant="soft" />
            </Card>

            {role === 'estudiante' ? (
              <Card style={styles.certificateCard}>
                <View style={styles.certificateIcon}><GraduationCap color={theme.colors.accent} size={26} /></View>
                <View style={styles.certificateCopy}>
                  <AppText variant="heading">Constancia de matricula</AppText>
                  <AppText color={theme.colors.textMuted} variant="caption">Documento oficial del ciclo vigente.</AppText>
                </View>
                <Button compact icon={Download} label="Abrir" onPress={() => void enrollmentCertificate()} variant="secondary" />
              </Card>
            ) : null}
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function Identity({ icon: Icon, label, value }: { icon: typeof IdCard; label: string; value: string }) {
  return (
    <View style={styles.identity}>
      <Icon color={theme.colors.accent} size={19} />
      <AppText color={theme.colors.textMuted} variant="micro">{label.toUpperCase()}</AppText>
      <AppText numberOfLines={2} variant="label">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingHorizontal: 16, paddingTop: 18 },
  hero: { alignItems: 'center', backgroundColor: theme.colors.primaryStrong, borderColor: theme.colors.primaryStrong, flexDirection: 'row', gap: 13, marginHorizontal: 0 },
  avatarWrap: { position: 'relative' },
  cameraBadge: { alignItems: 'center', backgroundColor: theme.colors.accent, borderColor: theme.colors.primaryStrong, borderRadius: 14, borderWidth: 3, bottom: -2, height: 30, justifyContent: 'center', position: 'absolute', right: -2, width: 30 },
  heroCopy: { flex: 1, gap: 4 },
  name: { fontSize: 20 },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  identityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  identity: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md, borderWidth: 1, flexBasis: '46%', flexGrow: 1, gap: 5, minHeight: 105, padding: 12 },
  formCard: { gap: 14, marginHorizontal: 0 },
  formRow: { flexDirection: 'row', gap: 10 },
  formColumn: { flex: 1 },
  error: { backgroundColor: theme.colors.dangerSoft, borderRadius: 12, padding: 11 },
  certificateCard: { alignItems: 'center', flexDirection: 'row', gap: 11, marginHorizontal: 0 },
  certificateIcon: { alignItems: 'center', backgroundColor: theme.colors.accentSoft, borderRadius: 15, height: 52, justifyContent: 'center', width: 52 },
  certificateCopy: { flex: 1 },
});
