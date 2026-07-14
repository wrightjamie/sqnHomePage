<?php
// api/utils.php

/**
 * Generates a thumbnail for an image using PHP GD
 */
function generateThumbnail($source, $dest, $maxWidth = 300, $maxHeight = 300) {
    if (!extension_loaded('gd')) return false;
    
    $info = getimagesize($source);
    if (!$info) return false;
    
    $mime = $info['mime'];
    switch ($mime) {
        case 'image/jpeg': $img = imagecreatefromjpeg($source); break;
        case 'image/png': $img = imagecreatefrompng($source); break;
        case 'image/gif': $img = imagecreatefromgif($source); break;
        case 'image/webp': $img = imagecreatefromwebp($source); break;
        default: return false;
    }
    if (!$img) return false;
    
    // Handle EXIF orientation for JPEGs (fixes 90 degree rotation issues from cameras/phones)
    if ($mime == 'image/jpeg' && function_exists('exif_read_data')) {
        $exif = @exif_read_data($source);
        if ($exif && isset($exif['Orientation'])) {
            switch ($exif['Orientation']) {
                case 3:
                    $img = imagerotate($img, 180, 0);
                    break;
                case 6:
                    $img = imagerotate($img, -90, 0);
                    break;
                case 8:
                    $img = imagerotate($img, 90, 0);
                    break;
            }
        }
    }
    
    $srcW = imagesx($img);
    $srcH = imagesy($img);
    $ratio = min($maxWidth / $srcW, $maxHeight / $srcH);
    if ($ratio >= 1) {
        $newW = $srcW; $newH = $srcH;
    } else {
        $newW = (int)($srcW * $ratio);
        $newH = (int)($srcH * $ratio);
    }
    
    $thumb = imagecreatetruecolor($newW, $newH);
    if ($mime == 'image/png' || $mime == 'image/webp' || $mime == 'image/gif') {
        imagealphablending($thumb, false);
        imagesavealpha($thumb, true);
        $transparent = imagecolorallocatealpha($thumb, 255, 255, 255, 127);
        imagefilledrectangle($thumb, 0, 0, $newW, $newH, $transparent);
    }
    
    imagecopyresampled($thumb, $img, 0, 0, 0, 0, $newW, $newH, $srcW, $srcH);
    
    switch ($mime) {
        case 'image/jpeg': imagejpeg($thumb, $dest, 85); break;
        case 'image/png': imagepng($thumb, $dest); break;
        case 'image/gif': imagegif($thumb, $dest); break;
        case 'image/webp': imagewebp($thumb, $dest, 85); break;
    }
    imagedestroy($img);
    imagedestroy($thumb);
    return true;
}

/**
 * Handles image upload, saves to disk, generates thumbnail, and inserts into DB.
 * Returns the URL of the uploaded image on success, or null on failure.
 */
function handleImageUpload($pdo, $fileField = 'image_file', $title = '', $description = '', $tags = '[]') {
    if (isset($_FILES[$fileField]) && $_FILES[$fileField]['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        
        $filename = time() . '_' . basename($_FILES[$fileField]['name']);
        $targetPath = $uploadDir . $filename;
        if (move_uploaded_file($_FILES[$fileField]['tmp_name'], $targetPath)) {
            generateThumbnail($targetPath, $uploadDir . 'thumb_' . $filename);
            
            // Insert into database
            $stmt = $pdo->prepare("INSERT INTO images (filename, title, description, tags) VALUES (?, ?, ?, ?)");
            $stmt->execute([$filename, $title, $description, $tags]);
            
            return 'uploads/' . $filename;
        }
    }
    return null;
}
/**
 * Checks if the currently logged in user has a specific permission.
 * Returns true/false.
 */
function hasPermission($pdo, $permissionName) {
    if (!isset($_SESSION['user_id'])) return false;

    $stmt = $pdo->prepare("
        SELECT 1
        FROM users u
        JOIN role_permissions rp ON u.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ? AND p.name = ?
    ");
    $stmt->execute([$_SESSION['user_id'], $permissionName]);

    return $stmt->fetch() !== false;
}

/**
 * Checks if the currently logged in user has a specific permission.
 * If not, sends a 403 JSON error and exits.
 */
function requirePermission($pdo, $permissionName) {
    if (!hasPermission($pdo, $permissionName)) {
        jsonError('Forbidden: You do not have permission to perform this action.', 403);
    }
}

/**
 * Standard JSON Success Response
 */
function jsonResponse($data, $statusCode = 200, $exit = true) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    echo json_encode(['success' => true, 'data' => $data]);
    if($exit) exit;
}

/**
 * Standard JSON Error Response
 */
function jsonError($message, $statusCode = 400, $exit = true) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => $message]);
    if($exit) exit;
}
?>
