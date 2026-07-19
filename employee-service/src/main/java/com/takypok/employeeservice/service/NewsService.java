package com.takypok.employeeservice.service;

import com.takypok.core.model.PageResponse;
import com.takypok.employeeservice.model.request.CreateNewsCommentRequest;
import com.takypok.employeeservice.model.request.CreateNewsPostRequest;
import com.takypok.employeeservice.model.request.FilterNewsRequest;
import com.takypok.employeeservice.model.request.UpdateNewsCommentRequest;
import com.takypok.employeeservice.model.request.UpdateNewsPostRequest;
import com.takypok.employeeservice.model.response.NewsCommentResponse;
import com.takypok.employeeservice.model.response.NewsPostResponse;
import java.util.List;
import reactor.core.publisher.Mono;

public interface NewsService {
  Mono<PageResponse<NewsPostResponse>> list(FilterNewsRequest request, String currentSub);

  Mono<NewsPostResponse> getById(Long id, String currentSub);

  Mono<NewsPostResponse> create(CreateNewsPostRequest request, String currentSub);

  Mono<NewsPostResponse> update(Long id, UpdateNewsPostRequest request, String currentSub);

  Mono<NewsPostResponse> setPinned(Long id, boolean pinned, String currentSub);

  Mono<Void> delete(Long id, String currentSub, boolean isAdmin);

  Mono<NewsPostResponse> toggleReaction(Long id, String emoji, String currentSub);

  Mono<List<NewsCommentResponse>> getComments(Long postId, String currentSub);

  Mono<NewsCommentResponse> addComment(
      Long postId, CreateNewsCommentRequest request, String currentSub);

  Mono<NewsCommentResponse> updateComment(
      Long commentId, UpdateNewsCommentRequest request, String currentSub);

  Mono<Void> deleteComment(Long commentId, String currentSub, boolean isAdmin);

  Mono<NewsCommentResponse> toggleCommentLike(Long commentId, String currentSub);
}
