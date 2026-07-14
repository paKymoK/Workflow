import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageSquare, Send, Star } from 'lucide-react-native';

import { Avatar } from '@/src/components/Avatar';
import { BackHeader } from '@/src/components/BackHeader';
import { colors } from '@/src/theme/colors';
import { NEWS_FILTERS, NEWS_POSTS, REACTIONS, TYPE_COLORS, type NewsPost } from '@/src/data/news';

function NewsDetailScreen({
  post,
  onBack,
  onToggleLike,
  onAddComment,
  onToggleCommentLike,
}: {
  post: NewsPost;
  onBack: () => void;
  onToggleLike: () => void;
  onAddComment: (text: string) => void;
  onToggleCommentLike: (commentId: number) => void;
}) {
  const [input, setInput] = useState('');
  const [myReaction, setMyReaction] = useState<string | null>(post.liked ? 'like' : null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const tc = TYPE_COLORS[post.type] ?? TYPE_COLORS.News;

  const handleReaction = (key: string) => {
    const wasThis = myReaction === key;
    setMyReaction(wasThis ? null : key);
    setShowReactionPicker(false);
    if (key === 'like' || myReaction === 'like') onToggleLike();
  };

  const handleSend = () => {
    if (!input.trim()) return;
    onAddComment(input.trim());
    setInput('');
  };

  const activeReaction = REACTIONS.find((r) => r.key === myReaction);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <BackHeader
        title={post.author}
        onBack={onBack}
        right={
          <Text className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: tc.bg, color: tc.text }}>
            {post.type}
          </Text>
        }
      />
      <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
        {post.img && <Image source={{ uri: post.img }} style={{ width: '100%', height: 220 }} resizeMode="cover" />}

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
            {post.likes + (myReaction && myReaction !== 'like' ? 1 : 0)} reactions · {post.commentList.length} comments
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
            <Text className="text-xs font-semibold" style={{ color: myReaction ? colors.primary : '#6B7A8D' }}>
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
            {post.commentList.length} Comments
          </Text>
          <View className="gap-3">
            {post.commentList.map((c) => (
              <View key={c.id} className="flex-row items-start gap-3">
                <Avatar name={c.author} size="sm" />
                <View className="flex-1">
                  <View className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                    <Text className="mb-1 text-xs font-bold text-gray-900">{c.author}</Text>
                    <Text className="text-sm leading-relaxed text-gray-700">{c.text}</Text>
                  </View>
                  <View className="ml-1 mt-1.5 flex-row items-center gap-3">
                    <Text className="text-[10px] text-gray-400">{c.time}</Text>
                    <Pressable onPress={() => onToggleCommentLike(c.id)} className="flex-row items-center gap-1">
                      <Heart size={11} fill={c.liked ? colors.primary : 'none'} color={c.liked ? colors.primary : '#9CA3AF'} />
                      <Text className="text-[10px] font-semibold" style={{ color: c.liked ? colors.primary : '#9CA3AF' }}>
                        {c.likes > 0 ? `${c.likes} ` : ''}Like
                      </Text>
                    </Pressable>
                    <Text className="text-[10px] font-semibold text-gray-400">Reply</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="flex-row items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
        <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: colors.primary }}>
          <Text className="text-xs font-bold text-white">NL</Text>
        </View>
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

export default function NewsScreen() {
  const [filter, setFilter] = useState<(typeof NEWS_FILTERS)[number]>('All');
  const [posts, setPosts] = useState<NewsPost[]>(NEWS_POSTS);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedPost = posts.find((p) => p.id === selectedId) ?? null;

  const toggleLike = (id: number) =>
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p)));

  const addComment = (id: number, text: string) =>
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, commentList: [...p.commentList, { id: Date.now(), author: 'Nguyen Thi Lan', text, time: 'Just now', liked: false, likes: 0 }] }
          : p,
      ),
    );

  const toggleCommentLike = (postId: number, commentId: number) =>
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              commentList: p.commentList.map((c) => (c.id === commentId ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c)),
            }
          : p,
      ),
    );

  if (selectedPost) {
    return (
      <NewsDetailScreen
        post={selectedPost}
        onBack={() => setSelectedId(null)}
        onToggleLike={() => toggleLike(selectedPost.id)}
        onAddComment={(text) => addComment(selectedPost.id, text)}
        onToggleCommentLike={(cid) => toggleCommentLike(selectedPost.id, cid)}
      />
    );
  }

  const filtered = filter === 'All' ? posts : posts.filter((p) => p.type === filter);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-4 pb-3 pt-4">
        <Text className="text-lg font-bold text-gray-900">News & Events</Text>
        <Text className="text-xs text-gray-400">Company updates & announcements</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3" style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
        {NEWS_FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className="rounded-full px-4 py-1.5"
            style={
              filter === f
                ? { backgroundColor: colors.primary }
                : { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border }
            }
          >
            <Text className="text-xs font-semibold" style={{ color: filter === f ? '#fff' : '#6B7A8D' }}>
              {f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24, gap: 12 }}>
        {filtered.map((post) => {
          const tc = TYPE_COLORS[post.type] ?? TYPE_COLORS.News;
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
              <Pressable onPress={() => setSelectedId(post.id)}>
                <View className="flex-row items-start gap-3 px-4 pb-2 pt-3">
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-sm font-bold text-white">{post.author[0]}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">{post.author}</Text>
                    <View className="mt-0.5 flex-row items-center gap-2">
                      <Text className="text-[10px] text-gray-400">{post.time}</Text>
                      <Text className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: tc.bg, color: tc.text }}>
                        {post.type}
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
                {post.img && <Image source={{ uri: post.img }} style={{ width: '100%', height: 160 }} resizeMode="cover" />}
              </Pressable>
              <View className="flex-row items-center gap-5 border-t border-gray-50 px-4 py-3">
                <Pressable onPress={() => toggleLike(post.id)} className="flex-row items-center gap-1.5">
                  <Heart size={16} fill={post.liked ? '#EF4444' : 'none'} color={post.liked ? '#EF4444' : '#9CA3AF'} />
                  <Text className="text-xs text-gray-500">{post.likes}</Text>
                </Pressable>
                <Pressable onPress={() => setSelectedId(post.id)} className="flex-row items-center gap-1.5">
                  <MessageSquare size={16} color="#9CA3AF" />
                  <Text className="text-xs text-gray-500">{post.commentList.length}</Text>
                </Pressable>
                <View className="flex-1" />
                <Pressable onPress={() => setSelectedId(post.id)}>
                  <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                    Read more →
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
