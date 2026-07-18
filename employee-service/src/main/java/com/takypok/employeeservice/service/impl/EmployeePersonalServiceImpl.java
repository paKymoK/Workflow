package com.takypok.employeeservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.employeeservice.model.entity.EmployeePersonal;
import com.takypok.employeeservice.model.request.EmployeePersonalRequest;
import com.takypok.employeeservice.repository.EmployeePersonalRepository;
import com.takypok.employeeservice.service.EmployeePersonalService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class EmployeePersonalServiceImpl implements EmployeePersonalService {
  private final EmployeePersonalRepository employeePersonalRepository;
  private final R2dbcEntityTemplate r2dbcEntityTemplate;

  @Override
  public Mono<EmployeePersonal> getBySub(String sub) {
    return employeePersonalRepository
        .findById(sub)
        .switchIfEmpty(
            Mono.error(
                new ApplicationException(
                    Message.Application.ERROR, "No personal record for " + sub)));
  }

  @Override
  public Mono<EmployeePersonal> upsert(String sub, EmployeePersonalRequest request) {
    return employeePersonalRepository
        .findById(sub)
        .flatMap(existing -> applyAndSave(existing, request, false))
        .switchIfEmpty(Mono.defer(() -> applyAndSave(newPersonal(sub), request, true)));
  }

  private EmployeePersonal newPersonal(String sub) {
    EmployeePersonal personal = new EmployeePersonal();
    personal.setSub(sub);
    return personal;
  }

  private Mono<EmployeePersonal> applyAndSave(
      EmployeePersonal personal, EmployeePersonalRequest request, boolean isNew) {
    personal.setPersonalEmail(request.getPersonalEmail());
    personal.setMobilePhone(request.getMobilePhone());
    personal.setDateOfBirth(request.getDateOfBirth());
    personal.setGender(request.getGender());
    personal.setNationalId(request.getNationalId());
    personal.setAddress(request.getAddress());
    personal.setEmergencyContactName(request.getEmergencyContactName());
    personal.setEmergencyContactPhone(request.getEmergencyContactPhone());
    // `sub` is a manually-assigned key, so repository.save() can't tell an unsaved row from an
    // existing one by id alone — an explicit insert is required for the create path (see the
    // same fix in EmployeeServiceImpl.create).
    return isNew
        ? r2dbcEntityTemplate.insert(EmployeePersonal.class).using(personal)
        : employeePersonalRepository.save(personal);
  }
}
