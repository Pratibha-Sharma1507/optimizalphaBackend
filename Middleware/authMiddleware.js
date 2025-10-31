const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ Error: "No token provided. Access denied." });
    }

    jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, decoded) => {
      if (err) {
        return res.status(403).json({ Error: "Token is not valid." });
      }
      
      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(401).json({ Error: "Authentication failed" });
  }
};

module.exports = { verifyToken };

