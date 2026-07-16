<?php
$swooshOrientation = $swooshOrientation ?? "vertical";
$swooshClass = $swooshClass ?? "";
?>
<?php if ($swooshOrientation === "horizontal"): ?>
<svg class="<?= htmlspecialchars($swooshClass) ?>" viewBox="0 0 300 45" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path class="swoosh-inner" fill="var(--raf-supp-4)" d="M0 0 h300 V3.9 c-99.4-3.3 -187.2.1 -300 37 Z"></path>
    <path class="swoosh-dividing" fill="var(--raf-nav-2)" d="M0 45 C35.4 32.2 163.2 4.4 300 18.1 V3.9 c-99.4-3.3 -187.2.1 -300 37 V45 Z"></path>
</svg>
<?php else: ?>
<svg class="<?= htmlspecialchars($swooshClass) ?>" viewBox="0 0 45 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path class="swoosh-inner" d="M0 0v300H3.9c-3.3-99.4.1-187.2 37-300Z"></path>
    <path class="swoosh-dividing" d="M45 0C32.2 35.4 4.4 163.2 18.1 300H3.9c-3.3-99.4.1-187.2 37-300H45Z"></path>
</svg>
<?php endif; ?>
