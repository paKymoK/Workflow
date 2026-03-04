package com.takypok.authservice.api;

import com.takypok.authservice.model.request.UserinfoRequest;
import com.takypok.authservice.model.response.UserinfoResponse;
import com.takypok.authservice.service.UserService;
import com.takypok.core.model.ResultMessage;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/users")
public class UserController {
  private final UserService userService;

  @GetMapping
  public ResponseEntity<ResultMessage<List<UserinfoResponse>>> get() {
    return ResponseEntity.ok(ResultMessage.success(userService.getUsers()));
  }

  @GetMapping("/{sub}")
  public ResponseEntity<ResultMessage<UserinfoResponse>> getById(@PathVariable String sub) {
    return ResponseEntity.ok(ResultMessage.success(userService.getUserById(sub)));
  }

  @PostMapping()
  public ResponseEntity<ResultMessage<UserinfoResponse>> create(
      @RequestBody @Valid UserinfoRequest request) {
    return ResponseEntity.ok(ResultMessage.success(userService.create(request)));
  }
}
