package com.takypok.shopservice.util;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public final class VnpayUtil {

  private static final DateTimeFormatter VNPAY_DATE_FORMAT =
      DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
  private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private VnpayUtil() {}

  public static String buildPaymentUrl(
      String tmnCode,
      String hashSecret,
      String paymentUrl,
      String returnUrl,
      String orderId,
      Long totalAmount,
      String ipAddress) {

    Map<String, String> params = new TreeMap<>();
    params.put("vnp_Version", "2.1.0");
    params.put("vnp_Command", "pay");
    params.put("vnp_TmnCode", tmnCode);
    params.put("vnp_Amount", String.valueOf(totalAmount * 100));
    params.put("vnp_CurrCode", "VND");
    params.put("vnp_TxnRef", orderId);
    params.put("vnp_OrderInfo", "Payment for order " + orderId);
    params.put("vnp_OrderType", "other");
    params.put("vnp_Locale", "vn");
    params.put("vnp_ReturnUrl", returnUrl);
    params.put("vnp_IpAddr", ipAddress);
    params.put("vnp_CreateDate", LocalDateTime.now(VIETNAM_ZONE).format(VNPAY_DATE_FORMAT));

    String queryString =
        params.entrySet().stream()
            .map(e -> urlEncode(e.getKey()) + "=" + urlEncode(e.getValue()))
            .collect(Collectors.joining("&"));

    String hash = hmacSha512(hashSecret, queryString);
    return paymentUrl + "?" + queryString + "&vnp_SecureHash=" + hash;
  }

  public static boolean verifySignature(String hashSecret, Map<String, String> params) {
    String receivedHash = params.get("vnp_SecureHash");
    if (receivedHash == null) return false;

    Map<String, String> filtered = new TreeMap<>(params);
    filtered.remove("vnp_SecureHash");
    filtered.remove("vnp_SecureHashType");

    String data =
        filtered.entrySet().stream()
            .map(e -> e.getKey() + "=" + e.getValue())
            .collect(Collectors.joining("&"));

    return hmacSha512(hashSecret, data).equalsIgnoreCase(receivedHash);
  }

  public static String hmacSha512(String key, String data) {
    try {
      Mac mac = Mac.getInstance("HmacSHA512");
      mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
      byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder(bytes.length * 2);
      for (byte b : bytes) sb.append(String.format("%02x", b));
      return sb.toString();
    } catch (Exception e) {
      throw new RuntimeException("HMAC-SHA512 error", e);
    }
  }

  private static String urlEncode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
  }
}
