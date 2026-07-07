<?php
$dir = __DIR__ . '/images/ranks/';
if (!is_dir($dir)) mkdir($dir, 0777, true);

$baseSvg = function($content) {
    return '<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
    <!-- Epaulette background -->
    <path d="M10,20 L50,0 L90,20 L90,150 L10,150 Z" fill="#00152b" stroke="#000" stroke-width="2"/>
    ' . $content . '
</svg>';
};

// Cadet
file_put_contents($dir . 'cdt.svg', $baseSvg('
    <text x="50" y="130" fill="#fff" font-family="sans-serif" font-size="20" text-anchor="middle" font-weight="bold">RAFAC</text>
'));

// Cpl (2 chevrons point down)
file_put_contents($dir . 'cpl.svg', $baseSvg('
    <path d="M20,60 L50,90 L80,60 L80,80 L50,110 L20,80 Z" fill="#6ba4d9" />
    <path d="M20,30 L50,60 L80,30 L80,50 L50,80 L20,50 Z" fill="#6ba4d9" />
    <text x="50" y="135" fill="#fff" font-family="sans-serif" font-size="16" text-anchor="middle" font-weight="bold">RAFAC</text>
'));

// Sgt (3 chevrons)
file_put_contents($dir . 'sgt.svg', $baseSvg('
    <path d="M20,70 L50,100 L80,70 L80,85 L50,115 L20,85 Z" fill="#6ba4d9" />
    <path d="M20,45 L50,75 L80,45 L80,60 L50,90 L20,60 Z" fill="#6ba4d9" />
    <path d="M20,20 L50,50 L80,20 L80,35 L50,65 L20,35 Z" fill="#6ba4d9" />
    <text x="50" y="135" fill="#fff" font-family="sans-serif" font-size="16" text-anchor="middle" font-weight="bold">RAFAC</text>
'));

// FSgt (3 chevrons + crown)
file_put_contents($dir . 'fsgt.svg', $baseSvg('
    <path d="M20,80 L50,105 L80,80 L80,90 L50,115 L20,90 Z" fill="#6ba4d9" />
    <path d="M20,60 L50,85 L80,60 L80,70 L50,95 L20,70 Z" fill="#6ba4d9" />
    <path d="M20,40 L50,65 L80,40 L80,50 L50,75 L20,50 Z" fill="#6ba4d9" />
    <!-- Stylized Crown -->
    <path d="M35,35 L40,15 L50,25 L60,15 L65,35 Z" fill="#eab308" />
    <circle cx="40" cy="15" r="3" fill="#ef4444" />
    <circle cx="50" cy="25" r="3" fill="#ef4444" />
    <circle cx="60" cy="15" r="3" fill="#ef4444" />
    <rect x="35" y="35" width="30" height="5" fill="#eab308" />
    <text x="50" y="135" fill="#fff" font-family="sans-serif" font-size="16" text-anchor="middle" font-weight="bold">RAFAC</text>
'));

// CWO (Wreath + crown)
file_put_contents($dir . 'cwo.svg', $baseSvg('
    <!-- Wreath -->
    <path d="M30,80 Q20,40 50,20 Q80,40 70,80 Q50,100 30,80 Z" fill="none" stroke="#6ba4d9" stroke-width="6" />
    <!-- Crown -->
    <path d="M35,65 L40,45 L50,55 L60,45 L65,65 Z" fill="#eab308" />
    <rect x="35" y="65" width="30" height="5" fill="#eab308" />
    <text x="50" y="135" fill="#fff" font-family="sans-serif" font-size="16" text-anchor="middle" font-weight="bold">RAFAC</text>
'));

// WO (Royal Arms / Tate & Lyle stylized)
file_put_contents($dir . 'wo.svg', $baseSvg('
    <!-- Shield -->
    <path d="M35,30 L65,30 L65,70 Q50,90 35,70 Z" fill="#ef4444" />
    <!-- Embellishments -->
    <circle cx="25" cy="50" r="10" fill="#eab308" />
    <circle cx="75" cy="50" r="10" fill="#eab308" />
    <rect x="25" y="85" width="50" height="10" fill="#6ba4d9" />
    <text x="50" y="135" fill="#fff" font-family="sans-serif" font-size="16" text-anchor="middle" font-weight="bold">RAFAC</text>
'));

// CI
file_put_contents($dir . 'ci.svg', $baseSvg('
    <text x="50" y="85" fill="#fff" font-family="sans-serif" font-size="40" text-anchor="middle" font-weight="bold">CI</text>
'));

// Plt Off (1 thin band)
file_put_contents($dir . 'plt_off.svg', $baseSvg('
    <rect x="10" y="100" width="80" height="10" fill="#6ba4d9" />
    <rect x="10" y="100" width="80" height="10" fill="none" stroke="#000" stroke-width="2" />
    <text x="50" y="135" fill="#fff" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">RAFAC</text>
'));

// Fg Off (1 thick band)
file_put_contents($dir . 'fg_off.svg', $baseSvg('
    <rect x="10" y="90" width="80" height="20" fill="#6ba4d9" />
    <rect x="10" y="90" width="80" height="20" fill="none" stroke="#000" stroke-width="2" />
    <text x="50" y="135" fill="#fff" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">RAFAC</text>
'));

// Flt Lt (2 thick bands)
file_put_contents($dir . 'flt_lt.svg', $baseSvg('
    <rect x="10" y="65" width="80" height="20" fill="#6ba4d9" />
    <rect x="10" y="65" width="80" height="20" fill="none" stroke="#000" stroke-width="2" />
    <rect x="10" y="90" width="80" height="20" fill="#6ba4d9" />
    <rect x="10" y="90" width="80" height="20" fill="none" stroke="#000" stroke-width="2" />
    <text x="50" y="135" fill="#fff" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">RAFAC</text>
'));

// Sqn Ldr (2 thick bands, 1 thin between)
file_put_contents($dir . 'sqn_ldr.svg', $baseSvg('
    <rect x="10" y="50" width="80" height="20" fill="#6ba4d9" />
    <rect x="10" y="50" width="80" height="20" fill="none" stroke="#000" stroke-width="2" />
    
    <rect x="10" y="75" width="80" height="10" fill="#6ba4d9" />
    <rect x="10" y="75" width="80" height="10" fill="none" stroke="#000" stroke-width="2" />
    
    <rect x="10" y="90" width="80" height="20" fill="#6ba4d9" />
    <rect x="10" y="90" width="80" height="20" fill="none" stroke="#000" stroke-width="2" />
    <text x="50" y="135" fill="#fff" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">RAFAC</text>
'));

echo "Rank SVGs generated successfully.";
