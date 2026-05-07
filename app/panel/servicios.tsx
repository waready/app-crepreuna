import { router } from 'expo-router';
import {
  BookUser,
  CalendarDays,
  ClipboardCheck,
  Clock,
  CreditCard,
  FileText,
  Headphones,
  HelpCircle,
  MessageSquareText,
  Settings,
  ShieldQuestion,
  UserCog,
  Youtube,
} from 'lucide-react-native';
import type React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ServicesScreen() {
  const serviceSections = [
    {
      title: 'Estudiante',
      items: [
        { icon: <BookUser color="#00365A" size={25} />, title: 'Perfil academico', text: 'Datos del estudiante y estado de matricula.', route: '/panel/perfil' },
        { icon: <CreditCard color="#00365A" size={25} />, title: 'Pagos', text: 'Pensiones, vouchers y estado financiero.', route: '/panel/pagos' },
        { icon: <ClipboardCheck color="#00365A" size={25} />, title: 'Asistencia', text: 'Historial de asistencia, tardanzas y faltas.', route: '/panel/asistencia' },
      ],
    },
    {
      title: 'Docente y administracion',
      items: [
        { icon: <UserCog color="#00365A" size={25} />, title: 'Panel docente', text: 'Horarios, recursos, sesiones y asistencia docente.', route: '/panel/docente' },
        { icon: <Settings color="#00365A" size={25} />, title: 'Administracion', text: 'Usuarios, roles, permisos y reportes.', route: '/panel/admin' },
      ],
    },
    {
      title: 'Soporte institucional',
      items: [
        { icon: <ShieldQuestion color="#00365A" size={25} />, title: 'Libro de reclamaciones', text: 'Registra consultas, reclamos y seguimiento.', route: '/panel/reclamaciones' },
        { icon: <FileText color="#00365A" size={25} />, title: 'Documentos', text: 'Constancias, comunicados y materiales oficiales.' },
        { icon: <MessageSquareText color="#00365A" size={25} />, title: 'Comunicados', text: 'Avisos importantes del ciclo vigente.' },
        { icon: <HelpCircle color="#00365A" size={25} />, title: 'Mesa de ayuda', text: 'Orientacion para problemas de cuenta o plataforma.' },
      ],
    },
  ];

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Servicios</Text>
          <Text style={styles.title}>Centro de atencion</Text>
          <Text style={styles.subtitle}>Gestiona tus recursos academicos desde un solo lugar.</Text>
        </View>

        <View style={styles.featuredCard}>
          <View style={styles.featuredIcon}>
            <Headphones color="#ffffff" size={26} />
          </View>
          <View style={styles.featuredCopy}>
            <Text style={styles.featuredTitle}>Soporte CEPREUNA</Text>
            <Text style={styles.featuredText}>Canales disponibles para consultas sobre acceso, matricula y cursos.</Text>
          </View>
        </View>

        <View style={styles.seminarCard}>
          <View style={styles.seminarTop}>
            <View>
              <Text style={styles.seminarLabel}>Proximo seminario</Text>
              <Text style={styles.seminarTitle}>Estrategias para simulacros</Text>
            </View>
            <View style={styles.youtubeButton}>
              <Youtube color="#ffffff" size={21} />
            </View>
          </View>
          <View style={styles.seminarMeta}>
            <Meta icon={<CalendarDays color="#006CAF" size={15} />} text="Sabado 25" />
            <Meta icon={<Clock color="#006CAF" size={15} />} text="10:00 AM" />
          </View>
          <Text style={styles.seminarText}>Material PDF y grabacion disponible despues de la sesion.</Text>
        </View>

        {serviceSections.map((section) => (
          <View key={section.title} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <ServiceItem key={item.title} {...item} />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.meta}>
      {icon}
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function ServiceItem({ icon, title, text, route }: { icon: React.ReactNode; title: string; text: string; route?: string }) {
  const content = (
    <>
      <View style={styles.icon}>{icon}</View>
      <View style={styles.copy}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemText}>{text}</Text>
      </View>
    </>
  );

  if (route) {
    return (
      <Pressable style={styles.item} onPress={() => router.push(route as never)}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.item}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f3f7fa',
    flex: 1,
  },
  container: {
    gap: 12,
    padding: 16,
    paddingBottom: 86,
  },
  header: {
    backgroundColor: '#ffffff',
    borderColor: '#e1ebf2',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  kicker: {
    color: '#006CAF',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: '#00365A',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 32,
    marginTop: 4,
  },
  subtitle: {
    color: '#687784',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  featuredCard: {
    alignItems: 'center',
    backgroundColor: '#00365A',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 13,
    padding: 16,
  },
  featuredIcon: {
    alignItems: 'center',
    backgroundColor: '#006CAF',
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  featuredCopy: {
    flex: 1,
  },
  featuredTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  featuredText: {
    color: '#d9ebf5',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  seminarCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e1ebf2',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  seminarTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  seminarLabel: {
    color: '#006CAF',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  seminarTitle: {
    color: '#00365A',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },
  youtubeButton: {
    alignItems: 'center',
    backgroundColor: '#BF211E',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  seminarMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  meta: {
    alignItems: 'center',
    backgroundColor: '#eef7fc',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  metaText: {
    color: '#006CAF',
    fontSize: 11,
    fontWeight: '900',
  },
  seminarText: {
    color: '#687784',
    fontSize: 12,
    lineHeight: 18,
  },
  item: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e1ebf2',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 15,
  },
  sectionBlock: {
    gap: 9,
  },
  sectionTitle: {
    color: '#00365A',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 4,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: '#d8edf8',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  copy: {
    flex: 1,
  },
  itemTitle: {
    color: '#00365A',
    fontSize: 16,
    fontWeight: '900',
  },
  itemText: {
    color: '#687784',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
});
