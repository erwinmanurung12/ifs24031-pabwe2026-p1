import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./bootstrap.js";

const staticDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../frontend/dist");
const app = buildApp(process.env, { staticDir });
const port = Number(process.env.PORT) || 8000;
app.listen(port, () => console.log(`DelLiga API berjalan di http://localhost:${port}`));
