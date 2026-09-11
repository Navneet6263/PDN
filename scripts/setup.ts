import { existsSync, writeFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
if (existsSync(".env")) {
  console.log(".env already exists. Edit it to change your configuration.");
  process.exit(0);
}
const password = randomBytes(15).toString("base64url");
const salt = randomBytes(16).toString("hex");
const hash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
writeFileSync(
  ".env",
  `API_PORT=4000\nAPI_URL=http://127.0.0.1:4000\nSITE_URL=http://localhost:3000\nDATABASE_URL=postgresql://postgres:postgres@localhost:5432/terra_store\nIMAGE_STORAGE=cloudinary\nCLOUDINARY_CLOUD_NAME=\nCLOUDINARY_API_KEY=\nCLOUDINARY_API_SECRET=\nADMIN_EMAIL=admin@terra.local\nADMIN_PASSWORD_HASH=${hash}\nCOOKIE_SECURE=false\n`,
  { mode: 0o600 },
);
console.log(
  `Admin email: admin@terra.local\nAdmin password: ${password}\nSave this password. It is displayed only now.`,
);
