# Dockerfile
FROM postgres:17

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    postgresql-server-dev-17 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install pg_cron
RUN cd /tmp && \
    git clone https://github.com/citusdata/pg_cron.git && \
    cd pg_cron && \
    make && \
    make install && \
    cd / && \
    rm -rf /tmp/pg_cron

# Expose port
EXPOSE 5432