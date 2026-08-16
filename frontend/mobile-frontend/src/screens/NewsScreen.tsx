import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Heart,
  MessageSquare,
  Send,
  Star,
  Plus,
  Pencil,
  ChevronDown,
  X,
  Image as ImageIcon,
} from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary } from 'react-native-image-picker';

import { Avatar } from '@/src/components/Avatar';
import { BackHeader } from '@/src/components/BackHeader';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/auth/AuthContext';
import { useProfile } from '@/src/data/useProfile';
import { uploadFile, getFileUrl } from '@/src/api/mediaApi';
import { NEWS_FILTERS, REACTIONS, TYPE_COLORS } from '@/src/data/news';
import {
  FILTER_TO_TYPE,
  TYPE_TO_LABEL,
  createNewsPost,
  fetchComments,
  fetchNewsFeed,
  postComment,
  toggleCommentLike,
  toggleReaction,
  updateNewsPost,
  type NewsComment,
  type NewsPost,
  type NewsPostInput,
  type NewsType,
  type ReactionEmoji,
} from '@/src/api/newsApi';

const TYPE_OPTIONS: NewsType[] = ['NEWS', 'EVENTS', 'UNION', 'RECOGNITION'];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function authorName(author: NewsPost['author']): string {
  return author?.name ?? 'Anonymous';
}

