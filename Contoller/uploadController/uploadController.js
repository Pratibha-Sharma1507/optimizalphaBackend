const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// S3 client setup
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ============ CONTROLLER FUNCTION ============
const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileName = `${Date.now()}-${file.originalname}`;

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    // Optional: save URL in DB
    // await FileModel.create({ name: file.originalname, url: fileUrl });

    res.status(200).json({
      message: "File uploaded successfully!",
      fileUrl,
    });
  } catch (error) {
    console.error("S3 Upload Error:", error);
    res.status(500).json({ message: "Upload failed", error });
  }
};

module.exports = { uploadFile };
