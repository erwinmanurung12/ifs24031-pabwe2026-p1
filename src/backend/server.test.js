import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const listen = vi.fn((port, cb) => cb());
  return { listen, buildApp: vi.fn(() => ({ listen })) };
});
vi.mock("./bootstrap.js", () => ({ buildApp: mocks.buildApp }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
  mocks.listen.mockClear();
  mocks.buildApp.mockClear();
});

describe("server", () => {
  it("berjalan di port 8000 secara default", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubEnv("PORT", "");
    await import("./server.js");
    expect(mocks.listen).toHaveBeenCalledWith(8000, expect.any(Function));
    expect(mocks.buildApp.mock.calls[0][1].staticDir).toMatch(/dist$/);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("8000"));
  });

  it("memakai PORT dari environment", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubEnv("PORT", "1234");
    await import("./server.js");
    expect(mocks.listen).toHaveBeenCalledWith(1234, expect.any(Function));
  });
});
