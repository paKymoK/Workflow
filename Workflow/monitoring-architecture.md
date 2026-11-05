# Takypok Workflow — Kiến trúc Monitoring & Observability

Sơ đồ chi tiết: [`monitoring-architecture.svg`](monitoring-architecture.svg) / [`monitoring-architecture.png`](monitoring-architecture.png).
Nguồn: `infrastructure/{alloy,monitor,...}`, `docker-compose.yaml`, `core-v1/.../management.yml`, `application.yaml` của từng service.

![architecture](monitoring-architecture.png)

## 1. Luồng dữ liệu hiện có

| Tín hiệu | Nguồn | Đường đi | Đích | Lưu trữ |
|---|---|---|---|---|
| **Metrics app** | `/actuator/prometheus` của 7 service (Micrometer, tag `application`) | Alloy `prometheus.scrape "app"` (15s, `APP_SCRAPE_TARGET`) → `remote_write` | Prometheus `:9090` | 15 ngày |
| **Metrics app (pull trực tiếp)** | cùng endpoint | `prometheus.yml` static_configs 7 job | Prometheus | — |
| **Metrics host/container** | node_exporter-equivalent + cAdvisor-equivalent trong Alloy | `prometheus.exporter.unix/cadvisor` → `remote_write` | Prometheus | 15 ngày |
| **Logs** | stdout container (Log4j2, pattern có `XRequestId`, `UserId`) | Docker json-file → Alloy `discovery.docker` + `loki.source.docker` + regex `level` → `loki.write` | Loki `:3101` | 7 ngày |
| **Traces** | Micrometer Tracing → OTel | OTLP HTTP trực tiếp `MANAGEMENT_OTLP_TRACING_ENDPOINT=http://tempo:4318/v1/traces` | Tempo | 48 giờ |
| **Visualize / Alert** | — | Grafana 11.2 (datasource Prometheus/Loki/Tempo provisioned) | Dashboard `spring-boot`, `container-logs`; rule `service-error-rate` → webhook | — |

Liên kết chéo trong Grafana: exemplar (Prometheus → Tempo), `derivedFields trace_id` (Loki → Tempo), `tracesToMetrics` (Tempo → Prometheus).

### Cổng service

| Service | Port | Ghi chú monitoring |
|---|---|---|
| gateway-service | 8080 (mgmt **8090**) | actuator ở cổng riêng 8090; tracing ON |
| discovery-service | 8761 | tracing **OFF**; có healthcheck |
| auth-service | 9000 | health `show-details: always` |
| workflow-service | 8085 | có Debezium (offset `/data/offset.dat`) |
| media-service | 8082 | phụ thuộc MinIO |
| chat-service | 8083 | phụ thuộc Qdrant/Ollama (chưa có trong compose) |
| employee-service | 8086 | Kafka + Postgres |

Hạ tầng: Postgres `:5433`, Redis `:6379`, Kafka `:29092`, MinIO `:9100/:9101`, OpenLDAP `:389` (UI `:9090`).

## 2. Những điểm còn thiếu / rủi ro (đã đánh dấu trong sơ đồ)

| # | Vấn đề | Bằng chứng | Đề xuất |
|---|---|---|---|
| 1 | **Không có metrics cho Postgres, Redis, Kafka, MinIO, LDAP** — chỉ có CPU/RAM container | `config.alloy` chỉ scrape unix, cAdvisor, app | Thêm exporter (mục 3) |
| 2 | **Scrape trùng**: Prometheus static + Alloy cùng scrape app → series nhân đôi | `prometheus.yml` và `config.alloy` | Chọn một: dev dùng static, prod dùng Alloy → bỏ static job |
| 3 | **Alert chỉ dựa trên log ERROR**; không có alert `up==0`, 5xx, latency, JVM, disk, lag | `alerting/rules.yaml` có 1 rule | Thêm rule metrics (mục 4) |
| 4 | Contact point là **placeholder** `REPLACE_ME.example.com` | `contactpoints.yaml` | Gắn Slack/Telegram/Email thật |
| 5 | discovery-service **tắt tracing** | `discovery application.yaml` `tracing.enabled: false` | Chủ ý thì bỏ qua; nếu cần thấy Eureka lookup thì bật |
| 6 | Tempo thiếu `metrics_generator` → `tracesToMetrics`, service graph trống | `tempo.yaml` | Bật `service-graphs` + `span-metrics` (mục 5) |
| 7 | OTLP đi **trực tiếp** app → Tempo, bypass Alloy: mất buffer/retry, khó đổi backend | env `MANAGEMENT_OTLP_TRACING_ENDPOINT` | Thêm `otelcol.receiver.otlp` trong Alloy |
| 8 | Sampling `1.0` ở mọi môi trường | `management.yml` | Prod: 0.05–0.2 hoặc tail sampling |
| 9 | `/actuator/prometheus` mở trên host port, không auth | compose `ports:` | Prod: bỏ publish, hoặc bind `127.0.0.1`, hoặc tách mgmt port như gateway |
| 10 | Cổng gateway: Prometheus static target phải là **`:8090`**, không phải `:8080` | `prometheus.yml` (đúng), `.env.example` (đúng) | Giữ nguyên, nhưng đừng đổi nhầm |
| 11 | **Trùng cổng host `9090`**: Prometheus và phpLDAPadmin | compose monitor + ldap-local | Đổi phpLDAPadmin (vd `9091`) |
| 12 | cAdvisor không chạy được trên Docker Desktop Mac | comment trong `alloy/docker-compose.yml` | Chỉ kỳ vọng chạy trên Linux |
| 13 | Grafana `admin/admin`, MinIO `minioadmin` | compose | Đưa vào `.env`/secret |
| 14 | Redis không có healthcheck (Postgres, Kafka, MinIO có) | `redis/docker-compose.yml` | Thêm healthcheck `redis-cli ping` |
| 15 | Frontend chưa có RUM / error tracking | — | Grafana Faro → Alloy `faro.receiver` |
| 16 | Chưa có synthetic probe / uptime ngoài | — | Blackbox exporter |

