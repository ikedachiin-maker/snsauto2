// ── Meta Pixel Code Generator & Deduplication Helper ────────────────

import { STANDARD_EVENTS } from "./config.js";

// ── Generate Pixel Base Code ────────────────────────────────────────

export function generatePixelBaseCode(pixelId) {
  return `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`;
}

// ── Generate Event Tracking Code (with dedup event_id) ──────────────

export function generateEventCode(eventName, params = {}, eventId) {
  const isStandard = !!STANDARD_EVENTS[eventName];
  const method = isStandard ? "track" : "trackCustom";

  const paramsStr = Object.keys(params).length > 0
    ? JSON.stringify(params, null, 2)
    : "{}";

  // event_id for Pixel ↔ CAPI deduplication
  const eventIdOption = eventId
    ? `, {eventID: '${eventId}'}`
    : "";

  return `// ${STANDARD_EVENTS[eventName]?.label || eventName} event
fbq('${method}', '${eventName}', ${paramsStr}${eventIdOption});`;
}

// ── Generate Full Tracking Snippet (Pixel + CAPI dedup) ─────────────

export function generateDedupSnippet(eventName, params = {}) {
  const eventIdVar = "eventId_" + eventName.replace(/[^a-zA-Z]/g, "");

  return `// === ${eventName} with Pixel + CAPI Deduplication ===
// 1. Generate shared event_id
var ${eventIdVar} = 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);

// 2. Send via Pixel (browser-side)
fbq('track', '${eventName}', ${JSON.stringify(params)}, {eventID: ${eventIdVar}});

// 3. Send via CAPI (server-side) - POST to your backend
fetch('/api/capi-event', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    event_name: '${eventName}',
    event_id: ${eventIdVar},
    event_source_url: window.location.href,
    custom_data: ${JSON.stringify(params)},
    user_data: {
      client_ip_address: '', // Set server-side
      client_user_agent: navigator.userAgent,
      fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1] || '',
      fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1] || '',
    }
  })
});
// === Meta will deduplicate events with the same event_id ===`;
}

// ── Generate Server-Side CAPI Handler (Node.js example) ─────────────

export function generateCapiHandler(pixelId) {
  return `// === Server-Side CAPI Handler (Node.js/Express) ===
// Add this to your server to receive events from the browser snippet above

const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

const PIXEL_ID = '${pixelId || "<META_PIXEL_ID>"}';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const CAPI_URL = 'https://graph.facebook.com/v25.0/' + PIXEL_ID + '/events';

// SHA-256 hash helper
function sha256(value) {
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

app.post('/api/capi-event', async (req, res) => {
  const { event_name, event_id, event_source_url, custom_data, user_data } = req.body;

  // Build CAPI event payload
  const event = {
    event_name,
    event_time: Math.floor(Date.now() / 1000),
    event_id, // Same as Pixel event_id for deduplication
    event_source_url,
    action_source: 'website',
    user_data: {
      client_ip_address: req.ip,
      client_user_agent: user_data?.client_user_agent || req.headers['user-agent'],
      fbc: user_data?.fbc || undefined,
      fbp: user_data?.fbp || undefined,
      // Hash PII if available
      // em: sha256(user_email),
      // ph: sha256(user_phone),
    },
    custom_data,
  };

  try {
    const response = await fetch(CAPI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        data: JSON.stringify([event]),
        access_token: ACCESS_TOKEN,
      }),
    });
    const result = await response.json();
    res.json({ success: true, events_received: result.events_received });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('CAPI handler running on :3000'));`;
}

// ── Generate GTM Custom HTML Tag ────────────────────────────────────

export function generateGtmTag(pixelId) {
  return `<!-- GTM Custom HTML Tag: Meta CAPI Bridge -->
<!-- Trigger: All Pages / Specific Events -->
<script>
(function() {
  // Read Meta cookies
  var fbc = (document.cookie.match(/_fbc=([^;]+)/) || [])[1] || '';
  var fbp = (document.cookie.match(/_fbp=([^;]+)/) || [])[1] || '';

  // Push to dataLayer for server-side GTM
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'meta_capi_bridge',
    'meta_pixel_id': '${pixelId || "<META_PIXEL_ID>"}',
    'meta_fbc': fbc,
    'meta_fbp': fbp,
    'meta_event_id': 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2,10),
    'page_url': window.location.href,
    'user_agent': navigator.userAgent
  });
})();
</script>`;
}
