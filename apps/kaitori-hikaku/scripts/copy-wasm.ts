import fs from "fs";
import path from "path";

const src = path.join(
  process.cwd(),
  "node_modules",
  "sql.js",
  "dist",
  "sql-wasm.wasm"
);
const destDir = path.join(process.cwd(), "public");
const dest = path.join(destDir, "sql-wasm.wasm");

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(src, dest);
console.log("Copied sql-wasm.wasm to public/");
