package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.response.OverviewStatistic;
import com.takypok.workflowservice.model.response.TicketSla;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface TicketRepository<T extends TicketDetail> extends R2dbcRepository<Ticket<T>, Long> {

  @Query(
      """
            SELECT t.*,
                  CASE WHEN s.id IS NOT NULL THEN
                    jsonb_build_object(
                      'id',         s.id,
                      'ticketId',   s.ticket_id,
                      'status',     s.status,
                      'isPaused',   s.is_paused,
                      'priority',   s.priority,
                      'pausedTime', s.paused_time,
                      'setting',    s.setting
                    )
                  END AS sla
            FROM ticket t
            LEFT JOIN sla s ON t.id = s.ticket_id
            ORDER BY t.id DESC
            LIMIT :limit OFFSET :offset
            """)
  Flux<TicketSla> findAllWithSla(int limit, int offset);

  @Query(
      """
            SELECT t.*,
                  CASE WHEN s.id IS NOT NULL THEN
                    jsonb_build_object(
                      'id',         s.id,
                      'ticketId',   s.ticket_id,
                      'isPaused',   s.is_paused,
                      'status',     s.status,
                      'priority',   s.priority,
                      'pausedTime', s.paused_time,
                      'setting',    s.setting
                    )
                  END AS sla
            FROM ticket t
            LEFT JOIN sla s ON t.id = s.ticket_id
            WHERE t.id = :ticketId
            """)
  Mono<TicketSla> findWithSlaById(long ticketId);

  @Query(
      """
            SELECT
                status->>'group' AS name,
                COUNT(*) AS value
            FROM ticket
            GROUP BY status->>'group';
            """)
  Flux<OverviewStatistic> overviewStatistic();
}
