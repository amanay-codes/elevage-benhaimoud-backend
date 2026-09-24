const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Readable, Writable } = require("node:stream");
const { CloudinaryStorage } = require("../utils/cloudinaryStorage");
test("upload adapter streams bytes and maps Cloudinary response", async () => {
  let bytes = "";
  const cloudinary = {
    uploader: {
      upload_stream(options, callback) {
        assert.equal(options.folder, "test");
        return new Writable({
          write(chunk, encoding, next) {
            bytes += chunk;
            next();
          },
          final(next) {
            callback(null, {
              secure_url: "https://example.com/image.jpg",
              public_id: "test/image",
              bytes: 5,
            });
            next();
          },
        });
      },
    },
  };
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async () => ({ folder: "test" }),
  });
  const result = await new Promise((resolve, reject) =>
    storage._handleFile(
      {},
      { stream: Readable.from(["hello"]) },
      (error, file) => (error ? reject(error) : resolve(file)),
    ),
  );
  assert.equal(bytes, "hello");
  assert.equal(result.filename, "test/image");
  assert.equal(result.size, 5);
});
test("upload adapter reports provider failure and removes videos with correct resource type", async () => {
  const cloudinary = {
    uploader: {
      upload_stream(options, callback) {
        return new Writable({
          write(chunk, encoding, next) {
            next();
          },
          final(next) {
            callback(new Error("Provider unavailable"));
            next();
          },
        });
      },
      destroy(id, options, callback) {
        assert.equal(id, "video-id");
        assert.equal(options.resource_type, "video");
        callback(null, { result: "ok" });
      },
    },
  };
  const storage = new CloudinaryStorage({ cloudinary, params: {} });
  const error = await new Promise((resolve) =>
    storage._handleFile({}, { stream: Readable.from(["hello"]) }, resolve),
  );
  assert.match(error.message, /Provider unavailable/);
  await new Promise((resolve, reject) =>
    storage._removeFile(
      {},
      { filename: "video-id", mimetype: "video/mp4" },
      (error) => (error ? reject(error) : resolve()),
    ),
  );
});
