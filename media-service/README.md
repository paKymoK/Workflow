# Media Service

## FFmpeg Setup

FFmpeg is bundled as a Gradle dependency via [Bytedeco](https://github.com/bytedeco/javacpp-presets/tree/master/ffmpeg) — no manual installation required. The correct binary for the current OS is automatically selected at build time and extracted to a local cache on first startup.

### How it works

1. Gradle detects the build machine OS/arch and pulls only the matching platform JAR.
2. On application startup, `FfmpegResolver` extracts the binary from the classpath into `~/.cache/media-service/ffmpeg/`.
3. The binary is reused on subsequent startups — no re-extraction unless the cache is cleared.

### Default behavior

No configuration needed for local development. Just build and run — the binary for your machine is pulled automatically.

| Build machine | Binary pulled |
|---|---|
| Windows x64 | `windows-x86_64` |
| Mac Intel | `macosx-x86_64` |
| Mac M-series | `macosx-arm64` |
| Linux x64 | `linux-x86_64` |
| Linux ARM | `linux-arm64` |

### Overriding the platform

Use the `FFMPEG_PLATFORM` environment variable to force a specific platform. This is useful when the build machine differs from the deployment target (e.g. building on Mac CI but deploying to a Linux container).

Set it in your `.env` or CI environment before running the build:

```env
FFMPEG_PLATFORM=linux-x86_64
```

Available values:

| Value | Use case |
|---|---|
| `linux-x86_64` | Linux x64 server / Docker |
| `linux-arm64` | Linux ARM server (e.g. AWS Graviton) |
| `macosx-x86_64` | Mac Intel |
| `macosx-arm64` | Mac M-series |
| `windows-x86_64` | Windows |
| `all` | Pull all platforms (larger JAR, useful for shared build artifacts) |

When `FFMPEG_PLATFORM` is unset, auto-detection is used.

### Cache directory

Extracted binaries are stored at:

```
~/.cache/media-service/ffmpeg/ffmpeg        # Unix
~/.cache/media-service/ffmpeg/ffmpeg.exe    # Windows
```

To override the cache location, set `ffmpeg.cache-dir` in `application.yaml`:

```yaml
ffmpeg:
  cache-dir: /custom/path/ffmpeg
```

---

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
