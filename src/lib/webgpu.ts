export type WebGPUCapabilityStatus = "checking" | "supported" | "unsupported";

export interface WebGPUCapabilityResult {
  supported: boolean;
  status: WebGPUCapabilityStatus;
  message?: string;
}

const createUnsupportedResult = (message: string): WebGPUCapabilityResult => ({
  supported: false,
  status: "unsupported",
  message,
});

export async function checkWebGPUCapability(): Promise<WebGPUCapabilityResult> {
  if (typeof navigator === "undefined") {
    return createUnsupportedResult(
      "Navigator is unavailable in this environment."
    );
  }

  const navigatorWithGPU = navigator as Navigator & { gpu?: GPU };

  if (!("gpu" in navigatorWithGPU && navigatorWithGPU.gpu)) {
    return createUnsupportedResult(
      "This browser does not expose navigator.gpu yet."
    );
  }

  try {
    const adapter = await navigatorWithGPU.gpu.requestAdapter();
    if (!adapter) {
      return createUnsupportedResult("No compatible WebGPU adapter was found.");
    }

    return {
      supported: true,
      status: "supported",
      message: "WebGPU adapter acquired successfully.",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown WebGPU initialization error.";
    return createUnsupportedResult(message);
  }
}
