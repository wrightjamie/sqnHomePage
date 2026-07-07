const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'images', 'ranks');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const baseSvg = (content) => `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
    <!-- Epaulette background -->
    <path d="M10,20 L50,0 L90,20 L90,150 L10,150 Z" fill="#00152b" stroke="#000" stroke-width="2"/>
    ${content}
</svg>`;

// Cadet (no RAFAC)
fs.writeFileSync(path.join(dir, 'cdt.svg'), baseSvg(``));

// Cpl (no RAFAC)
fs.writeFileSync(path.join(dir, 'cpl.svg'), baseSvg(`
    <path d="M20,60 L50,90 L80,60 L80,80 L50,110 L20,80 Z" fill="#6ba4d9" />
    <path d="M20,30 L50,60 L80,30 L80,50 L50,80 L20,50 Z" fill="#6ba4d9" />
`));

// Sgt (RAFAC for Adult staff)
fs.writeFileSync(path.join(dir, 'sgt.svg'), baseSvg(`
    <path d="M20,70 L50,100 L80,70 L80,85 L50,115 L20,85 Z" fill="#6ba4d9" />
    <path d="M20,45 L50,75 L80,45 L80,60 L50,90 L20,60 Z" fill="#6ba4d9" />
    <path d="M20,20 L50,50 L80,20 L80,35 L50,65 L20,35 Z" fill="#6ba4d9" />
    <text x="50" y="135" fill="#cda434" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">RAFAC</text>
`));

// FSgt (3 chevrons + crown - RAFAC)
fs.writeFileSync(path.join(dir, 'fsgt.svg'), baseSvg(`
    <path d="M20,80 L50,105 L80,80 L80,90 L50,115 L20,90 Z" fill="#6ba4d9" />
    <path d="M20,60 L50,85 L80,60 L80,70 L50,95 L20,70 Z" fill="#6ba4d9" />
    <path d="M20,40 L50,65 L80,40 L80,50 L50,75 L20,50 Z" fill="#6ba4d9" />
    <!-- Stylized Crown -->
    <path d="M35,35 L40,15 L50,25 L60,15 L65,35 Z" fill="#cda434" />
    <circle cx="40" cy="15" r="2" fill="#881337" />
    <circle cx="50" cy="25" r="2" fill="#881337" />
    <circle cx="60" cy="15" r="2" fill="#881337" />
    <rect x="35" y="35" width="30" height="4" fill="#cda434" />
    <text x="50" y="135" fill="#cda434" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">RAFAC</text>
`));

// CWO (Wreath + crown - Cadet, no RAFAC)
fs.writeFileSync(path.join(dir, 'cwo.svg'), baseSvg(`
    <!-- Wreath -->
    <path d="M30,80 Q20,40 50,20 Q80,40 70,80 Q50,100 30,80 Z" fill="none" stroke="#6ba4d9" stroke-width="5" />
    <!-- Crown -->
    <path d="M35,65 L40,45 L50,55 L60,45 L65,65 Z" fill="#cda434" />
    <rect x="35" y="65" width="30" height="4" fill="#cda434" />
`));

// WO (Royal Arms Stylized - Adult, RAFAC)
// Muted gold/bronze and navy, less bold red.
fs.writeFileSync(path.join(dir, 'wo.svg'), baseSvg(`
    <!-- Shield / Coat of Arms outline -->
    <path d="M35,30 L65,30 L65,70 Q50,90 35,70 Z" fill="none" stroke="#cda434" stroke-width="3" />
    <path d="M40,35 L60,35 L60,65 Q50,80 40,65 Z" fill="#881337" />
    
    <!-- Central detailing -->
    <circle cx="50" cy="50" r="8" fill="#00152b" stroke="#cda434" stroke-width="2" />
    
    <!-- Flanking lions/unicorns abstracted as gold shapes -->
    <path d="M25,50 Q30,30 35,50 Q30,70 25,50 Z" fill="#cda434" />
    <path d="M75,50 Q70,30 65,50 Q70,70 75,50 Z" fill="#cda434" />
    
    <!-- Bottom scroll -->
    <rect x="30" y="85" width="40" height="6" fill="#cda434" />
    
    <text x="50" y="135" fill="#cda434" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">RAFAC</text>
`));

// CI (no RAFAC)
fs.writeFileSync(path.join(dir, 'ci.svg'), baseSvg(`
    <text x="50" y="85" fill="#6ba4d9" font-family="sans-serif" font-size="36" text-anchor="middle" font-weight="bold">CI</text>
`));

// Officers (no RAFAC)
fs.writeFileSync(path.join(dir, 'plt_off.svg'), baseSvg(`
    <rect x="10" y="100" width="80" height="8" fill="#6ba4d9" />
    <rect x="10" y="100" width="80" height="8" fill="none" stroke="#000" stroke-width="2" />
`));

fs.writeFileSync(path.join(dir, 'fg_off.svg'), baseSvg(`
    <rect x="10" y="90" width="80" height="18" fill="#6ba4d9" />
    <rect x="10" y="90" width="80" height="18" fill="none" stroke="#000" stroke-width="2" />
`));

fs.writeFileSync(path.join(dir, 'flt_lt.svg'), baseSvg(`
    <rect x="10" y="65" width="80" height="18" fill="#6ba4d9" />
    <rect x="10" y="65" width="80" height="18" fill="none" stroke="#000" stroke-width="2" />
    <rect x="10" y="90" width="80" height="18" fill="#6ba4d9" />
    <rect x="10" y="90" width="80" height="18" fill="none" stroke="#000" stroke-width="2" />
`));

fs.writeFileSync(path.join(dir, 'sqn_ldr.svg'), baseSvg(`
    <rect x="10" y="50" width="80" height="18" fill="#6ba4d9" />
    <rect x="10" y="50" width="80" height="18" fill="none" stroke="#000" stroke-width="2" />
    <rect x="10" y="75" width="80" height="8" fill="#6ba4d9" />
    <rect x="10" y="75" width="80" height="8" fill="none" stroke="#000" stroke-width="2" />
    <rect x="10" y="90" width="80" height="18" fill="#6ba4d9" />
    <rect x="10" y="90" width="80" height="18" fill="none" stroke="#000" stroke-width="2" />
`));

// Wg Cdr (3 thick bands)
fs.writeFileSync(path.join(dir, 'wg_cdr.svg'), baseSvg(`
    <rect x="10" y="40" width="80" height="18" fill="#6ba4d9" />
    <rect x="10" y="40" width="80" height="18" fill="none" stroke="#000" stroke-width="2" />
    <rect x="10" y="65" width="80" height="18" fill="#6ba4d9" />
    <rect x="10" y="65" width="80" height="18" fill="none" stroke="#000" stroke-width="2" />
    <rect x="10" y="90" width="80" height="18" fill="#6ba4d9" />
    <rect x="10" y="90" width="80" height="18" fill="none" stroke="#000" stroke-width="2" />
`));

console.log("Rank SVGs updated successfully.");
