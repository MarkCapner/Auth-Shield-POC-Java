export interface DeviceFingerprint {
  fingerprint: string;
  userAgent: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  timezone: string;
  language: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory: number | null;
  touchSupport: boolean;
  webglVendor: string;
  webglRenderer: string;
  canvasFingerprint: string;
  audioFingerprint: string;
  fonts: string[];
  plugins: string[];
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function parseUserAgent(ua: string): { browser: string; browserVersion: string; os: string; osVersion: string } {
  let browser = "Unknown";
  let browserVersion = "";
  let os = "Unknown";
  let osVersion = "";

  // Browser detection
  if (ua.includes("Firefox/")) {
    browser = "Firefox";
    browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("Edg/")) {
    browser = "Edge";
    browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("Chrome/")) {
    browser = "Chrome";
    browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || "";
  } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
    browser = "Safari";
    browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || "";
  }

  // OS detection
  if (ua.includes("Windows NT 10")) {
    os = "Windows";
    osVersion = "10/11";
  } else if (ua.includes("Windows NT 6.3")) {
    os = "Windows";
    osVersion = "8.1";
  } else if (ua.includes("Windows NT 6.1")) {
    os = "Windows";
    osVersion = "7";
  } else if (ua.includes("Mac OS X")) {
    os = "macOS";
    osVersion = ua.match(/Mac OS X ([\d_.]+)/)?.[1]?.replace(/_/g, ".") || "";
  } else if (ua.includes("Linux")) {
    os = "Linux";
  } else if (ua.includes("Android")) {
    os = "Android";
    osVersion = ua.match(/Android ([\d.]+)/)?.[1] || "";
  } else if (ua.includes("iPhone") || ua.includes("iPad")) {
    os = "iOS";
    osVersion = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") || "";
  }

  return { browser, browserVersion, os, osVersion };
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|opera m(ob|in)i|windows (ce|phone)/i.test(ua)) return "mobile";
  return "desktop";
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("IdentityIQ", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("IdentityIQ", 4, 17);

    return hashString(canvas.toDataURL());
  } catch {
    return "";
  }
}

function getWebGLInfo(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { vendor: "", renderer: "" };

    const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return { vendor: "", renderer: "" };

    return {
      vendor: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "",
      renderer: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "",
    };
  } catch {
    return { vendor: "", renderer: "" };
  }
}

function getAudioFingerprint(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        resolve("");
        return;
      }

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gainNode = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      gainNode.gain.value = 0;
      oscillator.type = "triangle";
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(0);

      const fingerprint: number[] = [];
      scriptProcessor.onaudioprocess = (event) => {
        const output = event.inputBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i += 100) {
          fingerprint.push(output[i]);
        }
        
        oscillator.disconnect();
        scriptProcessor.disconnect();
        gainNode.disconnect();
        context.close();
        
        resolve(hashString(fingerprint.join(",")));
      };

      setTimeout(() => {
        try {
          oscillator.disconnect();
          scriptProcessor.disconnect();
          gainNode.disconnect();
          context.close();
        } catch {}
        resolve(hashString(fingerprint.join(",")));
      }, 500);
    } catch {
      resolve("");
    }
  });
}

function getInstalledFonts(): string[] {
  const baseFonts = ["monospace", "sans-serif", "serif"];
  const testFonts = [
    "Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana",
    "Georgia", "Palatino", "Garamond", "Comic Sans MS", "Trebuchet MS",
    "Arial Black", "Impact", "Lucida Console", "Tahoma", "Geneva",
    "Century Gothic", "Monaco", "Consolas", "Menlo", "Ubuntu",
  ];

  const detectedFonts: string[] = [];

  try {
    const span = document.createElement("span");
    span.style.position = "absolute";
    span.style.left = "-9999px";
    span.style.fontSize = "72px";
    span.textContent = "mmmmmmmmmmlli";
    document.body.appendChild(span);

    const baseWidths: Record<string, number> = {};
    for (const baseFont of baseFonts) {
      span.style.fontFamily = baseFont;
      baseWidths[baseFont] = span.offsetWidth;
    }

    for (const font of testFonts) {
      for (const baseFont of baseFonts) {
        span.style.fontFamily = `"${font}", ${baseFont}`;
        if (span.offsetWidth !== baseWidths[baseFont]) {
          detectedFonts.push(font);
          break;
        }
      }
    }

    document.body.removeChild(span);
  } catch {}

  return detectedFonts;
}

function getPlugins(): string[] {
  const plugins: string[] = [];
  try {
    for (let i = 0; i < navigator.plugins.length; i++) {
      plugins.push(navigator.plugins[i].name);
    }
  } catch {}
  return plugins;
}

export async function collectDeviceFingerprint(): Promise<DeviceFingerprint> {
  const ua = navigator.userAgent;
  const { browser, browserVersion, os, osVersion } = parseUserAgent(ua);
  const webgl = getWebGLInfo();
  const canvasFingerprint = getCanvasFingerprint();
  const audioFingerprint = await getAudioFingerprint();
  const fonts = getInstalledFonts();
  const plugins = getPlugins();

  const fingerprintData = {
    userAgent: ua,
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType: getDeviceType(),
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || null,
    touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    webglVendor: webgl.vendor,
    webglRenderer: webgl.renderer,
    canvasFingerprint,
    audioFingerprint,
    fonts,
    plugins,
  };

  // Generate fingerprint hash
  const fingerprintString = JSON.stringify({
    ...fingerprintData,
    fonts: fonts.sort(),
    plugins: plugins.sort(),
  });
  const fingerprint = hashString(fingerprintString) + hashString(canvasFingerprint + audioFingerprint);

  return {
    ...fingerprintData,
    fingerprint,
  };
}
