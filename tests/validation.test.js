const { test } = require("node:test");
const assert = require("node:assert/strict");
const { queryValidation, escapeRegex } = require("../middleware/validation");
test("production filters reject nested objects, excessive limits and arbitrary sorts", () => {
  for (const query of [
    { limit: "0" },
    { limit: "101" },
    { page: "-1" },
    { page: "1.5" },
    { breed: { $ne: "" } },
    { sort: "password" },
  ]) {
    let status,
      advanced = false;
    queryValidation(
      { query },
      {
        status(n) {
          status = n;
          return this;
        },
        json() {},
      },
      () => (advanced = true),
    );
    assert.equal(status, 400);
    assert.equal(advanced, false);
  }
  let advanced = false;
  queryValidation(
    { query: { page: "1", limit: "12", sort: "name" } },
    {},
    () => (advanced = true),
  );
  assert.equal(advanced, true);
  assert.equal(new RegExp(escapeRegex("A.*B")).test("AhelloB"), false);
  assert.equal(new RegExp(escapeRegex("A.*B")).test("A.*B"), true);
});
