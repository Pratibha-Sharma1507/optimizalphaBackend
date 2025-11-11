const express = require("express");
const userRouter = express.Router();
const {signupUser, userLogin, verifyUser, userLogout, getAllUsers} = require("../../Contoller/userController/userController");
const{verifyToken} = require('../../Middleware/authMiddleware')

userRouter.post("/userregister", signupUser);
userRouter.post("/loginuser", userLogin);
userRouter.post("/logoutuser", userLogout);
userRouter.get("/verifyuser", verifyUser);
userRouter.get("/allusers", verifyToken, getAllUsers);


module.exports = userRouter;