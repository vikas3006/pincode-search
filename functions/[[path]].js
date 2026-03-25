/**
 * Cloudflare Pages Function — Dynamic Pincode Pages
 * Handles ALL routes: /state/ /state/district/ /state/district/po/pin/
 * Fetches live data from India Post API on every request
 * Cached at Cloudflare edge for 24 hours automatically
 */

const POSTAL_API = 'https://api.postalpincode.in';

// ── slug helpers ──────────────────────────────────────────────
function toSlug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function fromSlug(s) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── fetch — simple and reliable, CF edge handles caching via Cache-Control ──
async function fetchByPin(pin) {
  try {
    const res = await fetch(`${POSTAL_API}/pincode/${pin}`, {
      headers: { 'Accept': 'application/json' },
      cf: { cacheTtl: 86400, cacheEverything: true }
    });
    const data = await res.json();
    if (data?.[0]?.Status === 'Success') return data[0].PostOffice || [];
  } catch (e) {}
  return [];
}

async function fetchByPO(name) {
  try {
    const res = await fetch(`${POSTAL_API}/postoffice/${encodeURIComponent(name)}`, {
      headers: { 'Accept': 'application/json' },
      cf: { cacheTtl: 86400, cacheEverything: true }
    });
    const data = await res.json();
    if (data?.[0]?.Status === 'Success') return data[0].PostOffice || [];
  } catch (e) {}
  return [];
}

