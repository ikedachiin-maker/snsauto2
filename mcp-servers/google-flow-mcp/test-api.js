// Test script - run with: node test-api.js YOUR_API_KEY
const apiKey = process.argv[2];
if (!apiKey) {
  console.log("Usage: node test-api.js YOUR_GEMINI_API_KEY");
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
console.log("Testing API key...");

const res = await fetch(url);
console.log("Status:", res.status);

if (res.ok) {
  const data = await res.json();
  const models = (data.models || [])
    .filter((m) => m.name.includes("image") || m.name.includes("nano") || m.name.includes("banana"))
    .map((m) => ({ name: m.name, displayName: m.displayName }));
  console.log("\nImage-related models available:");
  for (const m of models) {
    console.log(`  - ${m.name} (${m.displayName})`);
  }
  if (models.length === 0) {
    console.log("  (none found - showing all models)");
    for (const m of data.models.slice(0, 20)) {
      console.log(`  - ${m.name}`);
    }
  }
} else {
  const text = await res.text();
  console.log("Error:", text.substring(0, 300));
}
