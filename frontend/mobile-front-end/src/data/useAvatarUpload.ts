import { Alert } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/src/auth/AuthContext';
import { updateAvatar } from '@/src/api/employeesApi';
import { uploadFile, getFileUrl, type PickedFile } from '@/src/api/mediaApi';

async function pickImage(source: 'camera' | 'library'): Promise<PickedFile | null> {
  const result =
    source === 'camera'
      ? await launchCamera({ mediaType: 'photo' })
      : await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });

  if (result.didCancel) return null;
  const asset = result.assets?.[0];
  if (!asset?.uri) {
    if (result.errorCode) {
      Alert.alert('Could not open camera/library', result.errorMessage ?? 'Please try again.');
    }
    return null;
  }
  return { uri: asset.uri, name: asset.fileName ?? 'avatar.jpg', type: asset.type ?? 'image/jpeg' };
}

// Shared by every screen with a camera-badge avatar (ProfileMenuScreen, OrgChartScreen) so the
// upload → save → cache-invalidate sequence lives in one place.
export function useAvatarUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sub = user?.sub;

  const mutation = useMutation({
    mutationFn: async (picked: PickedFile) => {
      const uploaded = await uploadFile(picked);
      await updateAvatar(sub!, getFileUrl(uploaded.id, uploaded.extension));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee', sub] }),
    onError: () => Alert.alert('Could not update photo', 'Please try again.'),
  });

  function choosePhoto() {
    if (!sub) return;
    Alert.alert('Change Profile Photo', undefined, [
      {
        text: 'Take Photo',
        onPress: async () => {
          const picked = await pickImage('camera');
          if (picked) mutation.mutate(picked);
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const picked = await pickImage('library');
          if (picked) mutation.mutate(picked);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return { choosePhoto, uploading: mutation.isPending };
}
