import puppeteer from "puppeteer";
import * as vite from "vite";
import { HEIGHT, WIDTH } from "./src/config.js"

async function generatePDF() {
  const viewport = { width: WIDTH * 2, height: HEIGHT * 2 };
  const browser = await puppeteer.launch({
    product: "chrome",
    headless: false,
    waitForInitialPage: true,
    defaultViewport: viewport,
    args: [],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
  );
  await page.setJavaScriptEnabled(true);
  await page.setViewport(viewport);
  await page.emulateMediaType("print");
  await page.goto("http://localhost:5173/", {
    waitUntil: ["networkidle0", "domcontentloaded", "load", "networkidle2"],
  });
  await page.evaluateHandle("document.fonts.ready");
  const body = await page.$("html");
  const { width, height } = await body.boundingBox();

  console.log({ width, height });

  await page.screenshot({
    captureBeyondViewport: false,
    clip: {
      x: 0,
      y: 0,
      height: HEIGHT,
      width: WIDTH,
      scale: 1
    },
    omitBackground: true,
    encoding: 'binary',
    path: './image.png',
    fullPage: false
  })

  await page.close();
  await browser.close();
}

async function startServer() {
  return await vite.createServer({
    logLevel: "info",
  });
}

const server = await startServer();
await server.listen();
await generatePDF();
await server.close();
