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
#
# python3 comes from the official image instead of `dnf`/`apk install`: some private
# networks block or TLS-intercept cdn.amazonlinux.com (and we have no CA to trust it
# with), but plain Docker registry pulls already work fine here — same reason the
# builder stage above pulls gradle/amazoncorretto images directly.
FROM python:3.12-slim
WORKDIR /app

# JRE pulled the same way, from Temurin's Ubuntu-based image (same glibc family as
# python:3.12-slim's Debian base) rather than installed via a package manager.
COPY --from=eclipse-temurin:21-jre-jammy /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="$JAVA_HOME/bin:$PATH"

# python3 runtime for IngestionService's docx/xlsx/pptx delegation (scripts/ingest.py)
COPY chat-service/scripts scripts
RUN pip install --no-cache-dir -r scripts/requirements.txt

COPY --from=builder /app/chat-service/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
