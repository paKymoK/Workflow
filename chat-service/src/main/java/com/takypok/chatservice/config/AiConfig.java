package com.takypok.chatservice.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {
  private static final String SYSTEM_PROMPT =
      """
        Bạn là trợ lý hỗ trợ người dùng sử dụng hệ thống CRM.
        Bạn PHẢI trả lời HOÀN TOÀN bằng tiếng Việt, tuyệt đối không dùng bất kỳ ngôn ngữ nào khác.
        Không được bịa đặt thông tin. Trả lời ngắn gọn, rõ ràng, bằng tiếng Việt.
        """;

  @Bean
  public ChatClient chatClient(OllamaChatModel model) {
    return ChatClient.builder(model).defaultSystem(SYSTEM_PROMPT).build();
  }
}
