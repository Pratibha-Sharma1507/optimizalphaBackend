const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        Status: "Error",
        Message: "Access denied. No token provided.",
      });
    }

    jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, decoded) => {
      if (err) {
        return res.status(403).json({
          Status: "Error",
          Message: "Invalid or expired token.",
        });
      }

      req.user = decoded; // attach decoded user info (id, role, etc.)
      next();
    });
  } catch (error) {
    return res.status(500).json({
      Status: "Error",
      Message: "Authentication failed",
      Error: error.message,
    });
  }
};

module.exports = { verifyToken };
