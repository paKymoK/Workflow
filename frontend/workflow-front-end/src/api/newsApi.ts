import type { PageResponse, ResultMessage } from "./types.ts";
import { api } from "@takypok/shared";

// Mirrors employee-service's NewsType enum — see frontend/mobile-front-end/src/api/newsApi.ts
// for the mobile-side twin of this file (same backend, same contract).
export type NewsType = "NEWS" | "EVENTS" | "UNION" | "RECOGNITION";

export const TYPE_TO_LABEL: Record<NewsType, string> = {
  NEWS: "News",
  EVENTS: "Events",
  UNION: "Union",
  RECOGNITION: "Recognition",
};

export type ReactionEmoji = "like" | "love" | "celebrate" | "insightful";

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

export interface NewsPostInput {
  type: NewsType;
  title: string;
  body: string;
  imageUrl?: string | null;
  isAnonymous?: boolean;
}

export async function fetchNewsFeed(type?: NewsType, page = 0, size = 50) {
  const { data } = await api.get<ResultMessage<PageResponse<NewsPost>>>("/employee-service/v1/news", {
    params: { type, page, size },
  });
  return data.data;
}

export async function createNewsPost(payload: NewsPostInput) {
  const { data } = await api.post<ResultMessage<NewsPost>>("/employee-service/v1/news", payload);
  return data.data;
}

export async function updateNewsPost(id: number, payload: NewsPostInput) {
  const { data } = await api.put<ResultMessage<NewsPost>>(`/employee-service/v1/news/${id}`, payload);
  return data.data;
}

export async function deleteNewsPost(id: number) {
  await api.delete<ResultMessage<void>>(`/employee-service/v1/news/${id}`);
}

export async function setNewsPostPinned(id: number, pinned: boolean) {
  const { data } = await api.patch<ResultMessage<NewsPost>>(`/employee-service/v1/news/${id}/pin`, { pinned });
  return data.data;
}

export async function fetchNewsComments(postId: number) {
  const { data } = await api.get<ResultMessage<NewsComment[]>>(`/employee-service/v1/news/${postId}/comments`);
  return data.data;
}

export async function deleteNewsComment(commentId: number) {
  await api.delete<ResultMessage<void>>(`/employee-service/v1/news/comments/${commentId}`);
}
