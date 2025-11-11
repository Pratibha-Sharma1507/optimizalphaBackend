const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const connection = require("../../Model/dbConnect");
const jwt = require("jsonwebtoken");

const router = express.Router();

// ==============================
// 🔹 GOOGLE STRATEGY CONFIG
// ==============================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;
      const username = profile.displayName;

      // Check if user already exists
      connection.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (err, result) => {
          if (err) {
            console.error("Database query error:", err);
            return done(err);
          }

          // Existing user found
          if (result && result.length > 0) {
            console.log("Existing Google user found:", result[0]);
            return done(null, result[0]);
          }

          // Insert new Google user
          connection.query(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, null],
            (err, insertResult) => {
              if (err) {
                console.error("Insert error:", err);
                return done(err);
              }

              console.log("New user inserted with userid:", insertResult.insertId);

              // Fetch newly inserted user
              connection.query(
                "SELECT * FROM users WHERE userid = ?",
                [insertResult.insertId],
                (err, newUser) => {
                  if (err) {
                    console.error("Select after insert error:", err);
                    return done(err);
                  }

                  if (!newUser || !newUser[0]) {
                    console.error("User not found after insert");
                    return done(new Error("User not found after insert"));
                  }

                  console.log("New Google user created:", newUser[0]);
                  return done(null, newUser[0]);
                }
              );
            }
          );
        }
      );
    }
  )
);

// ==============================
// 🔹 SERIALIZE / DESERIALIZE
// ==============================
passport.serializeUser((user, done) => {
  console.log("Serializing user:", user);
  if (!user) {
    console.error("Cannot serialize: user is null or undefined");
    return done(new Error("Cannot serialize user: user is null"));
  }

  const userId = user.userid; // ✅ Always use `userid`
  if (!userId) {
    console.error("Cannot serialize: user has no userid field", Object.keys(user));
    return done(new Error("Cannot serialize user: no userid field found"));
  }

  console.log("Serializing user with userid:", userId);
  done(null, userId);
});

passport.deserializeUser((userid, done) => {
  console.log("Deserializing user with userid:", userid);
  connection.query("SELECT * FROM users WHERE userid = ?", [userid], (err, result) => {
    if (err) {
      console.error("Deserialize error:", err);
      return done(err);
    }
    if (!result || !result[0]) {
      console.error("User not found during deserialization");
      return done(new Error("User not found during deserialization"));
    }
    done(null, result[0]);
  });
});

// ==============================
// 🔹 ROUTES
// ==============================

// Google login entry point
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google callback route
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:5173/login" }),
  (req, res) => {
    try {
      // Generate JWT for authenticated user
      const token = jwt.sign(
        {
          id: req.user.userid,
          username: req.user.username,
          email: req.user.email,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
      );

      // Set JWT as HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: false, // set true if using HTTPS
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      // Redirect to frontend with token
      res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
    } catch (error) {
      console.error("Error generating JWT for Google user:", error);
      res.redirect("http://localhost:5173/login?error=authentication_failed");
    }
  }
);

module.exports = router;
