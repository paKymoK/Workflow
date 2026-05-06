package com.takypok.mediaservice.ffmpeg;

import org.springframework.stereotype.Component;

@Component
public class PlatformDetector {

  public OsArchPlatform detect() {
    String os = System.getProperty("os.name").toLowerCase();
    String arch = System.getProperty("os.arch").toLowerCase();
    boolean isArm = arch.contains("aarch64") || arch.contains("arm");

    if (os.contains("win")) return OsArchPlatform.WINDOWS_X64;
    if (os.contains("mac")) return isArm ? OsArchPlatform.MAC_ARM64 : OsArchPlatform.MAC_X64;
    return isArm ? OsArchPlatform.LINUX_ARM64 : OsArchPlatform.LINUX_X64;
  }
}
