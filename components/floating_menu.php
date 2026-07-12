<?php
/**
 * components/floating_menu.php
 *
 * Renders the bottom-right floating action menu.
 *
 * @param array $pinnedItems Array of HTML strings for items that sit outside the hamburger menu.
 * @param array $menuItems Array of HTML strings for items inside the hamburger menu.
 */

$pinnedItems = $pinnedItems ?? [];
$menuItems = $menuItems ?? [];
?>

<div id="bottom-right-controls" class="floating-controls-container">
    <!-- Pinned Items -->
    <?php foreach ($pinnedItems as $item): ?>
        <?= $item ?>
    <?php endforeach; ?>

    <!-- Hamburger Menu Wrapper -->
    <div id="hamburger-menu-wrapper" class="flex-col align-center">
        <!-- Expandable Menu Items -->
        <div id="hamburger-menu-items" class="hidden flex-col gap-sm" style="margin-bottom: var(--space-sm); transition: opacity 0.3s ease, transform 0.3s ease; opacity: 0; transform: translateY(10px);">
            <?php foreach ($menuItems as $item): ?>
                <?= $item ?>
            <?php endforeach; ?>
        </div>

        <!-- Toggle Button -->
        <button id="btn-hamburger-toggle" class="menu-btn flex-center" title="Menu" style="opacity: 1; background: rgba(0,0,0,0.5);">
            <span class="material-symbols-outlined" id="hamburger-icon">menu</span>
        </button>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        const toggleBtn = document.getElementById('btn-hamburger-toggle');
        const menuItems = document.getElementById('hamburger-menu-items');
        const icon = document.getElementById('hamburger-icon');
        let isOpen = false;

        if (toggleBtn && menuItems) {
            toggleBtn.addEventListener('click', () => {
                isOpen = !isOpen;
                if (isOpen) {
                    menuItems.classList.remove('hidden');
                    // Slight delay to allow display:block to apply before animating opacity
                    requestAnimationFrame(() => {
                        menuItems.style.opacity = '1';
                        menuItems.style.transform = 'translateY(0)';
                    });
                    icon.textContent = 'close';
                } else {
                    menuItems.style.opacity = '0';
                    menuItems.style.transform = 'translateY(10px)';
                    icon.textContent = 'menu';
                    // Wait for transition to finish before hiding
                    setTimeout(() => {
                        if (!isOpen) menuItems.classList.add('hidden');
                    }, 300);
                }
            });
        }
    });
</script>
