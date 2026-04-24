const multer = require("multer");
const path = require("path");
const { randomUUID } = require("crypto");
const env = require("../config/env");

if (env.fileStorageDriver !== "local") {
  console.warn(
    `FILE_STORAGE_DRIVER=${env.fileStorageDriver} is not implemented yet. Falling back to local disk uploads.`
  );
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, env.uploadDir),
  filename: (_, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname || ".pdf") || ".pdf"}`)
});

const upload = multer({
  storage,
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const isPdf = file.mimetype === "application/pdf" || path.extname(file.originalname || "").toLowerCase() === ".pdf";

    if (!isPdf) {
      cb(new Error("Only PDF files are allowed."));
      return;
    }

    cb(null, true);
  }
});

module.exports = upload;
