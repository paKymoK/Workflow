# Custom CA certificates for Docker builds

If you build these images from a private network that terminates/inspects TLS
(a corporate proxy, firewall, or VPN with its own root CA), the JVM inside the
builder stage won't trust that CA and Gradle's wrapper download will fail with:

```
javax.net.ssl.SSLHandshakeException: (certificate_unknown) PKIX path building failed:
sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid
certification path to requested target
```

To fix it, drop your network's root CA certificate (PEM, `.crt`) into this
directory. Every `Dockerfile` in this repo copies `certs/` into the builder
image and imports any `*.crt` files here into both the system trust store and
the JVM's `cacerts`, so the fix applies automatically the next time you build.

This directory is safe to leave empty for networks that don't need it (e.g.
your home network) — the build steps are no-ops when there are no `.crt`
files present.

## How to get the certificate

If you don't already have the CA certificate file, you can usually export it
from your browser (look up the root CA used when visiting an HTTPS site on
the private network), or ask your network/IT team for it.

Alternatively, capture it directly from the network while connected to it:

```sh
openssl s_client -showcerts -connect services.gradle.org:443 </dev/null 2>/dev/null \
  | openssl x509 -outform PEM > certs/private-network-ca.crt
```

**Do not commit real corporate CA certificates to a shared/public repo**
unless your organization is fine with that. Consider adding your specific
`.crt` file to `.gitignore` if this repo is shared beyond your team.
