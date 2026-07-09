<?php
require 'api/config.php';
$stmt = $pdo->query("SELECT * FROM settings WHERE key LIKE 'programme_%'");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "KEY: " . $row['key'] . "\n";
    echo substr($row['value'], 0, 1000) . "\n\n";
}
?>
