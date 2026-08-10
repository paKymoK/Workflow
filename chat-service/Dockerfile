FROM gradle:8.14.3-jdk21-alpine AS builder
WORKDIR /app

COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

COPY infrastructure infrastructure
COPY core-v1 core-v1
COPY chat-service chat-service

RUN gradle :chat-service:bootJar -x test --no-daemon

# glibc base (not -alpine): unstructured/langchain pull in packages like numba/llvmlite that
# only ship manylinux wheels — on musl (Alpine) pip has to compile them from source, which
# fails without a build toolchain.
FROM amazoncorretto:21
WORKDIR /app

# python3 runtime for IngestionService's docx/xlsx/pptx delegation (scripts/ingest.py)
RUN dnf install -y python3 python3-pip && dnf clean all
COPY chat-service/scripts scripts
RUN pip3 install --no-cache-dir -r scripts/requirements.txt

COPY --from=builder /app/chat-service/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
