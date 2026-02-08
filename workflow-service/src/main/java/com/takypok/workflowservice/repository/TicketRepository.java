package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.Ticket;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.response.TicketSla;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface TicketRepository<T extends TicketDetail> extends R2dbcRepository<Ticket<T>, Long> {

  @Query(
      """
          SELECT t.*,
                CASE WHEN s.id IS NOT NULL THEN
                  jsonb_build_object(
                    'id',         s.id,
                    'ticketId',   s.ticket_id,
                    'time',       s.time,
                    'status',     s.status,
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
}
