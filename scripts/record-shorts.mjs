import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import http from "http";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ticker = (process.argv[2] || "AAPL").toUpperCase();
const outputDir = path.resolve(`exports/shorts/${ticker}`);
const tempVideoDir = path.resolve(`exports/shorts/${ticker}/temp`);

const SCENES = [
  { id: "revenue", filename: "01-ingresos-10-anos", name: "Gráfico de Ingresos (10 Años + Cid)" },
  { id: "fcf-margin", filename: "02-margen-fcf-10-anos", name: "Gráfico de Margen FCF (10 Años + Cid)" },
  { id: "fcf", filename: "03-flujo-caja-libre-10-anos", name: "Flujo de Caja Libre Total (10 Años + Cid)" },
  { id: "keys", filename: "04-las-6-claves", name: "Las 6 Claves Cuantitativas (Símbolos ✓ / ? / ✕)" },
  { id: "price", filename: "05-cotizacion-10-anos", name: "Precio de Cotización (10 Años + Cid)" },
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
    console.log("✅ Servidor local detectado en http://localhost:3000");
    return null;
  }

  console.log("🚀 Iniciando servidor de desarrollo Next.js en segundo plano...");
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

  devProcess.stderr.on("data", (data) => {
    // console.log("STDERR:", data.toString());
  });

  const startTime = Date.now();
  while (Date.now() - startTime < 45000) {
    await new Promise((r) => setTimeout(r, 1000));
    if (readyFlag || (await checkAnyRunning())) {
      // Esperar 1 segundo adicional para asegurar que las rutas estén montadas
      await new Promise((r) => setTimeout(r, 1500));
      console.log("✅ Servidor Next.js listo en http://localhost:3000");
      return devProcess;
    }
  }

  throw new Error("No se pudo iniciar el servidor Next.js a tiempo");
}

async function recordShorts() {
  console.log(`\n======================================================`);
  console.log(`🎬 MARKETCID STUDIO 9:16 - GENERADOR DE VÍDEO Y CAPTURAS`);
  console.log(`Empresa: ${ticker}`);
  console.log(`Destino: ${outputDir}`);
  console.log(`======================================================\n`);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(tempVideoDir, { recursive: true });

  const devServer = await ensureDevServer();

  console.log(`🌐 Abriendo navegador Chromium con aceleración GPU (1080x1920)...`);
  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--mute-audio",
      "--window-size=1080,1920",
    ],
  });

  try {
    for (const [index, scene] of SCENES.entries()) {
      console.log(`\n📹 [${index + 1}/${SCENES.length}] Grabando: ${scene.name}...`);

      const sceneTempDir = path.join(tempVideoDir, scene.id);
      fs.mkdirSync(sceneTempDir, { recursive: true });

      const context = await browser.newContext({
        viewport: { width: 1080, height: 1920 },
        deviceScaleFactor: 1,
        recordVideo: {
          dir: sceneTempDir,
          size: { width: 1080, height: 1920 },
        },
      });

      const page = await context.newPage();

      const url = `http://127.0.0.1:3000/studio/${ticker}?scene=${scene.id}&record=true`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

      // Esperar a que el lienzo 9:16 esté renderizado
      await page.waitForSelector("#short-canvas", { state: "visible", timeout: 15000 });

      // Tiempo de grabación: 9 segundos para permitir que Cid recorra todo el gráfico (animación de 8s)
      console.log(`   ⏳ Grabando animación de Cid (9 segundos)...`);
      await page.waitForTimeout(9000);

      // Capturar imagen PNG final de máxima calidad
      const imgPath = path.join(outputDir, `${scene.filename}.png`);
      const canvasEl = page.locator("#short-canvas");
      await canvasEl.screenshot({ path: imgPath });
      console.log(`   📸 Captura guardada: ${path.relative(process.cwd(), imgPath)}`);

      // Cerrar página y contexto para que Playwright guarde el vídeo WebM
      await page.close();
      await context.close();

      // Mover el vídeo grabado con el nombre final
      const files = fs.readdirSync(sceneTempDir);
      const webmFile = files.find((f) => f.endsWith(".webm"));
      if (webmFile) {
        const srcVideo = path.join(sceneTempDir, webmFile);
        const destVideo = path.join(outputDir, `${scene.filename}.webm`);
        fs.copyFileSync(srcVideo, destVideo);
        fs.unlinkSync(srcVideo);
        console.log(`   🎥 Vídeo 9:16 guardado: ${path.relative(process.cwd(), destVideo)}`);
      }
      fs.rmdirSync(sceneTempDir);
    }

    // Limpieza de temporal
    if (fs.existsSync(tempVideoDir)) {
      fs.rmSync(tempVideoDir, { recursive: true, force: true });
    }

    console.log(`\n🎉 ¡COMPLETADO CON ÉXITO!`);
    console.log(`Todos los clips y capturas están en: ${outputDir}`);
  } finally {
    await browser.close();
    if (devServer) {
      console.log("🛑 Deteniendo servidor Next.js...");
      devProcessKill(devServer);
    }
  }
}

function devProcessKill(child) {
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", child.pid.toString(), "/f", "/t"]);
    } else {
      child.kill("SIGTERM");
    }
  } catch (e) {
    // ignore
  }
}

recordShorts().catch((err) => {
  console.error("❌ Error grabando shorts:", err);
  process.exit(1);
});
