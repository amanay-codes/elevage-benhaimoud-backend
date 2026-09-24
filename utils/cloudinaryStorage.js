// Multer storage engine using the current Cloudinary SDK directly.
class CloudinaryStorage {
  constructor({ cloudinary, params }) {
    this.cloudinary = cloudinary;
    this.params = params;
  }

  async _handleFile(req, file, callback) {
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      callback(error, result);
    };
    try {
      const params =
        typeof this.params === "function"
          ? await this.params(req, file)
          : this.params;
      const stream = this.cloudinary.uploader.upload_stream(
        params,
        (error, result) => {
          if (error) return finish(error);
          finish(null, {
            path: result.secure_url,
            filename: result.public_id,
            size: result.bytes,
          });
        },
      );
      stream.on("error", finish);
      file.stream.on("error", (error) => {
        stream.destroy();
        finish(error);
      });
      file.stream.pipe(stream);
    } catch (error) {
      finish(error);
    }
  }

  _removeFile(req, file, callback) {
    this.cloudinary.uploader.destroy(
      file.filename,
      {
        resource_type: file.mimetype?.startsWith("video/") ? "video" : "image",
        invalidate: true,
      },
      callback,
    );
  }
}
module.exports = { CloudinaryStorage };
