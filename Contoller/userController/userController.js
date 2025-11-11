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
// const userLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ Error: "Email and password are required" });
//     }

//     const sql = "SELECT * FROM users WHERE email = ?";
//     connection.query(sql, [email], (err, data) => {
//       if (err) {
//         return res.status(500).json({ Error: "Server error during login" });
//       }

//       if (data.length === 0) {
//         return res.status(404).json({ Error: "User not found" });
//       }

//       // Compare password
//       bcrypt.compare(password, data[0].password, (bcryptErr, isMatch) => {
//         if (bcryptErr) {
//           return res.status(500).json({ Error: "Error comparing passwords" });
//         }

//         if (!isMatch) {
//           return res.status(401).json({ Error: "Invalid password" });
//         }

//         // Generate JWT token
//         const token = jwt.sign(
//           { 
//             id: data[0].id,
//             username: data[0].username,
//             email: data[0].email 
//           },
//           process.env.JWT_SECRET || "your-secret-key",
//           { expiresIn: "7d" }
//         );

//         // Set JWT token as HTTP-only cookie
//   res.cookie("token", token, {
//   httpOnly: true,
//   secure: false,
//   sameSite: "none",
//   path: "/",
//   maxAge: 7 * 24 * 60 * 60 * 1000,
// });

//         return res.status(200).json({
//           Status: "Success",
//           Message: "Login successful",
//           token: token,
//           user: {
//             id: data[0].id,
//             username: data[0].username,
//             email: data[0].email
//           }
//         });
//       });
//     });
//   } catch (error) {
//     return res.status(500).json({ Error: error.message });
//   }
// };

const userLogin = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ Error: "Email, password, and role are required" });
    }

    const sql = "SELECT * FROM entities WHERE email = ?";
    connection.query(sql, [email], (err, data) => {
      if (err) {
        console.error("MySQL Error:", err);
        return res.status(500).json({ Error: "Server error during login" });
      }

      if (data.length === 0) {
        return res.status(404).json({ Error: "User not found" });
      }

      const user = data[0];

      //  Step 1: Check password
      if (password !== user.password) {
        return res.status(401).json({ Error: "Invalid password" });
      }

      //  Step 2: Check role match
      if (role.toLowerCase() !== user.role.toLowerCase()) {
        return res.status(403).json({ Error: "Incorrect role selected" });
      }

      

      //  Step 3: Generate JWT token
      const token = jwt.sign(
        {
          id: user.entity_id,
          email: user.email,
          role: user.role,
          entity_name: user.entity_name,
          account_id: user.account_id
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
      );

      //  Step 4: Set cookie
res.cookie("token", token, {
  httpOnly: true,
  secure: true,             // keep true (both are HTTPS)
  sameSite: "none",         //  allow cross-site cookie sending
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
// res.cookie("token", token, {
//   httpOnly: true,
//   secure: false,     // problem mostly yahan hoti hai
//   sameSite: "lax",  //  mostly okay, but cross-domain me dikkat de sakta hai
//   path: "/",
//   maxAge: 7 * 24 * 60 * 60 * 1000,
// });




      //  Step 5: Send success response
      return res.status(200).json({
        Status: "Success",
        Message: "Login successful",
        user: {
          id: user.entity_id,
          entity_name: user.entity_name,
          email: user.email,
          role: user.role,
        },
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ Error: error.message });
  }
};


// ==================== VERIFY USER ====================


const verifyUser = async (req, res) => {
  try {
    //  Get token from cookie or Authorization header
    const token =
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        Status: "Error",
        Error: "No token provided",
      });
    }

    //  Verify the token
    jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, decoded) => {
      if (err) {
        return res.status(403).json({
          Status: "Error",
          Error: "Invalid or expired token",
        });
      }

      console.log("Decoded Token:", decoded); // For debugging

      // Ensure decoded user info includes role
      const userData = {
        id: decoded.id,
        entity_name: decoded.entity_name || decoded.username,
        email: decoded.email,
        role: decoded.role || "user", // fallback to 'user' if not in token
      };

      return res.status(200).json({
        Status: "Success",
        Message: "User verified",
        user: userData,
      });
    });
  } catch (error) {
    console.error("verifyUser Error:", error);
    return res.status(500).json({
      Status: "Error",
      Error: error.message,
    });
  }
};



// const getAllUsers = async (req, res) => {
//   try {
//     // Check if logged-in user is superadmin
//     if (req.user.role !== "superadmin") {
//       return res.status(403).json({ Error: "Access denied. Only Super Admin can view users." });
//     }

//     const sql = "SELECT entity_id, entity_name, email, role FROM entities";
//     connection.query(sql, (err, data) => {
//       if (err) {
//         console.error("MySQL Error:", err);
//         return res.status(500).json({ Error: "Server error while fetching users." });
//       }

//       return res.status(200).json({
//         Status: "Success",
//         Total: data.length,
//         Users: data,
//       });
//     });
//   } catch (error) {
//     return res.status(500).json({ Error: error.message });
//   }
// };

const getAllUsers = async (req, res) => {
  try {
    let sql;
    let values = [];

    // Superadmin → all users
    if (req.user.role === "superadmin") {
      sql = "SELECT entity_id, account_id, entity_name, email, role FROM entities";
    } 
    //  Admin → only users with same account_id
    else if (req.user.role === "admin") {
      sql = "SELECT entity_id, account_id, entity_name, email, role FROM entities WHERE account_id = ?";
      values = [req.user.account_id];
    } 
    // Others → not allowed
    else {
      return res.status(403).json({
        Error: "Access denied. Only Admin or Super Admin can view users.",
      });
    }

    // Execute SQL query
    connection.query(sql, values, (err, data) => {
      if (err) {
        console.error("MySQL Error:", err);
        return res.status(500).json({ Error: "Server error while fetching users." });
      }

      return res.status(200).json({
        Status: "Success",
        Total: data.length,
        Users: data,
      });
    });
  } catch (error) {
    console.error("Catch Error:", error);
    return res.status(500).json({ Error: error.message });
  }
};


// ==================== LOGOUT ====================
const userLogout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,       // must be true for HTTPS (Render, Vercel)
      sameSite: "none",   
      path: "/",          
    });

    return res.status(200).json({
      Status: "Success",
      Message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({ Error: error.message });
  }
};


module.exports = { signupUser, userLogin, verifyUser, userLogout, getAllUsers };
