package com.takypok.employeeservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.employeeservice.model.entity.ContractStatus;
import com.takypok.employeeservice.model.entity.EmployeeContract;
import com.takypok.employeeservice.model.request.ContractCreateRequest;
import com.takypok.employeeservice.model.request.ContractUpdateRequest;
import com.takypok.employeeservice.repository.EmployeeContractRepository;
import com.takypok.employeeservice.service.EmployeeContractService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class EmployeeContractServiceImpl implements EmployeeContractService {
  private final EmployeeContractRepository employeeContractRepository;

  @Override
  public Mono<List<EmployeeContract>> getBySub(String sub) {
    return employeeContractRepository.findBySubOrderByStartDateDesc(sub).collectList();
  }

  @Override
  public Mono<EmployeeContract> create(String sub, ContractCreateRequest request) {
    EmployeeContract contract = new EmployeeContract();
    contract.setSub(sub);
    contract.setContractType(request.getContractType());
    contract.setStartDate(request.getStartDate());
    contract.setEndDate(request.getEndDate());
    contract.setSignedDate(request.getSignedDate());
    contract.setProbationEndDate(request.getProbationEndDate());
    contract.setCompensation(request.getCompensation());
    contract.setDocumentUrl(request.getDocumentUrl());
    contract.setStatus(ContractStatus.ACTIVE);
    return employeeContractRepository.save(contract);
  }

  @Override
  public Mono<EmployeeContract> update(Long id, ContractUpdateRequest request) {
    return employeeContractRepository
        .findById(id)
        .switchIfEmpty(
            Mono.error(new ApplicationException(Message.Application.ERROR, "Contract not found")))
        .flatMap(
            contract -> {
              contract.setContractType(request.getContractType());
              contract.setStartDate(request.getStartDate());
              contract.setEndDate(request.getEndDate());
              contract.setSignedDate(request.getSignedDate());
              contract.setProbationEndDate(request.getProbationEndDate());
              contract.setCompensation(request.getCompensation());
              contract.setStatus(request.getStatus());
              contract.setDocumentUrl(request.getDocumentUrl());
              return employeeContractRepository.save(contract);
            });
  }
}
