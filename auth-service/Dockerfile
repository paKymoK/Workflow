FROM amazoncorretto:21-alpine AS builder
WORKDIR /app

# Trust extra CA certificates (e.g. a private network's TLS-inspection root
# CA) so the JVM can validate HTTPS downloads such as the Gradle wrapper.
# Drop .crt files into ./certs (see certs/README.md); no-op if none exist.
COPY certs/ /tmp/custom-certs/
RUN apk add --no-cache ca-certificates \
    && mkdir -p /usr/local/share/ca-certificates \
    && cp /tmp/custom-certs/*.crt /usr/local/share/ca-certificates/ 2>/dev/null || true \
    && update-ca-certificates \
    && for cert in /usr/local/share/ca-certificates/*.crt; do \
         [ -f "$cert" ] && keytool -importcert -noprompt -trustcacerts \
           -alias "$(basename "$cert" .crt)" \
           -file "$cert" \
           -keystore "$JAVA_HOME/lib/security/cacerts" \
           -storepass changeit; \
       done \
    && rm -rf /tmp/custom-certs

COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

COPY infrastructure infrastructure
COPY core-v1 core-v1
COPY auth-service auth-service

RUN chmod +x gradlew
RUN ./gradlew :auth-service:bootJar -x test --no-daemon

FROM amazoncorretto:21-alpine
WORKDIR /app
COPY --from=builder /app/auth-service/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]