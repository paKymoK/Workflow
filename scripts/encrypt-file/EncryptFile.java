import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Offline companion to the "Upload from encrypted text" panel on the Chunked Upload page
 * (frontend/takypok-frontend/src/pages/ChunkedUpload.tsx): AES-GCM encrypts a whole file with the
 * same fixed key the app uses, and writes the result as base64 text - paste that text into the
 * page and it decrypts it client-side, then uploads it through the normal encrypted chunked-upload
 * flow. No network calls or login here; the browser (already authenticated) does the actual
 * upload, so this tool only needs to do the encryption a network content-inspection filter would
 * otherwise block.
 *
 * Run with a JDK 11+ runtime, no build step required:
 *   java EncryptFile.java <input-file> [output-file.txt]
 */
public class EncryptFile {
  // Must match ChunkedUploadProperties#encryptionKeyBase64 (backend) and ENCRYPTION_KEY_B64 in
  // chunkedUpload.ts (frontend) exactly - it's a shared constant, not looked up at runtime.
  private static final String ENCRYPTION_KEY_B64 = "UUF1mzp0rKSFTi8GEiS9P4kVJN6VaFfwZuZ5EPevtLA=";
  private static final int GCM_IV_LENGTH_BYTES = 12;
  private static final int GCM_TAG_LENGTH_BITS = 128;

  public static void main(String[] args) throws Exception {
    if (args.length == 0) {
      System.err.println("Usage: java EncryptFile.java <input-file> [output-file.txt]");
      System.exit(1);
    }

    Path input = Path.of(args[0]);
    if (!Files.isRegularFile(input)) {
      System.err.println("No such file: " + input);
      System.exit(1);
    }
    Path output =
        args.length > 1
            ? Path.of(args[1])
            : input.resolveSibling(input.getFileName() + ".b64.txt");

    byte[] plaintext = Files.readAllBytes(input);

    SecretKeySpec key = new SecretKeySpec(Base64.getDecoder().decode(ENCRYPTION_KEY_B64), "AES");
    byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
    new SecureRandom().nextBytes(iv);
    Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
    byte[] ciphertext = cipher.doFinal(plaintext);

    byte[] wire = new byte[iv.length + ciphertext.length];
    System.arraycopy(iv, 0, wire, 0, iv.length);
    System.arraycopy(ciphertext, 0, wire, iv.length, ciphertext.length);

    Files.writeString(output, Base64.getEncoder().encodeToString(wire));

    System.out.println("Encrypted " + input.getFileName() + " (" + plaintext.length + " bytes) -> " + output);
    System.out.println("Paste the contents of that file into the \"Upload from encrypted text\" panel,");
    System.out.println("enter \"" + input.getFileName() + "\" as the filename, and click Upload.");
  }
}