## 3. Exporter đề xuất (thêm vào `infrastructure/`)

```yaml
# infrastructure/monitor/exporters/docker-compose.yml (đề xuất)
name: takypok-exporters
services:
  postgres-exporter:
    image: quay.io/prometheuscommunity/postgres-exporter:v0.15.0
    environment:
      DATA_SOURCE_NAME: postgresql://postgres:postgres@postgres:5432/postgres?sslmode=disable
    networks: [takypok_default]
  redis-exporter:
    image: oliver006/redis_exporter:v1.62.0
    environment: { REDIS_ADDR: redis://redis:6379 }
    networks: [takypok_default]
  kafka-exporter:
    image: danielqsj/kafka-exporter:v1.8.0
    command: ["--kafka.server=kafka:9092"]
    networks: [takypok_default]
networks:
  takypok_default: { external: true }
```

MinIO: đặt `MINIO_PROMETHEUS_AUTH_TYPE=public`, scrape `minio:9000/minio/v2/metrics/cluster`.

Thêm vào `config.alloy` (đặt trên VPS tương ứng):

```alloy
prometheus.scrape "infra" {
  targets = [
    {"__address__" = "postgres-exporter:9187", "job" = "postgres"},
    {"__address__" = "redis-exporter:9121",    "job" = "redis"},
    {"__address__" = "kafka-exporter:9308",    "job" = "kafka"},
    {"__address__" = "minio:9000", "job" = "minio", "__metrics_path__" = "/minio/v2/metrics/cluster"},
  ]
  forward_to      = [prometheus.remote_write.default.receiver]
  scrape_interval = "15s"
}

otelcol.receiver.otlp "default" {
  http { endpoint = "0.0.0.0:4318" }
  output { traces = [otelcol.exporter.otlphttp.tempo.input] }
}
otelcol.exporter.otlphttp "tempo" {
  client { endpoint = "http://tempo:4318" }
}
```

> Nếu thêm `otelcol.receiver.otlp` trên Alloy thì đổi `MANAGEMENT_OTLP_TRACING_ENDPOINT` thành `http://alloy:4318/v1/traces` và publish/đổi cổng cho khỏi trùng Tempo trên cùng host.

## 4. Alert rule metrics đề xuất

| Rule | PromQL gợi ý | Mức |
|---|---|---|
| Service down | `up{job=~".*-service"} == 0` (for 1m) | critical |
| 5xx rate cao | `sum by (application)(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) / sum by (application)(rate(http_server_requests_seconds_count[5m])) > 0.05` | critical |
| p95 latency | `histogram_quantile(0.95, sum by (le,application)(rate(http_server_requests_seconds_bucket[5m]))) > 1` | warning |
| JVM heap | `jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} > 0.85` | warning |
| Kafka lag | `sum by (consumergroup,topic)(kafka_consumergroup_lag) > 1000` | warning |
| Redis memory | `redis_memory_used_bytes / redis_memory_max_bytes > 0.85` | warning |
| Postgres connections | `sum(pg_stat_activity_count) / max(pg_settings_max_connections) > 0.8` | warning |
| Disk host | `node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.15` | critical |
| Container restart | `increase(container_start_time_seconds[10m]) > 0` | warning |
| Eureka thiếu instance | `count(up{job=~".*-service"} == 1) < 7` | warning |

## 5. Tempo `metrics_generator` đề xuất

```yaml
# thêm vào tempo.yaml
metrics_generator:
  registry: { external_labels: { source: tempo } }
  storage:
    path: /var/tempo/generator/wal
    remote_write:
      - url: http://prometheus:9090/api/v1/write
        send_exemplars: true
overrides:
  defaults:
    metrics_generator:
      processors: [service-graphs, span-metrics]
```

## 6. Triển khai production (mô hình đã định hướng trong repo)

- **App VPS** (mỗi service) và **VPS Kafka/Redis**: chạy cùng một `infrastructure/alloy/docker-compose.yml`, chỉ khác `APP_SCRAPE_TARGET`.
- **Monitor VPS**: `infrastructure/monitor` (Prometheus, Loki, Tempo, Grafana). Alloy trỏ `LOKI_URL` / `PROMETHEUS_REMOTE_WRITE_URL` về IP private của VPS này.
- Khi chạy production chỉ giữ nguồn scrape **Alloy → remote_write**, bỏ `static_configs` của Prometheus (vì container name không phân giải được giữa các VPS).
- Đóng cổng 3200/3101/9090 ra ngoài; chỉ Grafana đi qua reverse proxy.

## 7. Thứ tự ưu tiên

1. Đổi webhook thật + thêm alert `up==0`, 5xx, latency (giá trị cao, công sức thấp).
2. Exporter Postgres/Redis/Kafka + dashboard hạ tầng.
3. Bỏ scrape trùng, đóng actuator khỏi host port.
4. Tempo metrics_generator + OTLP qua Alloy.
5. Faro (FE) và blackbox probe.
