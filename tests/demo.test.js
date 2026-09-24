const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { once } = require("node:events");
const { createServer } = require("../demo/server");
test("local preview: authentication, CRUD, drafts, persistence, validation and password rotation", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "elevage-test-"));
  const options = {
    dataFile: path.join(dir, "db.json"),
    email: "test@example.com",
    password: "TestPassword2026!",
  };
  let server = createServer(options);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  let base = "http://127.0.0.1:" + server.address().port,
    token = "";
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  async function request(route, method = "GET", body, authorized = true) {
    const response = await fetch(base + route, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authorized && token ? { Authorization: "Bearer " + token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  }
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await request("/api/health")).body.mode, "demo");
  assert.equal((await request("/api/horses", "POST", {})).status, 401);
  assert.equal(
    (
      await request("/api/auth/login", "POST", {
        email: options.email,
        password: "wrong",
      })
    ).status,
    401,
  );
  const login = await request("/api/auth/login", "POST", {
    email: options.email,
    password: options.password,
  });
  assert.equal(login.status, 200);
  token = login.body.token;
  assert.equal((await request("/api/horses?limit=0")).status, 400);
  assert.equal((await request("/api/horses?limit=101")).status, 400);
  assert.equal(
    (await request("/api/horses", "POST", { name: "Bad" })).status,
    400,
  );
  const created = await request("/api/horses", "POST", {
    name: "Test horse",
    breed: "Arabian",
    sex: "mare",
    status: "active",
    pedigree: { sire: { name: "Test sire" } },
  });
  assert.equal(created.status, 201);
  const horse = created.body.data;
  assert.equal(
    (await request("/api/horses/" + horse.slug)).body.data.pedigree.sire.name,
    "Test sire",
  );
  const updated = await request("/api/horses/" + horse._id, "PUT", {
    name: "Renamed",
  });
  assert.equal(updated.body.data.slug, horse.slug);
  assert.equal((await request("/api/horses?search=Renamed")).body.total, 1);
  const draft = await request("/api/news", "POST", {
    title: "Draft article",
    content: "Private draft text",
    category: "news",
    isPublished: false,
  });
  assert.equal(draft.status, 201);
  const news = draft.body.data;
  assert.equal((await request("/api/news/" + news.slug)).status, 404);
  assert.equal(
    (await request("/api/news/admin/" + news._id, "GET", undefined, false))
      .status,
    401,
  );
  assert.equal(
    (await request("/api/news/admin/" + news._id)).body.data.content,
    "Private draft text",
  );
  const published = await request("/api/news/" + news._id, "PUT", {
    isPublished: true,
  });
  assert.ok(published.body.data.publishedAt);
  assert.equal((await request("/api/news/" + news.slug)).status, 200);
  const media = await request("/api/gallery", "POST", {
    url: "data:image/png;base64,aGVsbG8=",
    caption: "Test photo",
    category: "horses",
  });
  assert.equal(media.status, 201);
  assert.equal(
    (
      await request("/api/gallery", "POST", {
        url: "javascript:alert(1)",
        category: "horses",
      })
    ).status,
    400,
  );
  assert.equal(
    (await request("/api/gallery/" + media.body.data._id, "DELETE")).status,
    200,
  );
  await new Promise((resolve) => server.close(resolve));
  server = createServer(options);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = "http://127.0.0.1:" + server.address().port;
  assert.equal(
    (await request("/api/horses/" + horse.slug)).body.data.name,
    "Renamed",
  );
  assert.equal((await request("/api/auth/me")).status, 401);
  token = (
    await request("/api/auth/login", "POST", {
      email: options.email,
      password: options.password,
    })
  ).body.token;
  assert.equal(
    (
      await request("/api/auth/password", "PUT", {
        currentPassword: options.password,
        password: "ChangedPassword2026!",
      })
    ).status,
    200,
  );
  assert.equal((await request("/api/auth/me")).status, 401);
  assert.equal(
    (
      await request("/api/auth/login", "POST", {
        email: options.email,
        password: options.password,
      })
    ).status,
    401,
  );
  token = (
    await request("/api/auth/login", "POST", {
      email: options.email,
      password: "ChangedPassword2026!",
    })
  ).body.token;
  assert.equal(
    (await request("/api/horses/" + horse._id, "DELETE")).status,
    200,
  );
  assert.equal((await request("/api/horses/" + horse.slug)).status, 404);
  assert.equal((await request("/api/auth/logout", "POST")).status, 200);
  assert.equal((await request("/api/auth/me")).status, 401);
});
