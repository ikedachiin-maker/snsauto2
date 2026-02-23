// Analyze kadenkaitori.tokyo structure
async function main() {
  const res = await fetch("https://kadenkaitori.tokyo/", {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  const html = await res.text();

  // Find all internal links
  const re = /href="([^"]*)"/g;
  let m;
  const links = new Set<string>();
  while ((m = re.exec(html)) !== null) {
    if (m[1].includes("kadenkaitori") || m[1].startsWith("/")) {
      links.add(m[1]);
    }
  }

  console.log("=== LINKS ===");
  [...links].sort().forEach((l) => console.log(l));

  // Find all-goods link
  const allGoodsIdx = html.indexOf("all-goods");
  if (allGoodsIdx > -1) {
    console.log("\n=== AROUND all-goods ===");
    console.log(html.substring(Math.max(0, allGoodsIdx - 100), allGoodsIdx + 200));
  }

  // Check for product listing structure
  const proListIdx = html.indexOf("pro_list");
  if (proListIdx > -1) {
    console.log("\n=== HAS pro_list CLASS ===");
  }

  // Check for purchase links
  const purchaseIdx = html.indexOf("/purchase/");
  if (purchaseIdx > -1) {
    console.log("\n=== FIRST purchase/ LINK ===");
    console.log(html.substring(Math.max(0, purchaseIdx - 200), purchaseIdx + 300));
  }

  console.log("\n=== HTML LENGTH ===", html.length);
}

main().catch(console.error);
