package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.Sla;
import com.takypok.workflowservice.model.response.SlaPriorityDistribution;
import com.takypok.workflowservice.model.response.SlaStatusDistribution;
import java.time.ZonedDateTime;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface SlaRepository extends R2dbcRepository<Sla, Long> {
  @Query("SELECT * FROM sla WHERE ticket_id = :ticketId")
  Mono<Sla> findByTicketId(Long ticketId);

  @Query(
      """
            SELECT
                CASE
                    WHEN (s.status->>'isResponseOverdue')::boolean = true THEN 'Overdue'
                    WHEN s.status->>'response' = 'TODO' THEN 'TODO'
                    ELSE 'Completed'
                END AS response_status,
                CASE
                    WHEN (s.status->>'isResolutionOverdue')::boolean = true THEN 'Overdue'
                    WHEN s.status->>'resolution' = 'TODO' THEN 'TODO'
                    ELSE 'Completed'
                END AS resolution_status,
                COUNT(*) AS count
            FROM sla s
            JOIN ticket t on t.id = s.ticket_id
            WHERE
                (:from::timestamptz IS NULL OR t.created_at >= :from::timestamptz)
                AND (:to::timestamptz IS NULL OR t.created_at <= :to::timestamptz)
            GROUP BY response_status, resolution_status
            """)
  Flux<SlaStatusDistribution> getSlaByStatusDistribution(ZonedDateTime from, ZonedDateTime to);

  @Query(
      """
          SELECT
              s.priority->>'name' AS priority_name,
              COUNT(*) FILTER (
                  WHERE (s.status->>'isResponseOverdue')::boolean = true
              ) AS response_overdue,
              COUNT(*) FILTER (
                  WHERE (s.status->>'isResolutionOverdue')::boolean = true
              ) AS resolution_overdue,
              COUNT(*) FILTER (
                  WHERE (s.status->>'isResponseOverdue')::boolean = false
                  AND (s.status->>'isResolutionOverdue')::boolean = false
                  AND s.status->>'response' != 'TODO'
              ) AS on_time,
              COUNT(*) FILTER (
                  WHERE s.status->>'response' = 'TODO'
                  AND (s.status->>'isResponseOverdue')::boolean = false
              ) AS pending,
              COUNT(*) AS total
          FROM sla s
          JOIN ticket t on t.id = s.ticket_id
          WHERE
              (:from::timestamptz IS NULL OR t.created_at >= :from::timestamptz)
              AND (:to::timestamptz IS NULL OR t.created_at <= :to::timestamptz)
          GROUP BY s.priority->>'name'
          ORDER BY
              CASE s.priority->>'name'
                  WHEN 'Critical' THEN 1
                  WHEN 'High' THEN 2
                  WHEN 'Medium' THEN 3
                  WHEN 'Low' THEN 4
                  ELSE 5
              END
          """)
  Flux<SlaPriorityDistribution> getSlaByPriorityDistribution(ZonedDateTime from, ZonedDateTime to);
}
