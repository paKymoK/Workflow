package com.takypok.employeeservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.PageResponse;
import com.takypok.employeeservice.exception.NewsCommentNotFoundException;
import com.takypok.employeeservice.exception.NewsPostNotFoundException;
import com.takypok.employeeservice.model.entity.ContentStatus;
import com.takypok.employeeservice.model.entity.Employee;
import com.takypok.employeeservice.model.entity.EmploymentStatus;
import com.takypok.employeeservice.model.entity.NewsComment;
import com.takypok.employeeservice.model.entity.NewsCommentLike;
import com.takypok.employeeservice.model.entity.NewsPost;
import com.takypok.employeeservice.model.entity.NewsReaction;
import com.takypok.employeeservice.model.request.CreateNewsCommentRequest;
import com.takypok.employeeservice.model.request.CreateNewsPostRequest;
import com.takypok.employeeservice.model.request.FilterNewsRequest;
import com.takypok.employeeservice.model.request.UpdateNewsCommentRequest;
import com.takypok.employeeservice.model.request.UpdateNewsPostRequest;
import com.takypok.employeeservice.model.response.NewsAuthorResponse;
import com.takypok.employeeservice.model.response.NewsCommentResponse;
import com.takypok.employeeservice.model.response.NewsPostResponse;
import com.takypok.employeeservice.repository.EmployeeRepository;
import com.takypok.employeeservice.repository.NewsCommentLikeRepository;
import com.takypok.employeeservice.repository.NewsCommentRepository;
import com.takypok.employeeservice.repository.NewsPostRepository;
import com.takypok.employeeservice.repository.NewsReactionRepository;
import com.takypok.employeeservice.service.NewsService;
import com.takypok.employeeservice.service.NotificationEventPublisher;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class NewsServiceImpl implements NewsService {

  private static final List<String> REACTION_EMOJIS =
      List.of("like", "love", "celebrate", "insightful");

  private final NewsPostRepository newsPostRepository;
  private final NewsCommentRepository newsCommentRepository;
  private final NewsReactionRepository newsReactionRepository;
  private final NewsCommentLikeRepository newsCommentLikeRepository;
  private final EmployeeRepository employeeRepository;
  private final NotificationEventPublisher notificationEventPublisher;

  @Override
  public Mono<PageResponse<NewsPostResponse>> list(FilterNewsRequest request, String currentSub) {
    String type = request.getType() == null ? null : request.getType().name();
    int size = request.getSize().intValue();
    long offset = request.getPage() * size;
    return newsPostRepository
        .feed(type, size, offset)
        .collectList()
        .zipWith(newsPostRepository.countFeed(type))
        .flatMap(
            tuple ->
                enrichList(tuple.getT1(), currentSub)
                    .map(
                        responses ->
                            buildPageResponse(
                                responses, request.getPage(), request.getSize(), tuple.getT2())));
  }

  @Override
  public Mono<NewsPostResponse> getById(Long id, String currentSub) {
    return findPostOrError(id).flatMap(post -> enrichOne(post, currentSub));
  }

  @Override
  public Mono<NewsPostResponse> create(CreateNewsPostRequest request, String currentSub) {
    NewsPost post = new NewsPost();
    post.setAuthorSub(currentSub);
    post.setType(request.getType());
    post.setTitle(request.getTitle());
    post.setBody(request.getBody());
    post.setImageUrl(request.getImageUrl());
    post.setIsAnonymous(Boolean.TRUE.equals(request.getIsAnonymous()));
    post.setPinned(false);
    post.setStatus(ContentStatus.PUBLISHED);
    return newsPostRepository
        .save(post)
        .flatMap(saved -> enrichOne(saved, currentSub))
        .flatMap(response -> notifyNewPost(response, currentSub).thenReturn(response));
  }

  /**
   * Best-effort broadcast to every other active employee — a Kafka hiccup must not fail the post.
   */
  private Mono<Void> notifyNewPost(NewsPostResponse post, String authorSub) {
    return employeeRepository
        .findSubsByStatusExcluding(EmploymentStatus.ACTIVE.name(), authorSub)
        .collectList()
        .flatMap(
            recipientSubs ->
                notificationEventPublisher.publish(
                    "New post: " + post.getTitle(),
                    post.getBody(),
                    recipientSubs,
                    Map.of("newsPostId", String.valueOf(post.getId()))));
  }

  @Override
  public Mono<NewsPostResponse> update(Long id, UpdateNewsPostRequest request, String currentSub) {
    return findPostOrError(id)
        .flatMap(
            post -> {
              if (!post.getAuthorSub().equals(currentSub)) {
                return Mono.error(
                    new ApplicationException(
                        Message.Application.ERROR, "Not allowed to edit this post"));
              }
              post.setType(request.getType());
              post.setTitle(request.getTitle());
              post.setBody(request.getBody());
              post.setImageUrl(request.getImageUrl());
              post.setIsAnonymous(Boolean.TRUE.equals(request.getIsAnonymous()));
              return newsPostRepository.save(post);
            })
        .flatMap(saved -> enrichOne(saved, currentSub));
  }

  @Override
  public Mono<NewsPostResponse> setPinned(Long id, boolean pinned, String currentSub) {
    return findPostOrError(id)
        .flatMap(
            post -> {
              post.setPinned(pinned);
              return newsPostRepository.save(post);
            })
        .flatMap(saved -> enrichOne(saved, currentSub));
  }

  @Override
  public Mono<Void> delete(Long id, String currentSub, boolean isAdmin) {
    return findPostOrError(id)
        .flatMap(
            post -> {
              if (!isAdmin && !post.getAuthorSub().equals(currentSub)) {
                return Mono.error(
                    new ApplicationException(
                        Message.Application.ERROR, "Not allowed to delete this post"));
              }
              post.setStatus(ContentStatus.DELETED);
              return newsPostRepository.save(post);
            })
        .then();
  }

  @Override
  public Mono<NewsPostResponse> toggleReaction(Long id, String emoji, String currentSub) {
    return findPostOrError(id)
        .flatMap(
            post ->
                newsReactionRepository
                    .findByPostIdAndParticipantSub(id, currentSub)
                    .flatMap(
                        existing -> {
                          if (existing.getEmoji().equals(emoji)) {
                            return newsReactionRepository.delete(existing).thenReturn(post);
                          }
                          existing.setEmoji(emoji);
                          return newsReactionRepository.save(existing).thenReturn(post);
                        })
                    .switchIfEmpty(
                        Mono.defer(
                            () -> {
                              NewsReaction reaction = new NewsReaction();
                              reaction.setPostId(id);
                              reaction.setParticipantSub(currentSub);
                              reaction.setEmoji(emoji);
                              return newsReactionRepository.save(reaction).thenReturn(post);
                            })))
        .flatMap(post -> enrichOne(post, currentSub));
  }

  @Override
  public Mono<List<NewsCommentResponse>> getComments(Long postId, String currentSub) {
    return findPostOrError(postId)
        .flatMap(
            post ->
                newsCommentRepository
                    .findByPostIdAndStatusOrderByCreatedAt(postId, ContentStatus.PUBLISHED)
                    .collectList())
        .flatMap(comments -> enrichComments(comments, currentSub));
  }

  @Override
  public Mono<NewsCommentResponse> addComment(
      Long postId, CreateNewsCommentRequest request, String currentSub) {
    return findPostOrError(postId)
        .flatMap(
            post -> {
              NewsComment comment = new NewsComment();
              comment.setPostId(postId);
              comment.setCommenterSub(currentSub);
              comment.setContent(request.getContent());
              comment.setIsEdited(false);
              comment.setStatus(ContentStatus.PUBLISHED);
              return newsCommentRepository.save(comment);
            })
        .flatMap(saved -> enrichComment(saved, currentSub));
  }

  @Override
  public Mono<NewsCommentResponse> updateComment(
      Long commentId, UpdateNewsCommentRequest request, String currentSub) {
    return findCommentOrError(commentId)
        .flatMap(
            comment -> {
              if (!comment.getCommenterSub().equals(currentSub)) {
                return Mono.error(
                    new ApplicationException(
                        Message.Application.ERROR, "Not allowed to edit this comment"));
              }
              comment.setContent(request.getContent());
              comment.setIsEdited(true);
              return newsCommentRepository.save(comment);
            })
        .flatMap(saved -> enrichComment(saved, currentSub));
  }

  @Override
  public Mono<Void> deleteComment(Long commentId, String currentSub, boolean isAdmin) {
    return findCommentOrError(commentId)
        .flatMap(
            comment -> {
              if (!isAdmin && !comment.getCommenterSub().equals(currentSub)) {
                return Mono.error(
                    new ApplicationException(
                        Message.Application.ERROR, "Not allowed to delete this comment"));
              }
              comment.setStatus(ContentStatus.DELETED);
              return newsCommentRepository.save(comment);
            })
        .then();
  }

  @Override
  public Mono<NewsCommentResponse> toggleCommentLike(Long commentId, String currentSub) {
    return findCommentOrError(commentId)
        .flatMap(
            comment ->
                newsCommentLikeRepository
                    .findByCommentIdAndParticipantSub(commentId, currentSub)
                    .flatMap(
                        existing -> newsCommentLikeRepository.delete(existing).thenReturn(comment))
                    .switchIfEmpty(
                        Mono.defer(
                            () -> {
                              NewsCommentLike like = new NewsCommentLike();
                              like.setCommentId(commentId);
                              like.setParticipantSub(currentSub);
                              return newsCommentLikeRepository.save(like).thenReturn(comment);
                            })))
        .flatMap(comment -> enrichComment(comment, currentSub));
  }

  private Mono<NewsPost> findPostOrError(Long id) {
    return newsPostRepository
        .findById(id)
        .filter(post -> post.getStatus() == ContentStatus.PUBLISHED)
        .switchIfEmpty(Mono.error(new NewsPostNotFoundException("No news post with id " + id)));
  }

  private Mono<NewsComment> findCommentOrError(Long id) {
    return newsCommentRepository
        .findById(id)
        .filter(comment -> comment.getStatus() == ContentStatus.PUBLISHED)
        .switchIfEmpty(Mono.error(new NewsCommentNotFoundException("No comment with id " + id)));
  }

  private Mono<NewsPostResponse> enrichOne(NewsPost post, String currentSub) {
    return enrichList(List.of(post), currentSub).map(list -> list.get(0));
  }

  /** Batches author/reaction/comment-count lookups across the whole page, one query each. */
  private Mono<List<NewsPostResponse>> enrichList(List<NewsPost> posts, String currentSub) {
    if (posts.isEmpty()) {
      return Mono.just(List.of());
    }
    List<Long> postIds = posts.stream().map(NewsPost::getId).toList();
    List<String> authorSubs = posts.stream().map(NewsPost::getAuthorSub).distinct().toList();

    Mono<Map<String, Employee>> employees =
        employeeRepository.findAllById(authorSubs).collectMap(Employee::getSub);
    Mono<Map<Long, Collection<NewsReaction>>> reactionsByPost =
        newsReactionRepository.findByPostIdIn(postIds).collectMultimap(NewsReaction::getPostId);
    Mono<Map<Long, Collection<NewsComment>>> commentsByPost =
        newsCommentRepository
            .findByPostIdInAndStatus(postIds, ContentStatus.PUBLISHED)
            .collectMultimap(NewsComment::getPostId);

    return Mono.zip(employees, reactionsByPost, commentsByPost)
        .map(
            tuple ->
                posts.stream()
                    .map(
                        post ->
                            buildPostResponse(
                                post,
                                tuple.getT1(),
                                tuple.getT2().getOrDefault(post.getId(), List.of()),
                                tuple.getT3().getOrDefault(post.getId(), List.of()),
                                currentSub))
                    .toList());
  }

  private NewsPostResponse buildPostResponse(
      NewsPost post,
      Map<String, Employee> employees,
      Collection<NewsReaction> reactions,
      Collection<NewsComment> comments,
      String currentSub) {
    NewsAuthorResponse author =
        Boolean.TRUE.equals(post.getIsAnonymous())
            ? null
            : toAuthorResponse(employees.get(post.getAuthorSub()));

    Map<String, Long> reactionCounts = new LinkedHashMap<>();
    for (String emoji : REACTION_EMOJIS) {
      reactionCounts.put(emoji, 0L);
    }
    String myReaction = null;
    for (NewsReaction reaction : reactions) {
      reactionCounts.merge(reaction.getEmoji(), 1L, Long::sum);
      if (reaction.getParticipantSub().equals(currentSub)) {
        myReaction = reaction.getEmoji();
      }
    }

    NewsPostResponse response = new NewsPostResponse();
    response.setId(post.getId());
    response.setType(post.getType());
    response.setPinned(post.getPinned());
    response.setTitle(post.getTitle());
    response.setBody(post.getBody());
    response.setImageUrl(post.getImageUrl());
    response.setIsAnonymous(post.getIsAnonymous());
    response.setAuthor(author);
    response.setIsMine(post.getAuthorSub().equals(currentSub));
    response.setLikeCount((long) reactions.size());
    response.setReactionCounts(reactionCounts);
    response.setMyReaction(myReaction);
    response.setCommentCount((long) comments.size());
    response.setCreatedAt(post.getCreatedAt());
    return response;
  }

  private Mono<NewsCommentResponse> enrichComment(NewsComment comment, String currentSub) {
    return enrichComments(List.of(comment), currentSub).map(list -> list.get(0));
  }

  private Mono<List<NewsCommentResponse>> enrichComments(
      List<NewsComment> comments, String currentSub) {
    if (comments.isEmpty()) {
      return Mono.just(List.of());
    }
    List<Long> commentIds = comments.stream().map(NewsComment::getId).toList();
    List<String> commenterSubs =
        comments.stream().map(NewsComment::getCommenterSub).distinct().toList();

    Mono<Map<String, Employee>> employees =
        employeeRepository.findAllById(commenterSubs).collectMap(Employee::getSub);
    Mono<Map<Long, Collection<NewsCommentLike>>> likesByComment =
        newsCommentLikeRepository
            .findByCommentIdIn(commentIds)
            .collectMultimap(NewsCommentLike::getCommentId);

    return Mono.zip(employees, likesByComment)
        .map(
            tuple ->
                comments.stream()
                    .map(
                        comment ->
                            buildCommentResponse(
                                comment,
                                tuple.getT1(),
                                tuple.getT2().getOrDefault(comment.getId(), List.of()),
                                currentSub))
                    .toList());
  }

  private NewsCommentResponse buildCommentResponse(
      NewsComment comment,
      Map<String, Employee> employees,
      Collection<NewsCommentLike> likes,
      String currentSub) {
    boolean likedByMe =
        likes.stream().anyMatch(like -> like.getParticipantSub().equals(currentSub));
    NewsCommentResponse response = new NewsCommentResponse();
    response.setId(comment.getId());
    response.setPostId(comment.getPostId());
    response.setCommenter(toAuthorResponse(employees.get(comment.getCommenterSub())));
    response.setContent(comment.getContent());
    response.setIsEdited(comment.getIsEdited());
    response.setLikeCount((long) likes.size());
    response.setLikedByMe(likedByMe);
    response.setIsMine(comment.getCommenterSub().equals(currentSub));
    response.setCreatedAt(comment.getCreatedAt());
    return response;
  }

  private NewsAuthorResponse toAuthorResponse(Employee employee) {
    if (employee == null) {
      return null;
    }
    return new NewsAuthorResponse(
        employee.getSub(), employee.getName(), employee.getTitle(), employee.getAvatarUrl());
  }

  private PageResponse<NewsPostResponse> buildPageResponse(
      List<NewsPostResponse> content, long page, long size, long totalElements) {
    long totalPages = size == 0 ? 0 : (long) Math.ceil((double) totalElements / size);
    return new PageResponse<>(content, page, size, totalElements, totalPages);
  }
}
