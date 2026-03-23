import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {

  const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];
  const allowedDocTypes = ["application/pdf"];
  const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, and PDF files allowed"), false);
  }

};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

export default upload;