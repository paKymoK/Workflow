package com.takypok.authservice.web;

import com.takypok.authservice.repository.UserInfoRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/profile/complete")
@RequiredArgsConstructor
public class ProfileController {

  private final UserInfoRepository userInfoRepository;
  private final RequestCache requestCache = new HttpSessionRequestCache();

  @GetMapping
  public String showForm(@AuthenticationPrincipal UserDetails user, Model model) {
    model.addAttribute("username", user.getUsername());
    return "profile-complete";
  }

  @PostMapping
  public String saveProfile(
      @AuthenticationPrincipal UserDetails user,
      @RequestParam String title,
      @RequestParam String department,
      HttpServletRequest request,
      HttpServletResponse response,
      Model model) {

    if (title.isBlank() || department.isBlank()) {
      model.addAttribute("username", user.getUsername());
      model.addAttribute("error", "Title and department are required.");
      model.addAttribute("title", title);
      model.addAttribute("department", department);
      return "profile-complete";
    }

    int updated =
        userInfoRepository.updateProfile(user.getUsername(), title.strip(), department.strip());
    if (updated == 0) {
      model.addAttribute("username", user.getUsername());
      model.addAttribute("error", "User record not found. Please contact support.");
      return "profile-complete";
    }

    SavedRequest savedRequest = requestCache.getRequest(request, response);
    requestCache.removeRequest(request, response);
    if (savedRequest != null) {
      return "redirect:" + savedRequest.getRedirectUrl();
    }
    return "redirect:/";
  }
}
