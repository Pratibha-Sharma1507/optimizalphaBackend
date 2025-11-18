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
    const { account_id } = req.body; // frontend se aayega

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!account_id) {
      return res.status(400).json({ message: "account_id is required" });
    }

    //  Folder structure: account_id/filename
    const fileName = `${Date.now()}-${file.originalname}`;
    const fileKey = `${account_id}/${fileName}`;

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    // Upload to S3
    await s3.send(new PutObjectCommand(uploadParams));

    //  File URL (public accessible if bucket policy allows)
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    // Optional: save file info in DB
    // await FileModel.create({ account_id, name: file.originalname, url: fileUrl });

    res.status(200).json({
      message: "File uploaded successfully!",
      account_id,
      fileUrl,
      filePath: fileKey,
    });
  } catch (error) {
    console.error("S3 Upload Error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

const getuser =  async (req, res) => {
  try {
    res.status(200).json({
      message: "User fetched successfully",
      user_id: req.user._id,
      account_id: req.user.account_id, // user ke schema me yeh field honi chahiye
      email: req.user.email,
      role: req.user.role,
    });
  } catch (error) {
    console.error("Current User Error:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
};

module.exports = { uploadFile, getuser };
