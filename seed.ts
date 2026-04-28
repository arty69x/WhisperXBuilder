import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const users = [
  {
    id: "admin-user",
    email: "arty69xx@gmail.com",
    username: "arty69xx",
    password: "@RtyX27021992",
    createdAt: Date.now()
  }
];

async function seed() {
  for (let u of users) {
    u.password = await bcrypt.hash(u.password, 10);
  }
  
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  
  fs.writeFileSync(path.join(dataDir, "users.json"), JSON.stringify(users, null, 2));
  console.log("Environment seeded successfully.");
}

seed();
