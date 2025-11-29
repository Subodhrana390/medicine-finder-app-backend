import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Storage configuration for different file types
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join("uploads", destination);
      createUploadDir(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
  });
};

// File filter for images
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and image files are allowed for documents"), false);
  }
};

// Shop images upload (up to 5 images, max 2MB each)
export const uploadShopImages = multer({
  storage: createStorage("shops"),
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 5
  }
});

// Medicine images upload (up to 3 images, max 1MB each)
export const uploadMedicineImages = multer({
  storage: createStorage("medicines"),
  fileFilter: imageFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB
    files: 3
  }
});

// Shop documents upload (license, GST certificate, address proof)
export const uploadShopDocuments = multer({
  storage: createStorage("documents/shops"),
  fileFilter: documentFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3
  }
});

// Medicine documents upload (regulatory documents)
export const uploadMedicineDocuments = multer({
  storage: createStorage("documents/medicines"),
  fileFilter: documentFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  }
});

// Middleware to process uploaded images (resize and optimize)
export const processImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    const processedFiles = [];

    for (const file of req.files) {
      const inputPath = file.path;
      const outputPath = path.join(
        path.dirname(inputPath),
        "processed-" + path.basename(inputPath)
      );

      // Resize and compress image
      await sharp(inputPath)
        .resize(800, 600, {
          fit: "inside",
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      // Replace original file with processed file
      fs.unlinkSync(inputPath);
      fs.renameSync(outputPath, inputPath);

      processedFiles.push({
        ...file,
        path: inputPath,
        size: fs.statSync(inputPath).size
      });
    }

    req.files = processedFiles;
    next();
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    const err = new Error("Image processing failed");
    err.statusCode = 500;
    next(err);
  }
};

// Middleware to validate file uploads
export const validateUploads = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    const error = new Error("No files uploaded");
    error.statusCode = 400;
    return next(error);
  }

  // Additional validation can be added here
  // For example, checking file dimensions, content validation, etc.

  next();
};

// Error handler for multer errors
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message;
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "File too large";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field";
        break;
      default:
        message = "File upload error";
    }

    const error = new Error(message);
    error.statusCode = 400;
    return next(error);
  }

  next(err);
};
