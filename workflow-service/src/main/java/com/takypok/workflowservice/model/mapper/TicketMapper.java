package com.takypok.workflowservice.model.mapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.authentication.User;
import com.takypok.workflowservice.model.entity.*;
import com.takypok.workflowservice.model.entity.custom.GroupStatus;
import com.takypok.workflowservice.model.entity.custom.TicketDetail;
import com.takypok.workflowservice.model.request.CreateTicketRequest;
import com.takypok.workflowservice.model.response.TicketSla;
import com.takypok.workflowservice.model.ticket.annotation.IssueTypeAnnotation;
import java.util.Optional;
import java.util.Set;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class TicketMapper {
  @Autowired protected ObjectMapper mapper;
  @Autowired protected Set<Class<? extends TicketDetail>> configTicket;

  @Mapping(target = "id", expression = "java(null)")
  @Mapping(target = "createdAt", expression = "java(null)")
  @Mapping(target = "createdBy", expression = "java(null)")
  @Mapping(target = "modifiedAt", expression = "java(null)")
  @Mapping(target = "modifiedBy", expression = "java(null)")
  @Mapping(target = "status", expression = "java(getTodoStatus(workflow))")
  @Mapping(target = "priority", source = "priority")
  @Mapping(target = "reporter", source = "user")
  @Mapping(target = "detail", expression = "java(getTicketDetail(request.getDetail(), issueType))")
  public abstract Ticket<TicketDetail> mapToTicket(
      CreateTicketRequest request,
      Workflow workflow,
      Project project,
      IssueType issueType,
      Priority priority,
      User user);

  @BeanMapping(ignoreByDefault = true)
  @Mapping(target = "status", source = "nextStatus")
  public abstract Ticket<TicketDetail> mapEntityUpdateStatus(
      @MappingTarget Ticket<TicketDetail> ticket, Status nextStatus);

  protected TicketDetail getTicketDetail(Object detail, IssueType issueType) {
    for (Class<? extends TicketDetail> clazz : configTicket) {
      IssueTypeAnnotation annotation = clazz.getAnnotation(IssueTypeAnnotation.class);
      if (annotation.value().equals(issueType.getName())) {
        return mapper.convertValue(detail, clazz);
      }
    }
    throw new ApplicationException(
        Message.Application.ERROR, "IssueType config for " + issueType.getName() + " not found");
  }

  public TicketSla mapToTicketSla(Ticket<TicketDetail> ticket, Sla sla) {
    TicketSla ticketSla = new TicketSla();
    ticketSla.setId(ticket.getId());
    ticketSla.setProject(ticket.getProject());
    ticketSla.setIssueType(ticket.getIssueType());
    ticketSla.setPriority(ticket.getPriority());
    ticketSla.setStatus(ticket.getStatus());
    ticketSla.setSummary(ticket.getSummary());
    ticketSla.setReporter(ticket.getReporter());
    ticketSla.setAssignee(ticket.getAssignee());
    ticketSla.setDetail(ticket.getDetail());
    ticketSla.setWorkflow(ticket.getWorkflow());
    ticketSla.setSla(sla);
    return ticketSla;
  }

  protected Status getTodoStatus(Workflow workflow) {
    Optional<Status> result =
        workflow.getStatuses().stream()
            .filter(status -> GroupStatus.TODO.equals(status.getGroup()))
            .findFirst();
    return result.orElse(null);
  }
}
