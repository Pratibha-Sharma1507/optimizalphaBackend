const connection = require("../../Model/dbConnect");


const getUsers = (req, res) => {
  const q = `
    SELECT 
      entity_id AS _id, 
      entity_name AS name, 
      email, 
      role 
    FROM entities
  `;

  connection.query(q, (err, data) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "Database error while fetching users" });
    }
    res.json(data);
  });
};


const getRoles = (req, res) => {
  const roles = [
    { _id: "1", roleName: "admin" },
    { _id: "2", roleName: "superadmin" },
    { _id: "3", roleName: "user" },
  ];
  res.json(roles);
};


const assignRole = (req, res) => {
  const { userId, roleId } = req.body;

  if (!userId || !roleId) {
    return res.status(400).json({ error: "Missing userId or roleId" });
  }

  // 🧭 Map roleId → roleName
  let roleName;
  switch (roleId) {
    case "1":
      roleName = "admin";
      break;
    case "2":
      roleName = "superadmin";
      break;
    default:
      roleName = "user";
  }

  const q = "UPDATE entities SET role = ? WHERE entity_id = ?";
  connection.query(q, [roleName, userId], (err, result) => {
    if (err) {
      console.error("Error assigning role:", err);
      return res.status(500).json({ error: "Database error while assigning role" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "✅ Role assigned successfully" });
  });
};

module.exports = { getUsers, getRoles, assignRole };
