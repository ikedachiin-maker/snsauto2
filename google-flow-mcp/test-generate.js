import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const apiKey = readFileSync("apikey.txt", "utf-8").trim();
const outputDir = join(import.meta.dirname, "output");
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const model = "gemini-3-pro-image-preview";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

console.log(`Generating image with ${model}...`);

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  },
  body: JSON.stringify({
    contents: [{ parts: [{ text: "A cute cat sitting on a windowsill at sunset, photorealistic" }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
    },
  }),
});

console.log("Status:", res.status);

if (!res.ok) {
  const errText = await res.text();
  console.log("Error:", errText.substring(0, 500));
  process.exit(1);
}

const data = await res.json();
const parts = data?.candidates?.[0]?.content?.parts || [];

for (let i = 0; i < parts.length; i++) {
  const part = parts[i];
  if (part.inlineData) {
    const ext = part.inlineData.mimeType === "image/png" ? "png" : "jpg";
    const filePath = join(outputDir, `test_image_${i}.${ext}`);
    writeFileSync(filePath, Buffer.from(part.inlineData.data, "base64"));
    console.log("Image saved:", filePath);
  } else if (part.text) {
    console.log("Description:", part.text.substring(0, 200));
  }
}
console.log("Done!");
