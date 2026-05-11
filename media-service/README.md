# Media Service

## Running on a Restricted Network (PKIX Error)

If the service throws a PKIX error on startup, set `JAVA_TOOL_OPTIONS` to make Java use the OS truststore.

**macOS**
```bash
JAVA_TOOL_OPTIONS="-Djavax.net.ssl.trustStoreType=KeychainStore"
```

**Windows**
```bash
JAVA_TOOL_OPTIONS="-Djavax.net.ssl.trustStoreType=Windows-ROOT"
```

**Linux**
```bash
JAVA_TOOL_OPTIONS="-Djavax.net.ssl.trustStore=/etc/ssl/certs/java/cacerts"
```
