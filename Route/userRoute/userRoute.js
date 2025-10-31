const express = require("express");
const userRouter = express.Router();
const {signupUser, userLogin, verifyUser, userLogout} = require("../../Contoller/userController/userController");

userRouter.post("/userregister", signupUser);
userRouter.post("/loginuser", userLogin);
userRouter.post("/logoutuser", userLogout);
userRouter.get("/verifyuser", verifyUser);


module.exports = userRouter;