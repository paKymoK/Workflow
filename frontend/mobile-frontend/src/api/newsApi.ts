import { api } from './axios';

export type ReactionEmoji = 'like' | 'love' | 'celebrate' | 'insightful';

// The backend's NewsType enum — distinct from NEWS_FILTERS' display labels in data/news.ts
// ('News'/'Events'/'Union'/'Recognition'), which map onto these via FILTER_TO_TYPE below.
export type NewsType = 'NEWS' | 'EVENTS' | 'UNION' | 'RECOGNITION';

export const FILTER_TO_TYPE: Record<string, NewsType> = {
  News: 'NEWS',
  Events: 'EVENTS',
  Union: 'UNION',
  Recognition: 'RECOGNITION',
};

export const TYPE_TO_LABEL: Record<NewsType, string> = {
  NEWS: 'News',
  EVENTS: 'Events',
  UNION: 'Union',
  RECOGNITION: 'Recognition',
};

export interface NewsAuthor {
  sub: string;
  name: string;
  title?: string | null;
  avatarUrl?: string | null;
}

export interface NewsPost {
  id: number;
  type: NewsType;
  pinned: boolean;
  title: string;
  body: string;
  imageUrl: string | null;
  isAnonymous: boolean;
  // Null exactly when isAnonymous is true — regardless of who's asking, including the author.
  author: NewsAuthor | null;
  isMine: boolean;
  likeCount: number;
  reactionCounts: Record<ReactionEmoji, number>;
  myReaction: ReactionEmoji | null;
  commentCount: number;
  createdAt: string;
}

export interface NewsComment {
  id: number;
  postId: number;
  commenter: NewsAuthor | null;
  content: string;
  isEdited: boolean;
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
  createdAt: string;
}

interface ResultMessage<T> {
  status: { code: string; message: string };
  data: T;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface NewsPostInput {
  type: NewsType;
  title: string;
  body: string;
  imageUrl?: string | null;
  isAnonymous?: boolean;
}

export async function fetchNewsFeed(type?: NewsType, page = 0, size = 50): Promise<NewsPost[]> {
  const { data } = await api.get<ResultMessage<PageResponse<NewsPost>>>('/employee-service/v1/news', {
    params: { type, page, size },
  });
  return data.data.content;
}

export async function createNewsPost(payload: NewsPostInput): Promise<NewsPost> {
  const { data } = await api.post<ResultMessage<NewsPost>>('/employee-service/v1/news', payload);
  return data.data;
}

export async function updateNewsPost(id: number, payload: NewsPostInput): Promise<NewsPost> {
  const { data } = await api.put<ResultMessage<NewsPost>>(`/employee-service/v1/news/${id}`, payload);
  return data.data;
}

export async function toggleReaction(postId: number, emoji: ReactionEmoji): Promise<NewsPost> {
  const { data } = await api.post<ResultMessage<NewsPost>>(`/employee-service/v1/news/${postId}/reactions`, {
    emoji,
  });
  return data.data;
}

export async function fetchComments(postId: number): Promise<NewsComment[]> {
  const { data } = await api.get<ResultMessage<NewsComment[]>>(`/employee-service/v1/news/${postId}/comments`);
  return data.data;
}

export async function postComment(postId: number, content: string): Promise<NewsComment> {
  const { data } = await api.post<ResultMessage<NewsComment>>(`/employee-service/v1/news/${postId}/comments`, {
    content,
  });
  return data.data;
}

export async function toggleCommentLike(commentId: number): Promise<NewsComment> {
  const { data } = await api.post<ResultMessage<NewsComment>>(
    `/employee-service/v1/news/comments/${commentId}/like`,
  );
  return data.data;
}
