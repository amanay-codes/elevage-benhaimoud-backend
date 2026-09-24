const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { app } = require("../server");
test("cloud app serves the website and protects admin routes without contacting services", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = "http://127.0.0.1:" + server.address().port;
  assert.equal((await fetch(base)).status, 200);
  assert.equal(
    (await (await fetch(base + "/api/health")).json()).mode,
    "production",
  );
  for (const route of [
    "/api/horses/admin/example",
    "/api/news/admin/example",
    "/api/gallery/admin/example",
    "/api/auth/me",
  ])
    assert.equal((await fetch(base + route)).status, 401);
  assert.equal((await fetch(base + "/api/horses?limit=0")).status, 400);
  assert.equal(
    (
      await fetch(base + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: { $ne: null }, password: "bad" }),
      })
    ).status,
    400,
  );
});
