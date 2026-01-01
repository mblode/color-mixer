import { afterEach, describe, expect, it, vi } from "vitest";
import { checkWebGPUCapability } from "./webgpu";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("checkWebGPUCapability", () => {
  it("reports unsupported when navigator is unavailable", async () => {
    vi.stubGlobal("navigator", undefined);

    const result = await checkWebGPUCapability();

    expect(result).toMatchObject({
      supported: false,
      status: "unsupported",
      message: "Navigator is unavailable in this environment.",
    });
  });

  it("reports unsupported when navigator.gpu is missing", async () => {
<<<<<<< HEAD
    vi.stubGlobal("navigator", {} as Navigator);
=======
    vi.stubGlobal("navigator", {} as unknown as Navigator);
>>>>>>> 6d5602a (Save)

    const result = await checkWebGPUCapability();

    expect(result).toMatchObject({
      supported: false,
      status: "unsupported",
      message: "This browser does not expose navigator.gpu yet.",
    });
  });

  it("reports unsupported when no adapter is available", async () => {
    const requestAdapter = vi.fn(async () => null);
<<<<<<< HEAD
    vi.stubGlobal("navigator", { gpu: { requestAdapter } } as Navigator);
=======
    vi.stubGlobal("navigator", { gpu: { requestAdapter } } as unknown as Navigator);
>>>>>>> 6d5602a (Save)

    const result = await checkWebGPUCapability();

    expect(requestAdapter).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      supported: false,
      status: "unsupported",
      message: "No compatible WebGPU adapter was found.",
    });
  });

  it("reports supported when an adapter is acquired", async () => {
    const requestAdapter = vi.fn(async () => ({}));
<<<<<<< HEAD
    vi.stubGlobal("navigator", { gpu: { requestAdapter } } as Navigator);
=======
    vi.stubGlobal("navigator", { gpu: { requestAdapter } } as unknown as Navigator);
>>>>>>> 6d5602a (Save)

    const result = await checkWebGPUCapability();

    expect(requestAdapter).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      supported: true,
      status: "supported",
      message: "WebGPU adapter acquired successfully.",
    });
  });

  it("surfaces adapter errors from the WebGPU API", async () => {
    const requestAdapter = vi.fn(async () => {
      throw new Error("adapter failed");
    });
<<<<<<< HEAD
    vi.stubGlobal("navigator", { gpu: { requestAdapter } } as Navigator);
=======
    vi.stubGlobal("navigator", { gpu: { requestAdapter } } as unknown as Navigator);
>>>>>>> 6d5602a (Save)

    const result = await checkWebGPUCapability();

    expect(result).toMatchObject({
      supported: false,
      status: "unsupported",
      message: "adapter failed",
    });
  });

  it("handles non-error rejections defensively", async () => {
    const requestAdapter = vi.fn(async () => {
      throw "unexpected";
    });
<<<<<<< HEAD
    vi.stubGlobal("navigator", { gpu: { requestAdapter } } as Navigator);
=======
    vi.stubGlobal("navigator", { gpu: { requestAdapter } } as unknown as Navigator);
>>>>>>> 6d5602a (Save)

    const result = await checkWebGPUCapability();

    expect(result).toMatchObject({
      supported: false,
      status: "unsupported",
      message: "Unknown WebGPU initialization error.",
    });
  });
});