// Admin-only for now — creating/editing your own post as a regular employee is designed
// server-side already (see employee-service's NewsController), but exposing it in the mobile
// UI is pending a business decision, so the entry points here are gated to ADMIN only.
function NewsComposeScreen({
  initialPost,
  onDone,
  onCancel,
}: {
  initialPost: NewsPost | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!initialPost;
  const [type, setType] = useState<NewsType>(initialPost?.type ?? 'NEWS');
  const [title, setTitle] = useState(initialPost?.title ?? '');
  const [body, setBody] = useState(initialPost?.body ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(initialPost?.imageUrl ?? null);
  const [isAnonymous, setIsAnonymous] = useState(initialPost?.isAnonymous ?? false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const openCategoryPicker = () => {
    Alert.alert('Select Category', undefined, [
      ...TYPE_OPTIONS.map((option) => ({
        text: TYPE_TO_LABEL[option],
        onPress: () => setType(option),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const handlePickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
    if (result.didCancel) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    setUploadingImage(true);
    try {
      const uploaded = await uploadFile({
        uri: asset.uri,
        name: asset.fileName ?? 'post.jpg',
        type: asset.type ?? 'image/jpeg',
      });
      setImageUrl(getFileUrl(uploaded.id, uploaded.extension));
    } catch {
      Alert.alert('Could not upload image', 'Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const submitMutation = useMutation({
    mutationFn: () => {
      const payload: NewsPostInput = { type, title: title.trim(), body: body.trim(), imageUrl, isAnonymous };
      return isEdit ? updateNewsPost(initialPost!.id, payload) : createNewsPost(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      onDone();
    },
    onError: () => Alert.alert('Could not save post', 'Please try again.'),
  });

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !submitMutation.isPending;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
        <Pressable onPress={onCancel}>
          <Text className="text-sm text-gray-500">Cancel</Text>
        </Pressable>
        <Text className="text-sm font-bold text-gray-900">{isEdit ? 'Edit Post' : 'New Post'}</Text>
        <Pressable onPress={() => submitMutation.mutate()} disabled={!canSubmit}>
          {submitMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text className="text-sm font-bold" style={canSubmit ? styles.composeSubmitActive : styles.composeSubmitInactive}>
              {isEdit ? 'Save' : 'Post'}
            </Text>
          )}
        </Pressable>
      </View>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1 px-4" contentContainerStyle={styles.composeScrollContent}>
          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">Category</Text>
            <Pressable
              onPress={openCategoryPicker}
              className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5"
            >
              <Text className="text-sm text-gray-800">{TYPE_TO_LABEL[type]}</Text>
              <ChevronDown size={16} color="#9CA3AF" />
            </Pressable>
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">Title</Text>
            <TextInput
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800"
              placeholder="Post title"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">Body</Text>
            <TextInput
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800"
              style={styles.bodyInput}
              placeholder="Write your post..."
              placeholderTextColor="#9CA3AF"
              value={body}
              onChangeText={setBody}
              multiline
            />
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">Photo (optional)</Text>
            {imageUrl ? (
              <View className="relative">
                <Image source={{ uri: imageUrl }} style={styles.composeImagePreview} resizeMode="cover" />
                <Pressable
                  onPress={() => setImageUrl(null)}
                  className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full bg-black/60"
                >
                  <X size={14} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handlePickImage}
                disabled={uploadingImage}
                className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-4"
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <ImageIcon size={16} color="#9CA3AF" />
                    <Text className="text-xs text-gray-500">Add a photo</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>

          <View className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-medium text-gray-800">Post anonymously</Text>
              <Text className="mt-0.5 text-[11px] text-gray-400">Your name won't be shown to other employees</Text>
            </View>
            <Switch value={isAnonymous} onValueChange={setIsAnonymous} trackColor={{ true: colors.primary, false: undefined }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function NewsDetailScreen({
  post,
  isAdmin,
  onBack,
  onEdit,
}: {
  post: NewsPost;
  isAdmin: boolean;
  onBack: () => void;
  onEdit: () => void;
}) {
  const queryClient = useQueryClient();
  const PROFILE = useProfile();
  const [input, setInput] = useState('');
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const tc = TYPE_COLORS[TYPE_TO_LABEL[post.type]] ?? TYPE_COLORS.News;

  const { data: comments = [] } = useQuery({
    queryKey: ['news-comments', post.id],
    queryFn: () => fetchComments(post.id),
  });

  const reactMutation = useMutation({
    mutationFn: (emoji: ReactionEmoji) => toggleReaction(post.id, emoji),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] }),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => postComment(post.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });

  const commentLikeMutation = useMutation({
    mutationFn: (commentId: number) => toggleCommentLike(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news-comments', post.id] }),
  });

  const handleReaction = (key: ReactionEmoji) => {
    setShowReactionPicker(false);
    reactMutation.mutate(key);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    commentMutation.mutate(input.trim());
    setInput('');
  };

  const activeReaction = REACTIONS.find((r) => r.key === post.myReaction);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <BackHeader
        title={authorName(post.author)}
        onBack={onBack}
        right={
          <View className="flex-row items-center gap-2">
            {isAdmin && post.isMine && (
              <Pressable
                onPress={onEdit}
                className="h-7 w-7 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.surface }}
              >
                <Pencil size={13} color={colors.primary} />
              </Pressable>
            )}
            <Text className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: tc.bg, color: tc.text }}>
              {TYPE_TO_LABEL[post.type]}
            </Text>
          </View>
        }
      />
      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={styles.detailScrollContent}>
        {post.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.detailHeaderImage} resizeMode="cover" />}

        <View className="bg-white px-5 pb-4 pt-5">
          {post.pinned && (
            <View className="mb-3 flex-row items-center gap-1.5">
              <Star size={11} color={colors.primary} />
              <Text className="text-[10px] font-bold uppercase tracking-wide" style={{ color: colors.primary }}>
                Pinned Post
              </Text>
            </View>
          )}
          <Text className="mb-4 text-lg font-black leading-snug text-gray-900">{post.title}</Text>
          {post.body.split('\n').map((line, i) =>
            line ? (
              <Text key={i} className="mb-2 text-sm leading-relaxed text-gray-700">
                {line}
              </Text>
            ) : (
              <View key={i} className="h-2" />
            ),
          )}
        </View>

        <View className="mt-1 flex-row items-center gap-2 border-t border-gray-50 bg-white px-5 py-3">
          {activeReaction && <Text className="text-base">{activeReaction.emoji}</Text>}
          <Text className="flex-1 text-xs text-gray-500">
            {post.likeCount} reactions · {post.commentCount} comments
          </Text>
        </View>

        <View className="relative flex-row items-center border-b border-t border-gray-100 bg-white px-2 py-1">
          {showReactionPicker && (
            <View className="absolute bottom-full left-4 z-10 mb-2 flex-row gap-3 rounded-2xl border border-gray-100 bg-white px-3 py-2 shadow-xl">
              {REACTIONS.map((r) => (
                <Pressable key={r.key} onPress={() => handleReaction(r.key)} className="items-center gap-1">
                  <Text className="text-xl">{r.emoji}</Text>
                  <Text className="text-[9px] font-medium text-gray-500">{r.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5"
            onLongPress={() => setShowReactionPicker(true)}
            onPress={() => (showReactionPicker ? setShowReactionPicker(false) : handleReaction('like'))}
          >
            <Text className="text-base leading-none">{activeReaction ? activeReaction.emoji : '👍'}</Text>
            <Text className="text-xs font-semibold" style={post.myReaction ? styles.reactTextActive : styles.reactTextInactive}>
              {activeReaction ? activeReaction.label : 'React'}
            </Text>
          </Pressable>
          <View className="h-5 w-px bg-gray-100" />
          <View className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5">
            <MessageSquare size={16} color="#9CA3AF" />
            <Text className="text-xs font-semibold text-gray-500">Comment</Text>
          </View>
          <View className="h-5 w-px bg-gray-100" />
          <View className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5">
            <Send size={15} color="#9CA3AF" />
            <Text className="text-xs font-semibold text-gray-500">Share</Text>
          </View>
        </View>

        <View className="px-4 pb-4 pt-4">
          <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">
            {comments.length} Comments
          </Text>
          <View className="gap-3">
            {comments.map((c: NewsComment) => (
              <View key={c.id} className="flex-row items-start gap-3">
                <Avatar name={c.commenter?.name ?? '?'} size="sm" />
                <View className="flex-1">
                  <View className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                    <Text className="mb-1 text-xs font-bold text-gray-900">{c.commenter?.name ?? 'Unknown'}</Text>
                    <Text className="text-sm leading-relaxed text-gray-700">{c.content}</Text>
                  </View>
                  <View className="ml-1 mt-1.5 flex-row items-center gap-3">
                    <Text className="text-[10px] text-gray-400">{timeAgo(c.createdAt)}</Text>
                    <Pressable onPress={() => commentLikeMutation.mutate(c.id)} className="flex-row items-center gap-1">
                      <Heart size={11} fill={c.likedByMe ? colors.primary : 'none'} color={c.likedByMe ? colors.primary : '#9CA3AF'} />
                      <Text className="text-[10px] font-semibold" style={c.likedByMe ? styles.commentLikeTextActive : styles.commentLikeTextInactive}>
                        {c.likeCount > 0 ? `${c.likeCount} ` : ''}Like
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="flex-row items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
        {PROFILE.avatarUrl ? (
          <Image source={{ uri: PROFILE.avatarUrl }} className="h-8 w-8 rounded-full" />
        ) : (
          <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
            <Text className="text-xs font-bold text-white">{PROFILE.initials}</Text>
          </View>
        )}
        <View className="flex-1 flex-row items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5">
          <TextInput
            className="flex-1 text-sm text-gray-800"
            placeholder="Write a comment..."
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
          />
          {input.trim().length > 0 && (
            <Pressable onPress={handleSend}>
              <Send size={16} color={colors.primary} />
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

type NewsView = { kind: 'list' } | { kind: 'detail'; postId: number } | { kind: 'compose'; postId?: number };

export default function NewsScreen() {
  const [filter, setFilter] = useState<(typeof NEWS_FILTERS)[number]>('All');
  const [view, setView] = useState<NewsView>({ kind: 'list' });
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN') ?? false;

  const queryClient = useQueryClient();
  const type = filter === 'All' ? undefined : FILTER_TO_TYPE[filter];
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['news', type],
    queryFn: () => fetchNewsFeed(type),
  });

  const reactMutation = useMutation({
    mutationFn: (postId: number) => toggleReaction(postId, 'like'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] }),
  });

  if (view.kind === 'compose') {
    const editingPost = view.postId != null ? (posts.find((p) => p.id === view.postId) ?? null) : null;
    const back = () => setView(editingPost ? { kind: 'detail', postId: editingPost.id } : { kind: 'list' });
    return <NewsComposeScreen initialPost={editingPost} onDone={back} onCancel={back} />;
  }

  const selectedPost = view.kind === 'detail' ? (posts.find((p) => p.id === view.postId) ?? null) : null;

  if (selectedPost) {
    return (
      <NewsDetailScreen
        post={selectedPost}
        isAdmin={isAdmin}
        onBack={() => setView({ kind: 'list' })}
        onEdit={() => setView({ kind: 'compose', postId: selectedPost.id })}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-4 pb-3 pt-4">
        <Text className="text-lg font-bold text-gray-900">News & Events</Text>
        <Text className="text-xs text-gray-400">Company updates & announcements</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3" style={styles.filterScroll} contentContainerStyle={styles.filterScrollContent}>
        {NEWS_FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className="rounded-full px-4 py-1.5"
            style={filter === f ? styles.filterChipActive : styles.filterChipInactive}
          >
            <Text className="text-xs font-semibold" style={filter === f ? styles.filterTextActive : styles.filterTextInactive}>
              {f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : posts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-sm text-gray-400">No posts yet.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerStyle={styles.feedScrollContent}>
          {posts.map((post) => {
            const tc = TYPE_COLORS[TYPE_TO_LABEL[post.type]] ?? TYPE_COLORS.News;
            return (
              <View key={post.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {post.pinned && (
                  <View className="flex-row items-center gap-1.5 px-4 pb-1 pt-3">
                    <Star size={11} color={colors.primary} />
                    <Text className="text-[10px] font-bold uppercase tracking-wide" style={{ color: colors.primary }}>
                      Pinned
                    </Text>
                  </View>
                )}
                <Pressable onPress={() => setView({ kind: 'detail', postId: post.id })}>
                  <View className="flex-row items-start gap-3 px-4 pb-2 pt-3">
                    <View
                      className="h-9 w-9 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Text className="text-sm font-bold text-white">{authorName(post.author)[0]}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900">{authorName(post.author)}</Text>
                      <View className="mt-0.5 flex-row items-center gap-2">
                        <Text className="text-[10px] text-gray-400">{timeAgo(post.createdAt)}</Text>
                        <Text className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: tc.bg, color: tc.text }}>
                          {TYPE_TO_LABEL[post.type]}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="px-4 pb-2">
                    <Text className="mb-1.5 text-sm font-bold leading-snug text-gray-900">{post.title}</Text>
                    <Text className="text-xs leading-relaxed text-gray-600" numberOfLines={3}>
                      {post.body}
                    </Text>
                  </View>
                  {post.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.feedImage} resizeMode="cover" />}
                </Pressable>
                <View className="flex-row items-center gap-5 border-t border-gray-50 px-4 py-3">
                  <Pressable onPress={() => reactMutation.mutate(post.id)} className="flex-row items-center gap-1.5">
                    <Heart size={16} fill={post.myReaction ? '#EF4444' : 'none'} color={post.myReaction ? '#EF4444' : '#9CA3AF'} />
                    <Text className="text-xs text-gray-500">{post.likeCount}</Text>
                  </Pressable>
                  <Pressable onPress={() => setView({ kind: 'detail', postId: post.id })} className="flex-row items-center gap-1.5">
                    <MessageSquare size={16} color="#9CA3AF" />
                    <Text className="text-xs text-gray-500">{post.commentCount}</Text>
                  </Pressable>
                  <View className="flex-1" />
                  <Pressable onPress={() => setView({ kind: 'detail', postId: post.id })}>
                    <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                      Read more →
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {isAdmin && (
        <Pressable
          onPress={() => setView({ kind: 'compose' })}
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full shadow-lg"
          style={{ backgroundColor: colors.primary }}
        >
          <Plus size={24} color="#fff" />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  composeSubmitActive: {
    color: colors.primary,
  },
  composeSubmitInactive: {
    color: '#D1D5DB',
  },
  composeScrollContent: {
    paddingVertical: 16,
    gap: 14,
  },
  bodyInput: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  composeImagePreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  detailScrollContent: {
    paddingBottom: 24,
  },
  detailHeaderImage: {
    width: '100%',
    height: 220,
  },
  reactTextActive: {
    color: colors.primary,
  },
  reactTextInactive: {
    color: '#6B7A8D',
  },
  commentLikeTextActive: {
    color: colors.primary,
  },
  commentLikeTextInactive: {
    color: '#9CA3AF',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterScrollContent: {
    gap: 8,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipInactive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTextActive: {
    color: '#fff',
  },
  filterTextInactive: {
    color: '#6B7A8D',
  },
  feedScrollContent: {
    paddingBottom: 24,
    gap: 12,
  },
  feedImage: {
    width: '100%',
    height: 160,
  },
});
