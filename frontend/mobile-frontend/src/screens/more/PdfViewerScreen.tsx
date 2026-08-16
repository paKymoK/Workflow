import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Linking, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { ArrowLeft, FileX } from 'lucide-react-native';
import Pdf from 'react-native-pdf';

import { colors } from '@/src/theme/colors';
import type { MoreStackParamList } from '@/src/navigation/types';

export default function PdfViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MoreStackParamList, 'PdfViewer'>>();
  const { uri, title } = route.params;
  const [failed, setFailed] = useState(false);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-4 pb-3 pt-4">
        <Pressable onPress={() => navigation.goBack()} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <Text className="flex-1 text-sm font-bold text-gray-900" numberOfLines={1}>
          {title}
        </Text>
      </View>

      {failed ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <FileX size={32} color="#D1D5DB" />
          <Text className="text-center text-sm font-semibold text-gray-500">Could not display this PDF</Text>
          <Pressable
            onPress={() => Linking.openURL(uri).catch(() => Alert.alert('Could not open file'))}
            className="rounded-2xl px-5 py-3"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-sm font-bold text-white">Open Externally</Text>
          </Pressable>
        </View>
      ) : (
        <Pdf
          source={{ uri, cache: true }}
          style={styles.pdf}
          onError={() => setFailed(true)}
          renderActivityIndicator={() => <ActivityIndicator color={colors.primary} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pdf: { flex: 1, backgroundColor: colors.background },
});
