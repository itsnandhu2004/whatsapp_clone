const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "whatsapp-clone-avatars",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 500, height: 500, crop: "fill" }], // Crop into a perfect square automatically
  },
});

const attachmentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "whatsapp-clone-attachments",
    resource_type: "auto"
  },
});

const upload = multer({ storage });
const uploadAttachment = multer({ storage: attachmentStorage });

module.exports = { cloudinary, upload, uploadAttachment };