// ── shared CSS ─────────────────────────────────────────────────
function getCSS() {
  return `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,sans-serif;background:#f0f2f5;line-height:1.6;font-size:14px}
nav{background:#1a252f;padding:10px 18px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
nav a{color:#fff;text-decoration:none;font-weight:700;font-size:15px}
.nl{display:flex;gap:18px;font-size:12px}.nl a{color:rgba(255,255,255,.8);text-decoration:none}
.w{max-width:820px;margin:0 auto;padding:14px}
.bc{display:flex;align-items:center;flex-wrap:wrap;gap:4px;background:#fff;border-radius:8px;padding:9px 14px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,.07);font-size:11px}
.bc a{color:#3498db;text-decoration:none;padding:2px 6px;border-radius:3px;font-weight:500}.bc a:hover{background:#e8f4fb}
.bcs{color:#ccc;font-size:10px}.bcc{color:#2c3e50;font-weight:700;padding:2px 6px;background:#f0f7ff;border-radius:3px;border:1px solid #b3d9f7}
.bk{display:inline-flex;align-items:center;gap:5px;background:#fff;border:1.5px solid #3498db;color:#3498db;padding:6px 14px;border-radius:7px;text-decoration:none;font-size:12px;font-weight:600;margin-bottom:10px}
.bk:hover{background:#3498db;color:#fff}
.ad{background:#fffde7;border:1px dashed #f9a825;border-radius:8px;padding:9px;text-align:center;font-size:11px;color:#f57f17;margin-bottom:12px}
.hero{background:linear-gradient(135deg,#1a252f 0%,#2471a3 100%);color:#fff;border-radius:11px;padding:18px;margin-bottom:10px;position:relative;overflow:hidden}
.hbg{position:absolute;right:-10px;top:-10px;font-size:80px;opacity:.05;font-weight:900;letter-spacing:-5px;pointer-events:none}
.ht{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:7px}
.pn{font-size:30px;font-weight:700;letter-spacing:3px}
.hbadges{display:flex;flex-direction:column;gap:3px;align-items:flex-end}
.vb{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35);color:#fff;padding:2px 8px;border-radius:8px;font-size:10px}
.upd{background:#27ae60;color:#fff;padding:2px 8px;border-radius:8px;font-size:10px}
h1.h1t{font-size:17px;font-weight:700;color:#fff;margin-bottom:2px}
.pol{font-size:11px;opacity:.78;margin-bottom:8px}
.htags{display:flex;flex-wrap:wrap;gap:4px}
.htag{background:rgba(255,255,255,.13);color:rgba(255,255,255,.9);padding:2px 8px;border-radius:8px;font-size:10px;border:1px solid rgba(255,255,255,.2)}
.cbox{background:#fff;border:2px solid #3498db;border-radius:9px;padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.cpin{font-size:24px;font-weight:700;color:#2c3e50;letter-spacing:2px}
.cinfo{flex:1}.clb{font-size:9px;color:#7f8c8d;text-transform:uppercase;letter-spacing:.5px;margin-bottom:1px}
.cv{font-size:12px;font-weight:600;color:#2c3e50;margin-bottom:3px}
.cbtn{background:#3498db;color:#fff;border:none;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer}
.cbtn:hover{background:#2980b9}
.dg{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px}
.db{background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:10px 12px}
.dl{font-size:9px;color:#7f8c8d;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.dv{font-size:13px;font-weight:700;color:#2c3e50}
.sec{background:#fff;border:1px solid #e0e0e0;border-radius:10px;padding:14px;margin-bottom:10px}
.sec h2{font-size:14px;color:#2c3e50;margin-bottom:10px;font-weight:700;border-bottom:2px solid #3498db;padding-bottom:5px}
.sec p{margin-bottom:7px;font-size:13px;color:#444;line-height:1.8}
.hi{background:#fffbf5;border:1px solid #ffc947;border-radius:10px;padding:14px;margin-bottom:10px}
.hi h2{font-size:14px;color:#d84315;margin-bottom:10px;font-weight:700;border-bottom:2px solid #ff9800;padding-bottom:5px}
.hi p{margin-bottom:7px;font-size:13px;color:#555;line-height:1.9}
.hikw{background:#fff3e0;border:1px solid #ffcc80;border-radius:6px;padding:7px 10px;margin-top:8px;font-size:11px;color:#bf360c;line-height:1.8}
.how{background:#f0f7ff;border:1px solid #bbdefb;border-radius:10px;padding:14px;margin-bottom:10px}
.how h2{font-size:14px;color:#1565c0;margin-bottom:10px;font-weight:700;border-bottom:2px solid #1976d2;padding-bottom:5px}
.howg{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.howi{background:#fff;border:1px solid #bbdefb;border-radius:7px;padding:9px 11px}
.howic{font-size:15px;margin-bottom:3px}.howt{font-size:11px;font-weight:700;color:#1565c0;margin-bottom:2px}
.howd{font-size:11px;color:#555;line-height:1.5}
.faq{background:#fff;border:1px solid #e0e0e0;border-radius:10px;padding:14px;margin-bottom:10px}
.faq h2{font-size:14px;color:#2c3e50;margin-bottom:10px;font-weight:700;border-bottom:2px solid #8e44ad;padding-bottom:5px}
.fq{border:1px solid #e9ecef;border-radius:7px;margin-bottom:6px;overflow:hidden}
.fqq{padding:9px 12px;font-size:12px;font-weight:600;color:#2c3e50;background:#f8f9fa;display:flex;align-items:center;justify-content:space-between}
.fqa{padding:8px 12px;font-size:12px;color:#555;line-height:1.7;border-top:1px solid #e9ecef}
.sok{background:#e8f5e9;border:1px solid #a5d6a7;border-radius:5px;padding:6px 10px;font-size:11px;color:#2e7d32;margin-top:8px}
.st{font-size:14px;font-weight:700;color:#2c3e50;margin-bottom:9px;padding-bottom:6px;border-bottom:1px solid #eee}
.sr{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:#f8f9fa;border-radius:8px;margin-bottom:5px;text-decoration:none;font-size:13px;border:1px solid #e9ecef}
.sr:hover{background:#e8f4fb;border-color:#3498db}
.sn{font-weight:600;color:#2c3e50}.sy{font-size:10px;color:#999;margin-top:1px}.sp{color:#3498db;font-size:11px;font-family:monospace;font-weight:700}
.ch{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}
.cp{background:#ffcccc;color:#2c3e50;padding:7px 11px;border-radius:13px;font-size:12px;text-decoration:none;border:1.5px solid #e57373;display:inline-block}
.cp:hover{background:#ff9999;color:#fff}
.rel{background:#f8f9fa;border:1px solid #e0e0e0;border-radius:10px;padding:14px;margin-bottom:10px}
.rel h2{font-size:14px;color:#2c3e50;margin-bottom:10px;font-weight:700;border-bottom:2px solid #27ae60;padding-bottom:5px}
.relg{display:flex;flex-wrap:wrap;gap:6px}
.relc{background:#fff;border:1px solid #ddd;border-radius:16px;padding:5px 12px;font-size:12px;color:#3498db;text-decoration:none;display:inline-block}
.relc:hover{background:#e8f4fb;border-color:#3498db}
.lr{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f8f9fa;border-radius:8px;margin-bottom:6px;text-decoration:none;border:1px solid #e9ecef;transition:all .2s}
.lr:hover{background:#fffaf4;border-color:#ffb74d;transform:translateY(-1px)}
.lrn{font-weight:700;color:#2c3e50;font-size:13px}.lrs{font-size:11px;color:#999;margin-top:1px}
.lrb{background:#f0f7ff;color:#2980b9;font-size:11px;font-weight:700;padding:3px 9px;border-radius:9px;border:1px solid #b3d9f7;white-space:nowrap}
.lr:hover .lrb{background:#ff9800;color:#fff;border-color:#ff9800}
.uh{font-size:10px;color:#3498db;font-family:monospace;margin-top:2px}
.cd{background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.08);padding:22px;margin-bottom:14px}
.pt{font-size:21px;color:#2c3e50;font-weight:700;margin-bottom:4px}
.ps{font-size:13px;color:#7f8c8d;margin-bottom:14px}
.cn{display:inline-block;background:#e8f4fb;color:#0288d1;font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px;margin-left:8px}
.sb{text-align:center;padding:14px 0 6px}
.sb a{background:#2c3e50;color:#fff;padding:10px 22px;border-radius:7px;text-decoration:none;font-size:13px;font-weight:600}
.sb a:hover{background:#1a252f}
.err{background:#fff;border-radius:10px;padding:40px;text-align:center;margin:20px 0}
.err h2{color:#e74c3c;margin-bottom:10px}
.err p{color:#7f8c8d;font-size:13px}
@media(max-width:600px){.w{padding:10px}.dg{grid-template-columns:1fr}.howg{grid-template-columns:1fr}.cbox{flex-direction:column}}
`;
}

