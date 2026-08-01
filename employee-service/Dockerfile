FROM amazoncorretto:21-alpine AS builder
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

COPY infrastructure infrastructure
COPY core-v1 core-v1
COPY employee-service employee-service

RUN chmod +x gradlew
RUN ./gradlew :employee-service:bootJar -x test --no-daemon

FROM amazoncorretto:21-alpine
WORKDIR /app
COPY --from=builder /app/employee-service/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
