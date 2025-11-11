const express = require("express");
const rolesRouter = express.Router();
const {
  getUsers,
  getRoles,
  assignRole,
} = require("../../Contoller/rolesController/rolesController");

// Routes
rolesRouter.get("/getUsers", getUsers);
rolesRouter.get("/getRoles", getRoles);
rolesRouter.post("/assignRole", assignRole);

module.exports = rolesRouter;
