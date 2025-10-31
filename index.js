const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();
const uploadRoute = require("./Route/uploadRoute/uploadRoute");


const app = express();

app.use(
  cors({
    origin: ["https://optimizalpha-frontend.vercel.app"], //  exact frontend URL
    credentials: true, // allows cookies to pass
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

// ===================== Normal DB login/signup routes =====================
const userRouter = require("./Route/userRoute/userRoute"); // 
app.use('/api', userRouter); 

app.use("/upload", uploadRoute);

const rolesRouter = require("./Route/rolesRoutes/rolesRoutes");
app.use('/', rolesRouter)

const userPortfolioRouter = require("./Route/userPortfolioRoute/userPortfolioRoute");
app.use("/", userPortfolioRouter);

// ===================== SESSION + PASSPORT (only for Google auth) =====================
app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// ===================== Google authentication routes =====================
const googleAuthRoutes = require("./Route/userRoute/googleAuth"); 
app.use("/", googleAuthRoutes); 

// ===================== SERVER =====================
const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
