import fs from "fs";
let b = fs.readFileSync("src/pages/production/ProductInventory.tsx", "utf8");

b = b.replace(/API_BASE_URL/g, "BASE_IMAGE_URL");

b = b.replace(/categories\.map\(\(category\) => \([\s\S]*?<option key=\{category\.name\} value=\{category\.name\}>[\s\S]*?\{category\.name\}[\s\S]*?<\/option>[\s\S]*?\)\)/g, "categories.map((category) => (<option key={category.key} value={category.key}>{category.label}</option>))");

fs.writeFileSync("src/pages/production/ProductInventory.tsx", b);
console.log("Fixed!");
