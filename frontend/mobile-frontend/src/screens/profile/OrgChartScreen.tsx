import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft, Camera, Building, Package, MapPin, Clock, User, Phone, Mail } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/auth/AuthContext';
import { fetchOrgChart } from '@/src/api/employeesApi';
import { useProfile } from '@/src/data/useProfile';
import { useAvatarUpload } from '@/src/data/useAvatarUpload';

function OrgNode({
  name,
  role,
  isSelf,
  isManager,
  compact,
}: {
  name: string;
  role: string;
  isSelf?: boolean;
  isManager?: boolean;
  compact?: boolean;
}) {
  const initials = name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();
  return (
    <View
      className={`flex-row items-center gap-2.5 rounded-xl border ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
      style={isSelf ? styles.nodeSelf : isManager ? styles.nodeManager : styles.nodeDefault}
    >
      <View
        className={`items-center justify-center rounded-full ${compact ? 'h-7 w-7' : 'h-9 w-9'}`}
        style={isSelf ? styles.avatarBgSelf : styles.avatarBgOther}
      >
        <Text className={`font-bold text-white ${compact ? 'text-[10px]' : 'text-xs'}`}>{initials}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className={`font-bold ${compact ? 'text-[11px]' : 'text-sm'}`}
          style={isSelf ? styles.nameTextSelf : styles.nameTextOther}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text className={compact ? 'text-[9px]' : 'text-[10px]'} style={isSelf ? styles.roleTextSelf : styles.roleTextOther} numberOfLines={1}>
          {role}
        </Text>
      </View>
      {isSelf && (
        <Text className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white/70">YOU</Text>
      )}
    </View>
  );
}

export default function OrgChartScreen() {
  const [tab, setTab] = useState<'info' | 'org'>('info');
  const navigation = useNavigation();
  const PROFILE = useProfile();
  const { user } = useAuth();
  const { choosePhoto, uploading } = useAvatarUpload();

  const { data: orgChart } = useQuery({
    queryKey: ['org-chart', user?.sub],
    queryFn: () => fetchOrgChart(user!.sub),
    enabled: !!user?.sub,
  });

  const chain =
    orgChart?.chain.map((n) => ({
      name: n.name,
      role: n.title ?? '',
      isSelf: n.self,
      isManager: n.manager,
    })) ?? [];
  const reports = orgChart?.reports.map((n) => ({ name: n.name, role: n.title ?? '' })) ?? [];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[colors.primaryDark, colors.primary, colors.primaryMid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={styles.headerGradientFill}
        />
        <View className="mb-4 flex-row items-center gap-2">
          <Pressable
            onPress={() => navigation.goBack()}
            className="h-8 w-8 items-center justify-center rounded-full"
            style={styles.backButtonBg}
          >
            <ArrowLeft size={17} color="#fff" />
          </Pressable>
          <Text className="text-sm font-bold text-white">My Profile</Text>
        </View>
        <View className="mb-4 flex-row items-center gap-4">
          <View className="relative">
            {PROFILE.avatarUrl ? (
              <Image
                source={{ uri: PROFILE.avatarUrl }}
                className="h-[72px] w-[72px] rounded-full"
                style={styles.avatarImageBorder}
              />
            ) : (
              <View
                className="h-[72px] w-[72px] items-center justify-center rounded-full"
                style={styles.avatarPlaceholder}
              >
                <Text className="text-xl font-bold text-white">{PROFILE.initials}</Text>
              </View>
            )}
            <Pressable
              onPress={choosePhoto}
              disabled={uploading}
              className="absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-full bg-white shadow"
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Camera size={11} color={colors.primary} />
              )}
            </Pressable>
          </View>
          <View>
            <Text className="text-lg font-bold leading-tight text-white">{PROFILE.name}</Text>
            <Text className="mt-0.5 text-xs text-blue-200">{PROFILE.title}</Text>
            <Text className="mt-1 text-[10px] text-blue-300">
              LDAP: {PROFILE.employeeId} · Joined {PROFILE.joined}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          {(['info', 'org'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className="rounded-full px-5 py-1.5"
              style={tab === t ? styles.tabActive : styles.tabInactive}
            >
              <Text className="text-xs font-bold" style={tab === t ? styles.tabTextActive : styles.tabTextInactive}>
                {t === 'info' ? 'Profile Info' : 'Org Chart'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scrollContent}>
        {tab === 'info' ? (
          <>
            <View className="rounded-2xl bg-white p-4 shadow-sm">
              <Text className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Work Information</Text>
              {[
                { icon: Building, label: 'Department', value: PROFILE.department },
                { icon: Package, label: 'Production Line', value: PROFILE.line },
                { icon: MapPin, label: 'Work Location', value: PROFILE.workLocation },
                { icon: Clock, label: 'Shift', value: PROFILE.shiftHours },
                { icon: User, label: 'Direct Manager', value: PROFILE.manager },
              ].map(({ icon: Icon, label, value }, i, arr) => (
                <View key={label} className={`flex-row items-center gap-3 py-2.5 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.surface }}>
                    <Icon size={15} color={colors.primary} />
                  </View>
                  <View>
                    <Text className="text-[10px] text-gray-400">{label}</Text>
                    <Text className="text-sm font-semibold text-gray-800">{value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View className="rounded-2xl bg-white p-4 shadow-sm">
              <Text className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Contact Information</Text>
              {[
                { icon: Phone, label: 'Mobile', value: PROFILE.mobile },
                { icon: Mail, label: 'Work Email', value: PROFILE.email },
              ].map(({ icon: Icon, label, value }, i, arr) => (
                <View key={label} className={`flex-row items-center gap-3 py-2.5 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.surface }}>
                    <Icon size={15} color={colors.primary} />
                  </View>
                  <View>
                    <Text className="text-[10px] text-gray-400">{label}</Text>
                    <Text className="text-sm font-semibold text-gray-800">{value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View className="rounded-2xl bg-white p-5 shadow-sm">
            <Text className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Organization Chart</Text>
            {chain.map((node, i) => (
              <View key={node.name}>
                <OrgNode {...node} />
                {i < chain.length - 1 && (
                  <View className="my-2 items-center">
                    <View className="h-5 w-0.5 rounded-full bg-slate-300" />
                  </View>
                )}
              </View>
            ))}
            <View className="mt-4">
              <Text className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide text-gray-400">Direct Reports</Text>
              <View className="flex-row gap-2">
                {reports.map((p) => (
                  <View key={p.name} className="min-w-0 flex-1">
                    <OrgNode name={p.name} role={p.role} compact />
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  nodeSelf: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  nodeManager: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
  },
  nodeDefault: {
    backgroundColor: '#F8FAFC',
    borderColor: colors.border,
    borderWidth: 1.5,
  },
  avatarBgSelf: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  avatarBgOther: {
    backgroundColor: colors.primary,
  },
  nameTextSelf: {
    color: 'white',
  },
  nameTextOther: {
    color: '#1A2740',
  },
  roleTextSelf: {
    color: 'rgba(255,255,255,0.7)',
  },
  roleTextOther: {
    color: colors.textMuted,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerGradientFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButtonBg: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  avatarImageBorder: {
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  tabActive: {
    backgroundColor: 'white',
  },
  tabInactive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabTextInactive: {
    color: 'rgba(255,255,255,0.85)',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
});
