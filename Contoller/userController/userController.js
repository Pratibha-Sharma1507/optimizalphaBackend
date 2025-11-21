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


const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ Error: "Email and password are required" });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    connection.query(sql, [email], (err, data) => {
      if (err) {
        console.error("MySQL Error:", err);
        return res.status(500).json({ Error: "Server error during login" });
      }

      if (data.length === 0) {
        return res.status(404).json({ Error: "User not found" });
      }

      const user = data[0];

      // Check password
      if (password !== user.password) {
        return res.status(401).json({ Error: "Invalid password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          user_id: user.user_id,
          email: user.email,
          username: user.username,
          client_id: user.client_id,   // MOST IMPORTANT
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
      );
      console.log(token);

      // Set cookie
     res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});


// res.cookie("token", token, {
//   httpOnly: true,
//   secure: false, // localhost me false
//   sameSite: "lax", // localhost me lax best
//   path: "/",
//   maxAge: 7 * 24 * 60 * 60 * 1000,
// });


      return res.status(200).json({
        Status: "Success",
        Message: "Login successful",
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          client_id: user.client_id,
        },
      });
    });
  } catch (error) {
    return res.status(500).json({ Error: error.message });
  }
};


const verifyUser = async (req, res) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        Status: "Error",
        Error: "No token provided",
      });
    }

    jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, decoded) => {
      if (err) {
        return res.status(403).json({
          Status: "Error",
          Error: "Invalid or expired token",
        });
      }

      return res.status(200).json({
        Status: "Success",
        Message: "User verified",
        user: {
          user_id: decoded.user_id,
          email: decoded.email,
          username: decoded.username,
          client_id: decoded.client_id,  // THIS IS THE FILTER FOR ALL DATA
        },
      });
    });
  } catch (error) {
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
  secure: true, 
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
