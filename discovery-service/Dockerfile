FROM amazoncorretto:17-alpine AS builder
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

COPY infrastructure infrastructure
COPY core-v1 core-v1
COPY discovery-service discovery-service

RUN chmod +x gradlew
RUN ./gradlew :discovery-service:bootJar -x test --no-daemon

FROM amazoncorretto:17-alpine
WORKDIR /app
COPY --from=builder /app/discovery-service/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]