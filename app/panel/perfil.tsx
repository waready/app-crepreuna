import { Image } from 'expo-image';
import { CheckCircle2, Mail, MapPin, Phone, UserRound } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useApiResource } from '@/hooks/use-api-resource';
import { api } from '@/services/api';
import { findRecord, pickString } from '@/services/normalizers';

export default function ProfileScreen() {
  const loadProfile = useCallback(() => api.getPerfil(), []);
  const { data, loading, error } = useApiResource(loadProfile);
  const profile = useMemo(() => normalizeProfile(data), [data]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Image source={require('@/assets/images/cepreuna-logo.png')} style={styles.logo} contentFit="contain" />
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.role}>{profile.role}</Text>
          <View style={styles.badge}>
            <CheckCircle2 color="#0F7A59" size={16} />
            <Text style={styles.badgeText}>{loading ? 'Consultando datos' : 'Datos confirmados'}</Text>
          </View>
        </View>
        {error ? <Text style={styles.errorText}>Modo demo: {error}</Text> : null}
        <Info icon={<UserRound color="#00365A" size={21} />} label="Documento" value={profile.document} />
        <Info icon={<Mail color="#00365A" size={21} />} label="Correo" value={profile.email} />
        <Info icon={<Phone color="#00365A" size={21} />} label="Celular" value={profile.phone} />
        <Info icon={<MapPin color="#00365A" size={21} />} label="Sede" value={profile.location} />
      </ScrollView>
    </SafeAreaView>
  );
}

function normalizeProfile(data: unknown) {
  const record = findRecord(data, ['perfil', 'user', 'usuario', 'estudiante']);
  const name = pickString(record, ['nombre_completo', 'nombres', 'name', 'nombre'], 'Estudiante CEPREUNA');
  const area = pickString(record, ['area', 'programa', 'modalidad'], 'Area Ingenierias');
  const group = pickString(record, ['grupo', 'seccion'], 'Grupo A');
  return {
    name,
    role: `${area} · ${group}`,
    document: pickString(record, ['dni', 'documento', 'nro_documento', 'codigo'], '70894512'),
    email: pickString(record, ['email', 'correo'], 'estudiante@cepreuna.edu.pe'),
    phone: pickString(record, ['telefono', 'celular', 'phone'], '+51 987 654 321'),
    location: pickString(record, ['sede', 'direccion', 'ciudad'], 'Puno'),
  };
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.info}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f3f7fa', flex: 1 },
  container: { gap: 12, padding: 16, paddingBottom: 86 },
  header: { alignItems: 'center', backgroundColor: '#00365A', borderRadius: 8, padding: 22 },
  avatar: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 8, height: 82, justifyContent: 'center', width: 120 },
  logo: { height: 56, width: 98 },
  name: { color: '#ffffff', fontSize: 24, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  role: { color: '#d9ebf5', fontSize: 13, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  badge: { alignItems: 'center', backgroundColor: '#eaf7f1', borderRadius: 8, flexDirection: 'row', gap: 6, marginTop: 14, paddingHorizontal: 11, paddingVertical: 8 },
  badgeText: { color: '#0F7A59', fontSize: 12, fontWeight: '900' },
  info: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 14 },
  infoIcon: { alignItems: 'center', backgroundColor: '#d8edf8', borderRadius: 8, height: 46, justifyContent: 'center', width: 46 },
  infoCopy: { flex: 1 },
  infoLabel: { color: '#687784', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  infoValue: { color: '#00365A', fontSize: 15, fontWeight: '900', marginTop: 3 },
  errorText: { backgroundColor: '#fff8e8', borderColor: '#f1dfb5', borderRadius: 8, borderWidth: 1, color: '#614918', fontSize: 12, fontWeight: '800', lineHeight: 18, padding: 10 },
});
