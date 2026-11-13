import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import http from "http";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FFMPEG_PATH = "C:\\Users\\unala\\AppData\\Local\\ms-playwright\\ffmpeg-1013\\ffmpeg-win64.exe";

const ticker = (process.argv[2] || "AAPL").toUpperCase();
const outputDir = path.resolve(`exports/shorts/${ticker}`);
const tempVideoDir = path.resolve(`exports/shorts/${ticker}/temp`);

const SCENES = [
  {
    id: "revenue",
    filename: "01-ingresos-10-anos",
    name: "01. Ingresos (10 Años · Modal Barras Castillo + Cid)",
    type: "modal",
    url: (t) => `http://localhost:3000/ticker/${t}/financials?series=revenue`,
    recordSeconds: 13,
  },
  {
    id: "fcfMargin",
    filename: "02-margen-fcf-10-anos",
    name: "02. Margen FCF (10 Años · Modal Barras Castillo + Cid)",
    type: "modal",
    url: (t) => `http://localhost:3000/ticker/${t}/financials?series=fcfMargin`,
    recordSeconds: 13,
  },
  {
    id: "freeCashFlow",
    filename: "03-flujo-caja-libre-10-anos",
    name: "03. Flujo de Caja Libre (10 Años · Modal Barras Castillo + Cid)",
    type: "modal",
    url: (t) => `http://localhost:3000/ticker/${t}/financials?series=freeCashFlow`,
    recordSeconds: 13,
  },
  {
    id: "keys",
    filename: "04-las-6-claves",
    name: "04. Las 6 Claves Cuantitativas (Símbolos ✓ / ? / ✕)",
    type: "keys",
    url: (t) => `http://localhost:3000/ticker/${t}`,
    recordSeconds: 7,
  },
  {
    id: "price",
    filename: "05-cotizacion-10-anos",
    name: "05. Cotización Histórica (10 Años · Curva + Cid)",
    type: "price",
    url: (t) => `http://localhost:3000/ticker/${t}`,
    recordSeconds: 13,
  },
];

