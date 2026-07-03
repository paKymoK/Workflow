package com.takypok.mediaservice.util;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import reactor.core.publisher.Flux;

/**
 * Caps a streamed multipart upload at {@code maxBytes}, erroring out mid-stream instead of
 * buffering the whole file before checking — a client can't exhaust disk by uploading whatever size
 * it wants.
 */
public class UploadSizeLimiter {
  private UploadSizeLimiter() {}

  public static Flux<DataBuffer> enforce(Flux<DataBuffer> content, long maxBytes, String label) {
    AtomicLong total = new AtomicLong();
    return content.handle(
        (buffer, sink) -> {
          if (total.addAndGet(buffer.readableByteCount()) > maxBytes) {
            DataBufferUtils.release(buffer);
            sink.error(
                new ApplicationException(
                    Message.Application.ERROR,
                    label
                        + " exceeds maximum allowed size of "
                        + (maxBytes / (1024 * 1024))
                        + "MB"));
            return;
          }
          sink.next(buffer);
        });
  }
}
