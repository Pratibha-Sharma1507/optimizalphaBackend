const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();

//  create app first
const app = express();


//  app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(
  cors({
    origin: ["https://optimizalpha-frontend-2css.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Cookie",
      "Set-Cookie",
    ],
  })
);
// app.use(
//   cors({
//     origin: ["http://localhost:5173"], //  Vite frontend
//     credentials: true,
//   })
// );

// ===================== Normal DB login/signup routes =====================
const userRouter = require("./Route/userRoute/userRoute");
app.use('/api', userRouter);

const router = require("./Route/portfolioFactRoute/portfolioFactRoute");
app.use('/api', router);

const uploadRoute = require("./Route/uploadRoute/uploadRoute");
app.use("/upload", uploadRoute);

const rolesRouter = require("./Route/rolesRoutes/rolesRoutes");
app.use('/', rolesRouter);

const assetRouter = require("./Route/assetClassRoute/assetClassRoute");
app.use('/api', assetRouter);

const accountRouter = require("./Route/accountRoute/accountRoute");
app.use('/api', accountRouter);

const userPortfolioRouter = require("./Route/userPortfolioRoute/userPortfolioRoute");
app.use("/", userPortfolioRouter);

const panRouter = require("./Route/panRoute/panRoute");
app.use("/", panRouter)

const filterRouter = require("./Route/filterRouter/filterRouter");
app.use('/', filterRouter);

const deltaRouter = require("./Route/deltaRoute/deltaRoute");
app.use('/', deltaRouter);

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
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
