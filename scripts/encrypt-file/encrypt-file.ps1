#Requires -Version 5.1
<#
.SYNOPSIS
  Offline companion to the "Upload from encrypted text" panel on the Chunked Upload page
  (frontend/takypok-frontend/src/pages/ChunkedUpload.tsx): AES-GCM encrypts a whole file with the
  same fixed key the app uses, and writes the result as base64 text - paste that text into the
  page and it decrypts it client-side, then uploads it through the normal encrypted chunked-upload
  flow. No network calls or login here, and no external runtime needed: this uses Windows' own CNG
  crypto library (bcrypt.dll) via P/Invoke, since Windows PowerShell 5.1 runs on .NET Framework,
  which has no System.Security.Cryptography.AesGcm (that class is .NET Core-only).

.PARAMETER InputFile
  Path to the file to encrypt.

.PARAMETER OutputFile
  Where to write the base64 result (default: <InputFile>.b64.txt).

.EXAMPLE
  .\encrypt-file.ps1 report.xlsx
#>
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$InputFile,

    [Parameter(Position = 1)]
    [string]$OutputFile
)

$ErrorActionPreference = "Stop"

# Must match ChunkedUploadProperties#encryptionKeyBase64 (backend) and ENCRYPTION_KEY_B64 in
# chunkedUpload.ts (frontend) exactly - it's a shared constant, not looked up at runtime.
$KeyB64 = "UUF1mzp0rKSFTi8GEiS9P4kVJN6VaFfwZuZ5EPevtLA="
$GcmIvLength = 12
$GcmTagLength = 16

$cngSource = @"
using System;
using System.Runtime.InteropServices;

public static class AesGcmCng
{
    [DllImport("bcrypt.dll", CharSet = CharSet.Unicode)]
    private static extern int BCryptOpenAlgorithmProvider(out IntPtr phAlgorithm, string pszAlgId, string pszImplementation, uint dwFlags);

    [DllImport("bcrypt.dll")]
    private static extern int BCryptCloseAlgorithmProvider(IntPtr hAlgorithm, uint dwFlags);

    [DllImport("bcrypt.dll", CharSet = CharSet.Unicode)]
    private static extern int BCryptSetProperty(IntPtr hObject, string pszProperty, string pbInput, int cbInput, uint dwFlags);

    [DllImport("bcrypt.dll")]
    private static extern int BCryptGenerateSymmetricKey(IntPtr hAlgorithm, out IntPtr phKey, IntPtr pbKeyObject, int cbKeyObject, byte[] pbSecret, int cbSecret, uint dwFlags);

    [DllImport("bcrypt.dll")]
    private static extern int BCryptDestroyKey(IntPtr hKey);

    [StructLayout(LayoutKind.Sequential)]
    private struct BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO
    {
        public int cbSize;
        public int dwInfoVersion;
        public IntPtr pbNonce;
        public int cbNonce;
        public IntPtr pbAuthData;
        public int cbAuthData;
        public IntPtr pbTag;
        public int cbTag;
        public IntPtr pbMacContext;
        public int cbMacContext;
        public int cbAAD;
        public long cbData;
        public uint dwFlags;
    }

    [DllImport("bcrypt.dll")]
    private static extern int BCryptEncrypt(IntPtr hKey, byte[] pbInput, int cbInput, ref BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO pPaddingInfo, byte[] pbIV, int cbIV, byte[] pbOutput, int cbOutput, out int pcbResult, uint dwFlags);

    // Encrypts with AES-256-GCM and returns ciphertext with the 16-byte tag appended - the same
    // "combined" wire format the browser's WebCrypto AES-GCM and Java's javax.crypto GCM cipher
    // both produce, so output from any of the three is interchangeable.
    public static byte[] Encrypt(byte[] key, byte[] iv, byte[] plaintext)
    {
        IntPtr hAlg;
        Check(BCryptOpenAlgorithmProvider(out hAlg, "AES", null, 0));
        try
        {
            string chainMode = "ChainingModeGCM";
            Check(BCryptSetProperty(hAlg, "ChainingMode", chainMode, (chainMode.Length + 1) * 2, 0));

            IntPtr hKey;
            Check(BCryptGenerateSymmetricKey(hAlg, out hKey, IntPtr.Zero, 0, key, key.Length, 0));
            try
            {
                byte[] tag = new byte[16];
                byte[] ciphertext = new byte[plaintext.Length];
                GCHandle ivHandle = GCHandle.Alloc(iv, GCHandleType.Pinned);
                GCHandle tagHandle = GCHandle.Alloc(tag, GCHandleType.Pinned);
                try
                {
                    var info = new BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO();
                    info.cbSize = Marshal.SizeOf(typeof(BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO));
                    info.dwInfoVersion = 1;
                    info.pbNonce = ivHandle.AddrOfPinnedObject();
                    info.cbNonce = iv.Length;
                    info.pbTag = tagHandle.AddrOfPinnedObject();
                    info.cbTag = tag.Length;

                    int resultLen;
                    Check(BCryptEncrypt(hKey, plaintext, plaintext.Length, ref info, null, 0, ciphertext, ciphertext.Length, out resultLen, 0));

                    byte[] combined = new byte[ciphertext.Length + tag.Length];
                    Array.Copy(ciphertext, 0, combined, 0, ciphertext.Length);
                    Array.Copy(tag, 0, combined, ciphertext.Length, tag.Length);
                    return combined;
                }
                finally
                {
                    ivHandle.Free();
                    tagHandle.Free();
                }
            }
            finally
            {
                BCryptDestroyKey(hKey);
            }
        }
        finally
        {
            BCryptCloseAlgorithmProvider(hAlg, 0);
        }
    }

    private static void Check(int status)
    {
        if (status != 0) throw new InvalidOperationException("bcrypt.dll call failed: NTSTATUS 0x" + status.ToString("X8"));
    }
}
"@

Add-Type -TypeDefinition $cngSource -Language CSharp

if (-not (Test-Path -LiteralPath $InputFile -PathType Leaf)) {
    Write-Error "No such file: $InputFile"
    exit 1
}
$inputItem = Get-Item -LiteralPath $InputFile
if (-not $OutputFile) {
    $OutputFile = "$($inputItem.FullName).b64.txt"
}

$key = [Convert]::FromBase64String($KeyB64)
$iv = New-Object byte[] $GcmIvLength
(New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($iv)
$plaintext = [System.IO.File]::ReadAllBytes($inputItem.FullName)

$ciphertextAndTag = [AesGcmCng]::Encrypt($key, $iv, $plaintext)

$wire = New-Object byte[] ($iv.Length + $ciphertextAndTag.Length)
[Array]::Copy($iv, 0, $wire, 0, $iv.Length)
[Array]::Copy($ciphertextAndTag, 0, $wire, $iv.Length, $ciphertextAndTag.Length)

# Line-wrapped (not one giant unbroken line) - pasting a multi-megabyte single "word" with no
# natural break points is exactly the kind of input that makes a browser's text layout hang.
# decryptPastedFile() in chunkedUpload.ts strips all whitespace before decoding, so this round-trips
# fine either way.
$base64 = [Convert]::ToBase64String($wire, [System.Base64FormattingOptions]::InsertLineBreaks)
[System.IO.File]::WriteAllText($OutputFile, $base64)

Write-Host "Encrypted $($inputItem.Name) ($($plaintext.Length) bytes) -> $OutputFile"
Write-Host "Paste the contents of that file into the ""Upload from encrypted text"" panel,"
Write-Host "enter ""$($inputItem.Name)"" as the filename, and click Upload."
