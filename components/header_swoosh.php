<?php
$headerTitle = $headerTitle ?? 'Header Title';
$headerSubtitle = $headerSubtitle ?? '2459 (Poulton-le-Fylde) Squadron ATC';
?>
<div class="page-header-swoosh no-print">
    <?php
        $swooshOrientation = 'horizontal';
        $swooshClass = 'header-swoosh-svg';
        include __DIR__ . '/swoosh.php';
    ?>
    <div class="page-header-content">
        <div class="header-titles">
            <h2><?= htmlspecialchars($headerSubtitle) ?></h2>
            <h1 id="header-title"><?= htmlspecialchars($headerTitle) ?></h1>
        </div>
        <img src="images/rafac-logo.svg" alt="RAFAC">
    </div>
</div>
