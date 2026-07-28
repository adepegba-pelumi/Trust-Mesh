import { describe, expect, it } from "vitest";

import {
  connectWalletHint,
  desktopWalletUnavailableMessage,
  formatConnectError,
  isMetaMaskInAppBrowser,
  isMobileBrowser,
  mobileWalletUnavailableMessage,
} from "@/lib/wallet";

describe("isMobileBrowser", () => {
  it("detects iPhone Safari", () => {
    expect(
      isMobileBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
      ),
    ).toBe(true);
  });

  it("detects desktop Chrome", () => {
    expect(
      isMobileBrowser(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
    ).toBe(false);
  });
});

describe("connectWalletHint", () => {
  it("returns null when injected wallet is present", () => {
    expect(connectWalletHint(true, false)).toBeNull();
  });

  it("never mentions browser extension on mobile", () => {
    const hint = connectWalletHint(false, true);
    expect(hint).toBeTruthy();
    expect(hint!.toLowerCase()).not.toContain("extension");
  });

  it("mentions extension only on desktop", () => {
    const hint = connectWalletHint(false, false);
    expect(hint!.toLowerCase()).toContain("extension");
  });
});

describe("formatConnectError", () => {
  it("handles user rejection", () => {
    expect(formatConnectError(new Error("User rejected the request"))).toMatch(/rejected/i);
  });

  it("handles wrong network", () => {
    expect(formatConnectError(new Error("Unsupported chain id"))).toMatch(/sepolia/i);
  });
});

describe("unavailable messages", () => {
  it("mobile message does not mention extension", () => {
    expect(mobileWalletUnavailableMessage().toLowerCase()).not.toContain("extension");
  });

  it("desktop message mentions extension", () => {
    expect(desktopWalletUnavailableMessage().toLowerCase()).toContain("extension");
  });
});

describe("isMetaMaskInAppBrowser", () => {
  it("is false when window is undefined", () => {
    expect(isMetaMaskInAppBrowser()).toBe(false);
  });
});