// ── shared nav ──────────────────────────────────────────────
function nav(siteUrl, siteName) {
  return `<nav>
    <a href="${siteUrl}/">&#128238; ${esc(siteName)}</a>
    <div class="nl">
      <a href="${siteUrl}/">Home</a>
      <a href="${siteUrl}/states/">States</a>
      <a href="${siteUrl}/about/">About</a>
    </div>
  </nav>`;
}

function adBox() {
  return `<div class="ad">&#128226; Advertisement</div>`;
}

function htmlShell(title, desc, canonical, schemaJson, siteUrl, siteName, bodyHtml, adsenseId) {
  const yr = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="hi-IN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<meta name="description" content="${esc(desc)}"/>
<link rel="canonical" href="${canonical}"/>
${schemaJson ? `<script type="application/ld+json">${schemaJson}</script>` : ''}
${adsenseId ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}" crossorigin="anonymous"></script>` : ''}
<style>${getCSS()}</style>
</head>
<body>
${nav(siteUrl, siteName)}
<div class="w">
${bodyHtml}
</div>
</body>
</html>`;
}

// ── PINCODE PAGE ───────────────────────────────────────────────
function buildPinPage(o, all, siteUrl, siteName, adsenseId) {
  const ss = toSlug(o.State), ds = toSlug(o.District);
  const ps = toSlug(o.Name), pin = o.Pincode;
  const yr = new Date().getFullYear();
  const blk = o.Block && o.Block !== 'NA' ? esc(o.Block) + ', ' : '';

  const sameH = all.filter(x => x.Name !== o.Name).map(x =>
    `<a class="sr" href="/${toSlug(x.State)}/${toSlug(x.District)}/${toSlug(x.Name)}/${x.Pincode}/">
      <div><div class="sn">${esc(x.Name)}</div><div class="sy">${esc(x.BranchType || 'Post Office')}</div></div>
      <div class="sp">${x.Pincode}</div>
    </a>`
  ).join('') || '<p style="font-size:12px;color:#999;padding:4px 0">No other post offices share this pincode</p>';

  const nbH = all.filter(x => x.Pincode !== o.Pincode).slice(0, 8).map(n =>
    `<a class="cp" href="/${toSlug(n.State)}/${toSlug(n.District)}/${toSlug(n.Name)}/${n.Pincode}/">
      <strong>${esc(n.Name)}</strong><br><small>${esc(n.District)} &mdash; ${n.Pincode}</small>
    </a>`
  ).join('');

  // Hindi unicode (all \uXXXX so CF Worker doesn't mangle)
  const hiP1 = `<strong>${esc(o.Name)}</strong> ${esc(o.State)} \u0915\u0947 <strong>${esc(o.District)} \u091c\u093f\u0932\u0947</strong> \u092e\u0947\u0902 \u0938\u094d\u0925\u093f\u0924 \u090f\u0915 \u0921\u093e\u0915\u0918\u0930 \u0939\u0948\u0964 \u0907\u0938 \u0915\u094d\u0937\u0947\u0924\u094d\u0930 \u0915\u093e 6 \u0905\u0902\u0915\u094b\u0902 \u0935\u093e\u0932\u093e <strong>\u092a\u093f\u0928 \u0915\u094b\u0921 ${pin}</strong> \u0939\u0948\u0964`;
  const hiP2 = `${esc(o.Name)} \u0921\u093e\u0915\u0918\u0930 ${o.Division && o.Division !== 'N/A' ? `<strong>${esc(o.Division)} \u092e\u0902\u0921\u0932</strong> \u0914\u0930 ` : ''}<strong>${esc(o.Circle || 'N/A')} \u0938\u0930\u094d\u0915\u093f\u0932</strong> \u0915\u0947 \u0905\u0902\u0924\u0930\u094d\u0917\u0924 \u0906\u0924\u093e \u0939\u0948\u0964 \u092f\u0939 \u090f\u0915 <strong>${esc(o.BranchType || 'Post Office')}</strong> \u0939\u0948\u0964`;
  const hiP3 = `\u092f\u0926\u093f \u0906\u092a ${esc(o.District)} \u092e\u0947\u0902 ${esc(o.Name)} \u0915\u094d\u0937\u0947\u0924\u094d\u0930 \u0915\u093e \u092a\u093f\u0928 \u0915\u094b\u0921 \u0922\u0942\u0902\u0922 \u0930\u0939\u0947 \u0939\u0948\u0902, \u0924\u094b \u0938\u0939\u0940 <strong>\u092a\u094b\u0938\u094d\u091f\u0932 \u0915\u094b\u0921 ${pin}</strong> \u0939\u0948\u0964 \u0911\u0928\u0932\u093e\u0907\u0928 \u0936\u0949\u092a\u093f\u0902\u0917, \u0915\u0942\u0930\u093f\u092f\u0930, \u092c\u0948\u0902\u0915 \u092b\u0949\u0930\u094d\u092e \u0914\u0930 \u0938\u0930\u0915\u093e\u0930\u0940 \u092a\u0924\u094d\u0930\u093e\u091a\u093e\u0930 \u0915\u0947 \u0932\u093f\u090f <strong>${pin}</strong> \u0915\u093e \u0909\u092a\u092f\u094b\u0917 \u0915\u0930\u0947\u0902\u0964`;

  const faqs = [
    [`What is the pincode of ${esc(o.Name)}, ${esc(o.District)}?`,
     `The PIN code of <strong>${esc(o.Name)}</strong>, ${esc(o.District)} is <strong>${pin}</strong>. It is a ${esc(o.BranchType || 'Post Office')} under ${esc(o.Division || 'N/A')} Division, ${esc(o.Circle || 'N/A')} Circle.`],
    [`${esc(o.Name)} ${esc(o.District)} \u0915\u093e \u092a\u093f\u0928 \u0915\u094b\u0921 \u0915\u094d\u092f\u093e \u0939\u0948?`,
     `${esc(o.Name)} \u0915\u093e \u092a\u093f\u0928 \u0915\u094b\u0921 <strong>${pin}</strong> \u0939\u0948\u0964 \u092f\u0939 ${esc(o.District)} \u091c\u093f\u0932\u0947, ${esc(o.State)} \u092e\u0947\u0902 \u0938\u094d\u0925\u093f\u0924 \u0939\u0948\u0964`],
    [`${pin} ka area name kya hai?`,
     `${pin} pin code ka area name <strong>${esc(o.Name)}</strong> hai. Yeh <strong>${esc(o.District)}</strong>, ${esc(o.State)} mein located hai.`],
    [`${pin} \u0915\u093f\u0938 \u091c\u093f\u0932\u0947 \u092e\u0947\u0902 \u0939\u0948?`,
     `${pin} \u092a\u093f\u0928 \u0915\u094b\u0921 <strong>${esc(o.District)}</strong> \u091c\u093f\u0932\u0947 \u092e\u0947\u0902 \u0939\u0948, ${esc(o.State)}\u0964 / PIN ${pin} is in <strong>${esc(o.District)}</strong>, ${esc(o.State)}.`],
  ];

  const faqHtml = faqs.map(f =>
    `<div class="fq">
      <div class="fqq">${f[0]} <span style="color:#8e44ad">&#9660;</span></div>
      <div class="fqa">${f[1]}</div>
    </div>`).join('');

  const faqSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f[0].replace(/<[^>]+>/g, ''),
      "acceptedAnswer": { "@type": "Answer", "text": f[1].replace(/<[^>]+>/g, '') }
    }))
  });

  const postalSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "PostalAddress",
    "postalCode": pin,
    "addressLocality": o.Name,
    "addressRegion": o.State,
    "addressCountry": "IN"
  });

  const breadcrumbSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl + "/" },
      { "@type": "ListItem", "position": 2, "name": o.State, "item": `${siteUrl}/${ss}/` },
      { "@type": "ListItem", "position": 3, "name": o.District, "item": `${siteUrl}/${ss}/${ds}/` },
      { "@type": "ListItem", "position": 4, "name": o.Name, "item": `${siteUrl}/${ss}/${ds}/${ps}/` },
      { "@type": "ListItem", "position": 5, "name": pin, "item": `${siteUrl}/${ss}/${ds}/${ps}/${pin}/` }
    ]
  });

  const relChips = [
    esc(o.District) + ' all pincodes', esc(o.Name) + ' post office',
    pin + ' area name', esc(o.State) + ' pincode list',
    pin + ' ka area', esc(o.District) + ' \u092a\u093f\u0928 \u0915\u094b\u0921'
  ].map(c => `<a class="relc" href="/">${c}</a>`).join('');

  const title = `${pin} Pincode &mdash; ${esc(o.Name)}, ${esc(o.District)}, ${esc(o.State)}`;
  const desc = `PIN code ${pin} belongs to ${o.Name} post office in ${o.District}, ${o.State}. ${pin} area name, district, ${o.Name} \u092a\u093f\u0928 \u0915\u094b\u0921, ${pin} ka area.`;

  const body = `
    <div class="bc">
      <a href="/">&#127968; Home</a><span class="bcs">&#8250;</span>
      <a href="/${ss}/">${esc(o.State)}</a><span class="bcs">&#8250;</span>
      <a href="/${ss}/${ds}/">${esc(o.District)}</a><span class="bcs">&#8250;</span>
      <a href="/${ss}/${ds}/${ps}/">${esc(o.Name)}</a><span class="bcs">&#8250;</span>
      <span class="bcc">${pin}</span>
    </div>
    <a class="bk" href="/${ss}/${ds}/">&#8592; ${esc(o.District)}</a>
    ${adBox()}
    <div class="hero">
      <div class="hbg">${pin}</div>
      <div class="ht">
        <div class="pn">${pin}</div>
        <div class="hbadges">
          <span class="vb">&#10003; India Post Verified</span>
          <span class="upd">&#128994; Updated ${yr}</span>
        </div>
      </div>
      <h1 class="h1t">${esc(o.Name)} Post Office &mdash; Pincode ${pin}</h1>
      <div class="pol">${blk}${esc(o.District)}, ${esc(o.State)} &middot; ${esc(o.BranchType || 'Post Office')}</div>
      <div class="htags">
        <span class="htag">&#128205; ${esc(o.District)}</span>
        <span class="htag">&#128506; ${esc(o.State)}</span>
        <span class="htag">&#128238; ${esc(o.BranchType || 'Post Office')}</span>
        <span class="htag">&#128309; ${esc(o.Circle || 'N/A')} Circle</span>
      </div>
    </div>
    <div class="cbox">
      <div><div class="clb">6-Digit PIN Code</div><div class="cpin">${pin}</div></div>
      <div class="cinfo">
        <div class="clb">Post Office</div><div class="cv">${esc(o.Name)}</div>
        <div class="clb">District &amp; State</div><div class="cv">${esc(o.District)}, ${esc(o.State)}</div>
      </div>
      <button class="cbtn" onclick="if(navigator.clipboard)navigator.clipboard.writeText('${pin}');this.innerHTML='&#10003; Copied!';setTimeout(()=>this.innerHTML='&#128203; Copy PIN',1500)">&#128203; Copy PIN</button>
    </div>
    <div class="dg">
      <div class="db"><div class="dl">District</div><div class="dv">${esc(o.District)}</div></div>
      <div class="db"><div class="dl">State</div><div class="dv">${esc(o.State)}</div></div>
      <div class="db"><div class="dl">Division</div><div class="dv">${esc(o.Division || 'N/A')}</div></div>
      <div class="db"><div class="dl">Region</div><div class="dv">${esc(o.Region || 'N/A')}</div></div>
      <div class="db"><div class="dl">Circle</div><div class="dv">${esc(o.Circle || 'N/A')}</div></div>
      <div class="db"><div class="dl">Branch Type</div><div class="dv">${esc(o.BranchType || 'Post Office')}</div></div>
    </div>
    ${adBox()}
    <div class="sec">
      <h2>&#128203; About ${esc(o.Name)} &mdash; PIN Code ${pin}</h2>
      <p><strong>${esc(o.Name)}</strong> is a post office in <strong>${esc(o.District)}, ${esc(o.State)}</strong>. The 6-digit PIN code <strong>${pin}</strong> serves this area under the ${esc(o.Division || 'N/A')} postal division, ${esc(o.Circle || 'N/A')} circle, ${esc(o.Region || 'N/A')} region.</p>
      <p>Use PIN code <strong>${pin}</strong> for online shopping (Amazon, Flipkart), courier, bank forms (Aadhaar, PAN, Passport), and all official documents addressed to <strong>${esc(o.Name)}</strong> area of ${esc(o.District)}.</p>
    </div>
    <div class="hi">
      <h2>\uD83C\uDDEE\uD83C\uDDF3 ${esc(o.Name)} \u092a\u093f\u0928 \u0915\u094b\u0921 &mdash; ${pin}</h2>
      <p>${hiP1}</p><p>${hiP2}</p><p>${hiP3}</p>
      <div class="hikw">&#128269; <strong>\u0938\u092e\u094d\u092c\u0902\u0927\u093f\u0924 \u0916\u094b\u091c:</strong> ${esc(o.Name)} \u0915\u093e \u092a\u093f\u0928 \u0915\u094b\u0921 &middot; ${pin} \u0915\u093f\u0938 \u090f\u0930\u093f\u092f\u093e &middot; ${esc(o.District)} \u092a\u093f\u0928 \u0915\u094b\u0921 &middot; ${pin} ka area name &middot; ${esc(o.Name)} postal code</div>
    </div>
    <div class="how">
      <h2>&#128230; Where to Use ${pin}</h2>
      <div class="howg">
        <div class="howi"><div class="howic">&#128722;</div><div class="howt">Online Shopping</div><div class="howd">Amazon, Flipkart, Meesho &mdash; use <strong>${pin}</strong></div></div>
        <div class="howi"><div class="howic">&#127974;</div><div class="howt">Bank / KYC</div><div class="howd">Enter <strong>${pin}</strong> as postal code</div></div>
        <div class="howi"><div class="howic">&#128196;</div><div class="howt">Government Forms</div><div class="howd">Aadhaar, PAN, Passport, Voter ID</div></div>
        <div class="howi"><div class="howic">&#128666;</div><div class="howt">Courier / Speed Post</div><div class="howd">DTDC, BlueDart, India Post</div></div>
      </div>
    </div>
    <div class="faq">
      <h2>&#10067; FAQ / \u0905\u0915\u094d\u0938\u0930 \u092a\u0942\u091b\u0947 \u091c\u093e\u0928\u0947 \u0935\u093e\u0932\u0947 \u0938\u0935\u093e\u0932</h2>
      ${faqHtml}
      <div class="sok">&#9989; FAQ Schema added &mdash; Google shows expandable rich results</div>
    </div>
    ${adBox()}
    <div class="sec"><div class="st">Other Post Offices with Pincode ${pin}</div>${sameH}</div>
    ${nbH ? `<div class="sec"><div class="st">Nearby Areas &mdash; \u0928\u091c\u0926\u0940\u0915\u0940 \u0915\u094d\u0937\u0947\u0924\u094d\u0930</div><div class="ch">${nbH}</div></div>` : ''}
    <div class="rel"><h2>&#128269; Related Searches</h2><div class="relg">${relChips}</div></div>
    <div class="sb"><a href="/">&#128269; Search Another Pincode / \u0926\u0942\u0938\u0930\u093e \u092a\u093f\u0928 \u0915\u094b\u0921 \u0916\u094b\u091c\u0947\u0902</a></div>
  `;

  const combinedSchema = `[${postalSchema},${faqSchema},${breadcrumbSchema}]`;

  return htmlShell(title, desc, `${siteUrl}/${ss}/${ds}/${ps}/${pin}/`,
    combinedSchema, siteUrl, siteName, body, adsenseId);
}

// ── POST OFFICE PAGE ───────────────────────────────────────────
function buildPOPage(poName, district, state, offices, siteUrl, siteName) {
  const ss = toSlug(state), ds = toSlug(district), ps = toSlug(poName);
  const uniquePins = [...new Set(offices.map(o => o.Pincode))];
  const rows = uniquePins.map(p =>
    `<a class="lr" href="/${ss}/${ds}/${ps}/${p}/">
      <div>
        <div class="lrn">${esc(poName)} &mdash; ${p}</div>
        <div class="lrs">${esc(district)}, ${esc(state)}</div>
      </div>
      <div class="lrb">View &#8594;</div>
    </a>`).join('');

  const body = `
    <div class="bc">
      <a href="/">&#127968; Home</a><span class="bcs">&#8250;</span>
      <a href="/${ss}/">${esc(state)}</a><span class="bcs">&#8250;</span>
      <a href="/${ss}/${ds}/">${esc(district)}</a><span class="bcs">&#8250;</span>
      <span class="bcc">${esc(poName)}</span>
    </div>
    <a class="bk" href="/${ss}/${ds}/">&#8592; ${esc(district)}</a>
    <div class="cd">
      <div class="pt">${esc(poName)} <span class="cn">${uniquePins.length} pincode${uniquePins.length > 1 ? 's' : ''}</span></div>
      <div class="ps">${esc(district)}, ${esc(state)}</div>
      <div class="sec"><div class="st">Pincodes for ${esc(poName)}</div>${rows}</div>
    </div>
    <div class="sb"><a href="/">&#128269; Search Another Pincode</a></div>
  `;
  return htmlShell(
    `${esc(poName)} Post Office Pincode &mdash; ${esc(district)}, ${esc(state)}`,
    `All pincodes for ${poName} post office in ${district}, ${state}.`,
    `${siteUrl}/${ss}/${ds}/${ps}/`, null, siteUrl, siteName, body, null
  );
}

// ── DISTRICT PAGE ──────────────────────────────────────────────
function buildDistrictPage(district, state, offices, siteUrl, siteName) {
  const ss = toSlug(state), ds = toSlug(district);
  const poNames = [...new Set(offices.map(o => o.Name))].sort();
  const rows = poNames.map(nm => {
    const pins = [...new Set(offices.filter(o => o.Name === nm).map(o => o.Pincode))].slice(0, 2).join(', ');
    return `<a class="lr" href="/${ss}/${ds}/${toSlug(nm)}/">
      <div>
        <div class="lrn">${esc(nm)}</div>
        <div class="lrs">${esc(pins)}</div>
        <div class="uh">/${ss}/${ds}/${toSlug(nm)}/</div>
      </div>
      <div class="lrb">Browse &#8594;</div>
    </a>`;
  }).join('');

  const body = `
    <div class="bc">
      <a href="/">&#127968; Home</a><span class="bcs">&#8250;</span>
      <a href="/${ss}/">${esc(state)}</a><span class="bcs">&#8250;</span>
      <span class="bcc">${esc(district)}</span>
    </div>
    <a class="bk" href="/${ss}/">&#8592; ${esc(state)}</a>
    ${adBox()}
    <div class="cd">
      <div class="pt">${esc(district)} <span class="cn">${poNames.length} post offices</span></div>
      <div class="ps">All pincodes in ${esc(district)}, ${esc(state)}</div>
      <div class="sec"><div class="st">Post Offices in ${esc(district)}</div>${rows}</div>
    </div>
    <div class="sb"><a href="/">&#128269; Search Another Pincode</a></div>
  `;
  return htmlShell(
    `${esc(district)} Pincode List &mdash; All Post Offices, ${esc(state)}`,
    `All pincodes and post offices in ${district}, ${state}.`,
    `${siteUrl}/${ss}/${ds}/`, null, siteUrl, siteName, body, null
  );
}

// ── STATE PAGE ────────────────────────────────────────────────
function buildStatePage(state, districts, siteUrl, siteName) {
  const ss = toSlug(state);
  const rows = districts.sort().map(d =>
    `<a class="lr" href="/${ss}/${toSlug(d)}/">
      <div>
        <div class="lrn">${esc(d)}</div>
        <div class="uh">/${ss}/${toSlug(d)}/</div>
      </div>
      <div class="lrb">Browse &#8594;</div>
    </a>`).join('');

  const body = `
    <div class="bc">
      <a href="/">&#127968; Home</a><span class="bcs">&#8250;</span>
      <span class="bcc">${esc(state)}</span>
    </div>
    <a class="bk" href="/">&#8592; All States</a>
    ${adBox()}
    <div class="cd">
      <div class="pt">${esc(state)} <span class="cn">${districts.length} districts</span></div>
      <div class="ps">All districts and pincodes in ${esc(state)}</div>
      <div class="sec"><div class="st">Districts in ${esc(state)}</div>${rows}</div>
    </div>
    <div class="sb"><a href="/">&#128269; Search Another Pincode</a></div>
  `;
  return htmlShell(
    `${esc(state)} Pincode List &mdash; All Districts`,
    `Browse all pincodes and post offices in ${state}, India.`,
    `${siteUrl}/${ss}/`, null, siteUrl, siteName, body, null
  );
}

// ── ERROR PAGE ────────────────────────────────────────────────
function buildErrorPage(message, siteUrl, siteName) {
  const body = `
    <div class="err">
      <h2>&#128580; ${message}</h2>
      <p>The pincode or post office could not be found. Please check the URL or search again.</p>
      <br/>
      <a href="/" style="background:#3498db;color:#fff;padding:10px 22px;border-radius:7px;text-decoration:none;font-size:13px;font-weight:600">&#128269; Go to Search</a>
    </div>
  `;
  return htmlShell('Page Not Found', message, siteUrl + '/', null, siteUrl, siteName, body, null);
}

// ── MAIN HANDLER ──────────────────────────────────────────────
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const siteUrl = `${url.protocol}//${url.host}`;
  const siteName = env.SITE_NAME || 'PincodeSearch.in';
  const adsenseId = env.ADSENSE_ID || '';

  const path = url.pathname.replace(/\/+$/, '');

  // Root and static files — serve index.html directly
  if (path === '' || path === '/index.html') {
    return env.ASSETS.fetch(new Request(`${siteUrl}/index.html`));
  }

  // Pass through any file with an extension (.css, .js, .png etc)
  if (path.includes('.')) {
    return env.ASSETS.fetch(request);
  }

  const parts = path.split('/').filter(Boolean);

  // No parts — serve home
  if (!parts.length) {
    return env.ASSETS.fetch(new Request(`${siteUrl}/index.html`));
  }

  try {

    // ── /states/ ──────────────────────────────────────────────
    if (parts[0] === 'states' && parts.length === 1) {
      const STATES = [
        'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh',
        'Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu & Kashmir','Jharkhand',
        'Karnataka','Kerala','Ladakh','Madhya Pradesh','Maharashtra','Manipur','Meghalaya',
        'Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
        'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'
      ];
      const rows = STATES.map(s =>
        `<a class="lr" href="/${toSlug(s)}/">
          <div><div class="lrn">${esc(s)}</div><div class="uh">/${toSlug(s)}/</div></div>
          <div class="lrb">Browse &#8594;</div>
        </a>`).join('');
      const body = `
        <div class="bc"><a href="/">&#127968; Home</a><span class="bcs">&#8250;</span><span class="bcc">All States</span></div>
        ${adBox()}
        <div class="cd">
          <div class="pt">All States <span class="cn">${STATES.length} states</span></div>
          <div class="ps">Browse pincodes by state</div>
          <div class="sec"><div class="st">Select Your State</div>${rows}</div>
        </div>
      `;
      const html = htmlShell('All Indian States Pincode List', 'Browse pincodes for all states in India.',
        `${siteUrl}/states/`, null, siteUrl, siteName, body, adsenseId);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=86400' }
      });
    }

    // ── /state/district/postoffice/pincode/ ───────────────────
    if (parts.length === 4) {
      const pin = parts[3];
      if (!/^\d{6}$/.test(pin)) {
        const html = buildErrorPage(`Invalid pincode: ${esc(pin)}`, siteUrl, siteName);
        return new Response(html, { status: 400, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
      }
      const offices = await fetchByPin(pin);
      if (!offices.length) {
        const html = buildErrorPage(`Pincode ${pin} not found in India Post database`, siteUrl, siteName);
        return new Response(html, { status: 404, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
      }
      const poSlug = parts[2];
      let o = offices.find(p => toSlug(p.Name) === poSlug);
      if (!o) o = offices[0];
      const html = buildPinPage(o, offices, siteUrl, siteName, adsenseId);
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=86400',
          'X-Robots-Tag': 'index, follow'
        }
      });
    }

    // ── /state/district/postoffice/ ───────────────────────────
    if (parts.length === 3) {
      const poName = fromSlug(parts[2]);
      const offices = await fetchByPO(poName);
      if (!offices.length) {
        const html = buildErrorPage(`Post office "${esc(poName)}" not found`, siteUrl, siteName);
        return new Response(html, { status: 404, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
      }
      const district = fromSlug(parts[1]);
      const state = fromSlug(parts[0]);
      const html = buildPOPage(poName, district, state, offices, siteUrl, siteName);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=86400' }
      });
    }

    // ── /state/district/ ──────────────────────────────────────
    if (parts.length === 2) {
      const distName = fromSlug(parts[1]);
      const offices = await fetchByPO(distName);
      if (!offices.length) {
        const html = buildErrorPage(`District "${esc(distName)}" not found`, siteUrl, siteName);
        return new Response(html, { status: 404, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
      }
      const filtered = offices.filter(o => toSlug(o.District) === parts[1] || toSlug(o.State) === parts[0]);
      const state = fromSlug(parts[0]);
      const html = buildDistrictPage(distName, state, filtered.length ? filtered : offices, siteUrl, siteName);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=86400' }
      });
    }

    // ── /state/ ───────────────────────────────────────────────
    if (parts.length === 1) {
      const stateName = fromSlug(parts[0]);
      const offices = await fetchByPO(stateName);
      if (!offices.length) {
        const html = buildErrorPage(`State "${esc(stateName)}" not found`, siteUrl, siteName);
        return new Response(html, { status: 404, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
      }
      const districts = [...new Set(offices.filter(o => toSlug(o.State) === parts[0]).map(o => o.District))];
      if (!districts.length) {
        const html = buildErrorPage(`No districts found for "${esc(stateName)}"`, siteUrl, siteName);
        return new Response(html, { status: 404, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
      }
      const html = buildStatePage(stateName, districts, siteUrl, siteName);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=86400' }
      });
    }

    // Unknown path — serve search page
    return env.ASSETS.fetch(new Request(`${siteUrl}/index.html`));

  } catch (err) {
    // Any unexpected error — show friendly error page
    const html = buildErrorPage('Something went wrong. Please try again.', siteUrl, siteName);
    return new Response(html, { status: 500, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
}
