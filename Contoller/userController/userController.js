const connection = require("../../Model/dbConnect");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ==================== SIGNUP ====================
const signupUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ Error: "All fields are required" });
    }

    // Check if user already exists
    const checkQuery = "SELECT * FROM users WHERE email = ?";
    connection.query(checkQuery, [email], async (error, result) => {
      if (error) {
        return res.status(500).json({ Error: error.sqlMessage });
      }

      if (result.length > 0) {
        return res.status(400).json({ Error: "Email already exists" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert new user
      const insertQuery = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
      connection.query(insertQuery, [username, email, hashedPassword], (err, data) => {
        if (err) {
          return res.status(500).json({ Error: err.sqlMessage });
        }
        return res.status(200).json({ Status: "Success", Message: "User registered successfully" });
      });
    });
  } catch (error) {
    return res.status(500).json({ Error: error.message });
  }
};

// ==================== LOGIN ====================
const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ Error: "Email and password are required" });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    connection.query(sql, [email], (err, data) => {
      if (err) {
        return res.status(500).json({ Error: "Server error during login" });
      }

      if (data.length === 0) {
        return res.status(404).json({ Error: "User not found" });
      }

      // Compare password
      bcrypt.compare(password, data[0].password, (bcryptErr, isMatch) => {
        if (bcryptErr) {
          return res.status(500).json({ Error: "Error comparing passwords" });
        }

        if (!isMatch) {
          return res.status(401).json({ Error: "Invalid password" });
        }

        // Generate JWT token
        const token = jwt.sign(
          { 
            id: data[0].id,
            username: data[0].username,
            email: data[0].email 
          },
          process.env.JWT_SECRET || "your-secret-key",
          { expiresIn: "7d" }
        );

        // Set JWT token as HTTP-only cookie
     res.cookie("token", token, {
  httpOnly: true,
  secure: true,        // ✅ must be true for HTTPS
  sameSite: "none",    // ✅ required for cross-origin cookies
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/"
});
        return res.status(200).json({
          Status: "Success",
          Message: "Login successful",
          token: token,
          user: {
            id: data[0].id,
            username: data[0].username,
            email: data[0].email
          }
        });
      });
    });
  } catch (error) {
    return res.status(500).json({ Error: error.message });
  }
};

// ==================== VERIFY USER ====================
const verifyUser = async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ Status: "Error", Error: "No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, decoded) => {
      if (err) {
        return res.status(403).json({ Status: "Error", Error: "Token is not valid" });
      }
      
      return res.status(200).json({ 
        Status: "Success", 
        Message: "User verified",
        user: decoded
      });
    });
  } catch (error) {
    return res.status(500).json({ Status: "Error", Error: error.message });
  }
};

// ==================== LOGOUT ====================
const userLogout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/"
    });
    return res.status(200).json({ 
      Status: "Success", 
      Message: "Logout successful" 
    });
  } catch (error) {
    return res.status(500).json({ Error: error.message });
  }
};

module.exports = { signupUser, userLogin, verifyUser, userLogout };
