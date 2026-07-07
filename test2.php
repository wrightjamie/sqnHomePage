<?php
require 'api/utils.php';
$uploadDir = 'uploads/';
$files = scandir($uploadDir);
$debug = [];
$debug['gd_loaded'] = extension_loaded('gd');

foreach ($files as $file) {
    if ($file === '.' || $file === '..') continue;
    if (strpos($file, 'thumb_') === 0) continue; 
    
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
        $source = $uploadDir . $file;
        $dest = $uploadDir . 'thumb_' . $file;
        
        $debug['file'] = $file;
        $debug['file_exists_dest'] = file_exists($dest);
        
        if (!file_exists($dest)) {
            $res = generateThumbnail($source, $dest);
            $debug['res'] = $res;
        }
    }
}
var_dump($debug);
?>
