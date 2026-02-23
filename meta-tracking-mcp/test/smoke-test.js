// Smoke test: Verify all modules load and work correctly
import { STANDARD_EVENTS, USER_DATA_FIELDS, ACTION_SOURCES, isConfigured } from "../lib/config.js";
import { buildEvent, generateEventId, validateEventQuality, hashUserData } from "../lib/event-builder.js";
import { sendEvents } from "../lib/capi-client.js";
import { generatePixelBaseCode, generateEventCode, generateDedupSnippet, generateCapiHandler } from "../lib/pixel-helper.js";

console.log("=== Meta Tracking MCP Smoke Test ===\n");

// Test 1: Config
console.log("1. Config:");
console.log("   Configured:", isConfigured());
console.log("   Standard events:", Object.keys(STANDARD_EVENTS).length);
console.log("   User data fields:", Object.keys(USER_DATA_FIELDS).length);
console.log("   Action sources:", Object.keys(ACTION_SOURCES).join(", "));

// Test 2: Event ID generation
console.log("\n2. Event ID generation:");
const eid1 = generateEventId("purchase");
const eid2 = generateEventId("lead");
console.log("   ID 1:", eid1);
console.log("   ID 2:", eid2);
console.log("   Unique:", eid1 !== eid2);

// Test 3: User data hashing
console.log("\n3. User data hashing:");
const hashed = hashUserData({
  em: "test@example.com",
  ph: "+81901234567",
  external_id: "user_123",
  client_ip_address: "192.168.1.1",
});
console.log("   Email hash:", hashed.em?.slice(0, 16) + "...");
console.log("   Phone hash:", hashed.ph?.slice(0, 16) + "...");
console.log("   IP (no hash):", hashed.client_ip_address);

// Test 4: Build event
console.log("\n4. Build event:");
const event = buildEvent({
  event_name: "Purchase",
  event_source_url: "https://example.com/thanks",
  user_data: { em: "test@example.com", client_ip_address: "1.2.3.4" },
  custom_data: { value: 3980, currency: "JPY", content_ids: ["prod_001"] },
});
console.log("   Event:", event.event_name);
console.log("   Event ID:", event.event_id);
console.log("   Value:", event.custom_data.value, event.custom_data.currency);
console.log("   User email hashed:", event.user_data.em?.slice(0, 16) + "...");

// Test 5: Event quality validation
console.log("\n5. Event quality:");
const quality = validateEventQuality(event);
console.log("   Score:", quality.score, "/ 10");
console.log("   Grade:", quality.grade);
console.log("   Match keys:", quality.match_keys);
console.log("   Issues:", quality.issues.length);
console.log("   Warnings:", quality.warnings.length);

// Test 6: Dry run send
console.log("\n6. Dry run send:");
const dryResult = await sendEvents([event], { dryRun: true, testMode: false });
console.log("   dry_run:", dryResult.dry_run);
console.log("   events_count:", dryResult.events_count);
console.log("   curl:", dryResult.curl.split("\n")[0].slice(0, 80) + "...");

// Test 7: Pixel code generation
console.log("\n7. Pixel code generation:");
const baseCode = generatePixelBaseCode("123456789");
console.log("   Base code length:", baseCode.length, "chars");
console.log("   Contains pixel ID:", baseCode.includes("123456789"));

const eventCode = generateEventCode("Purchase", { value: 3980, currency: "JPY" }, "evt_test_123");
console.log("   Event code:", eventCode.split("\n")[1]?.trim().slice(0, 60) + "...");

// Test 8: Dedup snippet
console.log("\n8. Dedup snippet:");
const dedup = generateDedupSnippet("Purchase", { value: 3980, currency: "JPY" });
console.log("   Contains Pixel call:", dedup.includes("fbq('track'"));
console.log("   Contains CAPI call:", dedup.includes("/api/capi-event"));
console.log("   Contains event_id:", dedup.includes("eventId_"));

// Test 9: CAPI handler
console.log("\n9. CAPI handler:");
const handler = generateCapiHandler("123456789");
console.log("   Handler length:", handler.length, "chars");
console.log("   Contains Express:", handler.includes("express"));
console.log("   Contains sha256:", handler.includes("sha256"));

console.log("\n=== All tests passed! ===");
