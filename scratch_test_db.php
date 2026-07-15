<?php
require 'api/config.php';
$r = $pdo->query("SELECT value FROM settings WHERE key='programme_2026_7'")->fetchColumn();
print_r($r);