function isServerRunning(host = "127.0.0.1", port = 3000) {
  return new Promise((resolve) => {
    const req = http.get({ host, port, path: "/" }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function checkAnyRunning() {
  const [r1, r2] = await Promise.all([
    isServerRunning("127.0.0.1", 3000),
    isServerRunning("localhost", 3000),
  ]);
  return r1 || r2;
}

async function ensureDevServer() {
  if (await checkAnyRunning()) {
    console.log("✅ Servidor web detectado en http://localhost:3000");
    return null;
  }

  console.log("🚀 Iniciando servidor de desarrollo Next.js...");
  let readyFlag = false;

  const devProcess = spawn("npm.cmd", ["run", "dev"], {
    cwd: process.cwd(),
    shell: true,
    stdio: "pipe",
  });

  devProcess.stdout.on("data", (data) => {
    const msg = data.toString();
    if (msg.includes("Ready in") || msg.includes("started server on") || msg.includes("http://localhost:3000")) {
      console.log("   " + msg.trim());
      readyFlag = true;
    }
  });

  const startTime = Date.now();
  while (Date.now() - startTime < 45000) {
    await new Promise((r) => setTimeout(r, 1000));
    if (readyFlag || (await checkAnyRunning())) {
      await new Promise((r) => setTimeout(r, 1500));
      console.log("✅ Servidor Next.js listo en http://localhost:3000");
      return devProcess;
    }
  }

  throw new Error("No se pudo iniciar el servidor Next.js a tiempo");
}

function convertToMp4(inputWebm, outputMp4) {
  return new Promise((resolve) => {
    if (!fs.existsSync(FFMPEG_PATH)) {
      resolve(false);
      return;
    }

    const proc = spawn(
      FFMPEG_PATH,
      [
        "-y",
        "-i",
        inputWebm,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-r",
        "30",
        "-crf",
        "18",
        outputMp4,
      ],
      { stdio: "ignore" }
    );

    proc.on("close", (code) => {
      resolve(code === 0);
    });
    proc.on("error", () => resolve(false));
  });
}

async function recordShorts() {
  console.log(`\n======================================================`);
  console.log(`🎬 MARKETCID · CAPTURA DIRECTA Y VÍDEO 9:16 (REAL APP)`);
  console.log(`Empresa: ${ticker}`);
  console.log(`Destino: ${outputDir}`);
  console.log(`======================================================\n`);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(tempVideoDir, { recursive: true });

  const devServer = await ensureDevServer();

  console.log(`🌐 Abriendo navegador Chromium (Viewport 720x1280 @ 1.5x -> 1080x1920 vertical)...`);
  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--mute-audio",
      "--window-size=720,1280",
    ],
  });

  try {
    for (const [index, scene] of SCENES.entries()) {
      console.log(`\n📹 [${index + 1}/${SCENES.length}] Grabando: ${scene.name}...`);

      const sceneTempDir = path.join(tempVideoDir, scene.id);
      fs.mkdirSync(sceneTempDir, { recursive: true });

      const context = await browser.newContext({
        viewport: { width: 720, height: 1280 },
        deviceScaleFactor: 1.5,
        recordVideo: {
          dir: sceneTempDir,
          size: { width: 1080, height: 1920 },
        },
      });

      const page = await context.newPage();
      const targetUrl = scene.url(ticker);

      console.log(`   🔗 Cargando página real: ${targetUrl}`);
      await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 45000 });

      if (scene.type === "modal") {
        // Esperar a que el diálogo modal se renderice
        await page.waitForSelector('[role="dialog"]', { state: "visible", timeout: 15000 });
        // Asegurar que las barras y la animación estén listas
        await page.waitForTimeout(1000);
      } else if (scene.type === "keys") {
        // En la página de perfil, scroll limpio hasta "Las seis claves"
        await page.waitForTimeout(1500);
        await page.evaluate(() => {
          const heading = Array.from(document.querySelectorAll("h2")).find((h) =>
            h.textContent.includes("Las seis claves")
          );
          if (heading) {
            const section = heading.closest("section");
            if (section) {
              const offset = 68; // altura del header sticky
              const top = section.getBoundingClientRect().top + window.pageYOffset - offset;
              window.scrollTo({ top, behavior: "instant" });
            }
          }
        });
        await page.waitForTimeout(500);
      } else if (scene.type === "price") {
        // En la cotización histórica, asegurar scroll superior
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForTimeout(1000);
      }

      console.log(`   ⏳ Grabando recorrido de Cid en tiempo real (${scene.recordSeconds}s)...`);
      await page.waitForTimeout(scene.recordSeconds * 1000);

      // Capturar imagen PNG de máxima resolución (1080x1920)
      const imgPath = path.join(outputDir, `${scene.filename}.png`);
      await page.screenshot({ path: imgPath });
      console.log(`   📸 Captura guardada: ${path.relative(process.cwd(), imgPath)} (1080x1920)`);

      // Cerrar página y contexto para que Playwright guarde el vídeo WebM
      await page.close();
      await context.close();

      // Mover el vídeo grabado al destino final
      const files = fs.readdirSync(sceneTempDir);
      const webmFile = files.find((f) => f.endsWith(".webm"));
      if (webmFile) {
        const rawVideoPath = path.join(sceneTempDir, webmFile);
        const finalWebmPath = path.join(outputDir, `${scene.filename}.webm`);
        fs.copyFileSync(rawVideoPath, finalWebmPath);
        console.log(`   🎞️ Vídeo WebM listo: ${path.relative(process.cwd(), finalWebmPath)}`);

        // Convertir también a MP4 para máxima compatibilidad con Filmora
        const finalMp4Path = path.join(outputDir, `${scene.filename}.mp4`);
        const ok = await convertToMp4(finalWebmPath, finalMp4Path);
        if (ok) {
          console.log(`   🎥 Vídeo MP4 listo:  ${path.relative(process.cwd(), finalMp4Path)}`);
        }
      }
    }

    // Limpiar temporales
    try {
      fs.rmSync(tempVideoDir, { recursive: true, force: true });
    } catch {
      // Ignorar
    }

    console.log(`\n======================================================`);
    console.log(`🎉 ¡PROCESO COMPLETADO CON ÉXITO PARA ${ticker}!`);
    console.log(`Todos los vídeos (.webm y .mp4) y fotos (.png) se encuentran en:`);
    console.log(`${outputDir}`);
    console.log(`======================================================\n`);
  } finally {
    await browser.close();
    if (devServer) {
      devServer.kill();
    }
  }
}

recordShorts().catch((err) => {
  console.error("❌ Error durante la grabación:", err);
  process.exit(1);
});
