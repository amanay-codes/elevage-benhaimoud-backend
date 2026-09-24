// Run npm run test:browser. Windows uses installed Edge; elsewhere run npx playwright install chromium.
const { chromium } = require("playwright");
const { createServer } = require("../demo/server");
const { once } = require("node:events");
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path");
const assert = require("node:assert/strict");
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "elevage-browser-"));
  const server = createServer({ dataFile: path.join(dir, "db.json") });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = "http://127.0.0.1:" + server.address().port;
  const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.BROWSER_PATH
        ? { executablePath: process.env.BROWSER_PATH }
        : fs.existsSync(edge)
          ? { executablePath: edge }
          : {}),
    });
    const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    fs.mkdirSync("test-results", { recursive: true });
    await page.goto(base);
    await page.getByRole("heading", { name: "A legacy in motion." }).waitFor();
    await page.screenshot({
      path: "test-results/home-desktop.png",
      fullPage: true,
    });
    await page.goto(base + "/#/horses/atlas");
    await page.getByRole("heading", { name: "Atlas", exact: true }).waitFor();
    await page.goto(base + "/#/horses");
    await page
      .getByRole("textbox", { name: "Search", exact: true })
      .fill("Atlas");
    await page.getByRole("button", { name: /^Filter/ }).click();
    await page.waitForURL(/search=Atlas/);
    await page.waitForFunction(
      () => document.querySelectorAll(".listing .card").length === 1,
    );
    assert.equal(await page.locator(".listing .card").count(), 1);
    await page.goto(base + "/#/admin");
    await page.getByLabel("Password", { exact: true }).fill("Benhaimoud2026!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("heading", { name: "The dashboard." }).waitFor();
    await page.getByRole("button", { name: "+ Add horse" }).click();
    await page.getByLabel("Name", { exact: true }).fill("Browser test horse");
    await page.getByRole("button", { name: "Save horse" }).click();
    await page
      .getByRole("heading", { name: "Add horse", exact: true })
      .waitFor({ state: "detached" });
    await page
      .getByRole("row")
      .filter({ hasText: "Browser test horse" })
      .getByRole("button", { name: "Edit", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Edit horse", exact: true })
      .waitFor();
    await page.getByLabel("Name", { exact: true }).fill("Browser test renamed");
    await page.getByRole("button", { name: "Save horse" }).click();
    await page
      .getByRole("heading", { name: "Edit horse", exact: true })
      .waitFor({ state: "detached" });
    await page.getByText("Browser test renamed", { exact: true }).waitFor();
    page.once("dialog", (d) => d.accept());
    await page
      .getByRole("row")
      .filter({ hasText: "Browser test renamed" })
      .getByRole("button", { name: "Delete" })
      .click();
    await page
      .getByText("Browser test renamed", { exact: true })
      .waitFor({ state: "detached" });
    await page.getByRole("heading", { name: "The dashboard." }).waitFor();
    console.log("PASS: public pages, filtering, horse create/edit/delete");
    await page.getByRole("tab", { name: "Journal" }).click();
    await page.getByRole("button", { name: "+ Add article" }).click();
    await page.getByLabel("Title", { exact: true }).fill("Browser draft");
    await page
      .getByLabel("Article text", { exact: true })
      .fill("Draft content tested in browser");
    await page.getByRole("button", { name: "Save article" }).click();
    await page
      .getByRole("heading", { name: "Add article", exact: true })
      .waitFor({ state: "detached" });
    await page
      .getByRole("row")
      .filter({ hasText: "Browser draft" })
      .getByRole("button", { name: "Edit", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Edit article", exact: true })
      .waitFor();
    assert.equal(
      await page.getByLabel("Article text", { exact: true }).inputValue(),
      "Draft content tested in browser",
    );
    await page.getByLabel("Published (visible to visitors)").check();
    await page.getByRole("button", { name: "Save article" }).click();
    await page
      .getByRole("heading", { name: "Edit article", exact: true })
      .waitFor({ state: "detached" });
    await page
      .getByRole("row")
      .filter({ hasText: "Browser draft" })
      .getByText("Published", { exact: true })
      .waitFor();
    console.log("PASS: draft retrieval and publication");
    await page.getByRole("tab", { name: "Gallery", exact: true }).click();
    await page.getByRole("button", { name: "+ Add media" }).click();
    await page.getByLabel("Caption", { exact: true }).fill("Browser upload");
    await page
      .locator("input[type=file]")
      .setInputFiles(path.join(__dirname, "../public/assets/atlas.jpg"));
    await page.getByRole("button", { name: "Save media" }).click();
    await page
      .getByRole("heading", { name: "Add media", exact: true })
      .waitFor({ state: "detached" });
    await page.getByText("Browser upload", { exact: true }).waitFor();
    await page.screenshot({
      path: "test-results/dashboard-desktop.png",
      fullPage: true,
    });
    await page.goto(base + "/#/gallery");
    await page.getByRole("button", { name: "Enlarge Browser upload" }).click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: "Close photograph" }).click();
    console.log("PASS: image upload and public gallery lightbox");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base);
    await page.getByRole("heading", { name: "A legacy in motion." }).waitFor();
    await page.screenshot({
      path: "test-results/home-mobile.png",
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.getByRole("button", { name: "Menu" }).click();
    await page
      .locator("nav")
      .getByRole("link", { name: "Our horses", exact: true })
      .click();
    await page.getByRole("heading", { name: "Our horses." }).waitFor();
    await page.getByRole("button", { name: "Switch language" }).click();
    await page.waitForFunction(() => document.documentElement.dir === "rtl");
    await page.getByRole("heading", { name: "خيولنا." }).waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    console.log("PASS: mobile navigation, layout, Arabic and RTL");
    assert.deepEqual(errors, []);
    console.log("PASS: no browser JavaScript errors");
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
