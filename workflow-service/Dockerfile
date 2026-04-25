FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

COPY infrastructure infrastructure
COPY core-v1 core-v1
COPY workflow-service workflow-service

RUN chmod +x gradlew
RUN ./gradlew :workflow-service:bootJar -x test --no-daemon

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/workflow-service/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]