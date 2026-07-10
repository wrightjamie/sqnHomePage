<?php
// api/images.php
require_once 'config.php';
require_once 'utils.php';

header('Content-Type: application/json');

// Check authentication
if (!$isLoggedIn) {
    jsonError('Unauthorized', 401);
}

$action = $_GET['action'] ?? 'list';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!empty($_POST)) {
        $data = $_POST;
    } else {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
    }
} else {
    $data = $_GET;
}

if ($action === 'list') {
    $page = max(1, isset($_GET['page']) ? (int)$_GET['page'] : 1);
    $limit = max(1, isset($_GET['limit']) ? (int)$_GET['limit'] : 18);
    $search = trim($_GET['search'] ?? '');
    $tagFilter = trim($_GET['tag'] ?? '');
    
    $offset = ($page - 1) * $limit;
    
    $where = [];
    $params = [];
    
    if ($search !== '') {
        $where[] = "(title LIKE ? OR description LIKE ? OR filename LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    
    if ($tagFilter !== '') {
        $tags = explode(',', $tagFilter);
        foreach ($tags as $t) {
            $t = trim($t);
            if ($t !== '') {
                $where[] = "tags LIKE ?";
                $params[] = "%\"$t\"%";
            }
        }
    }
    
    $whereClause = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";
    
    // Count total
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM images $whereClause");
    $stmt->execute($params);
    $total = $stmt->fetchColumn();
    $pages = ceil($total / $limit);
    
    // Fetch images
    $stmt = $pdo->prepare("SELECT * FROM images $whereClause ORDER BY created_at DESC LIMIT ? OFFSET ?");
    $stmt->execute(array_merge($params, [$limit, $offset]));
    $rows = $stmt->fetchAll();
    
    $images = [];
    $uploadDir = '../uploads/';
    foreach ($rows as $row) {
        $file = $row['filename'];
        $thumbFile = 'thumb_' . $file;
        $thumbUrl = file_exists($uploadDir . $thumbFile) ? 'uploads/' . $thumbFile : 'uploads/' . $file;
        
        $images[] = [
            'id' => $row['id'],
            'filename' => $file,
            'url' => 'uploads/' . $file,
            'thumb_url' => $thumbUrl,
            'title' => $row['title'],
            'description' => $row['description'],
            'tags' => json_decode($row['tags'] ?: '[]'),
            'focus_x' => $row['focus_x'] ?? 50,
            'focus_y' => $row['focus_y'] ?? 50,
            'created_at' => $row['created_at']
        ];
    }
    
    jsonResponse([
        'images' => $images,
        'total' => $total,
        'pages' => $pages,
        'page' => $page
    ]);
} elseif ($action === 'delete') {
    $filename = $_GET['filename'] ?? '';
    if (empty($filename) || strpos($filename, '..') !== false || strpos($filename, '/') !== false) {
        jsonError('Invalid filename');
    }
    $uploadDir = '../uploads/';
    $filePath = $uploadDir . $filename;
    $thumbPath = $uploadDir . 'thumb_' . $filename;
    
    $deleted = false;
    if (file_exists($filePath)) {
        unlink($filePath);
        $deleted = true;
    }
    if (file_exists($thumbPath)) {
        unlink($thumbPath);
    }
    
    // Delete from DB
    $stmt = $pdo->prepare("DELETE FROM images WHERE filename = ?");
    $stmt->execute([$filename]);
    
    jsonResponse(['deleted' => $deleted]);
} elseif ($action === 'update_metadata') {
    $id = $data['id'] ?? null;
    $title = $data['title'] ?? '';
    $description = $data['description'] ?? '';
    $tags = $data['tags'] ?? []; // Should be an array
    
    if (!$id) {
        jsonError('Missing ID');
    }
    
    $tagsJson = json_encode($tags);
    $stmt = $pdo->prepare("UPDATE images SET title = ?, description = ?, tags = ? WHERE id = ?");
    $stmt->execute([$title, $description, $tagsJson, $id]);
    
    jsonResponse(['message' => 'Success']);
} elseif ($action === 'set_focus') {
    $id = $data['id'] ?? null;
    $focusX = $data['focus_x'] ?? 50;
    $focusY = $data['focus_y'] ?? 50;
    
    if (!$id) {
        jsonError('Missing ID');
    }
    
    $stmt = $pdo->prepare("UPDATE images SET focus_x = ?, focus_y = ? WHERE id = ?");
    $stmt->execute([$focusX, $focusY, $id]);
    
    jsonResponse(['message' => 'Success']);
} elseif ($action === 'get_tags') {
    // Fetch all tags to provide autocomplete
    $stmt = $pdo->query("SELECT tags FROM images WHERE tags IS NOT NULL AND tags != '[]' AND tags != ''");
    $allTagsJson = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $tagCounts = [];
    foreach ($allTagsJson as $tagsJson) {
        $tags = json_decode($tagsJson, true);
        if (is_array($tags)) {
            foreach ($tags as $tag) {
                if (!isset($tagCounts[$tag])) {
                    $tagCounts[$tag] = 0;
                }
                $tagCounts[$tag]++;
            }
        }
    }
    
    // Sort by frequency (descending)
    arsort($tagCounts);
    $uniqueTags = array_keys($tagCounts);
    jsonResponse(['tags' => $uniqueTags]);
} elseif ($action === 'upload') {
    $title = $data['title'] ?? '';
    $description = $data['description'] ?? '';
    $tags = $data['tags'] ?? '[]'; // Expecting JSON array of tags as string
    
    $uploadedUrl = handleImageUpload($pdo, 'image_file', $title, $description, $tags);
    if ($uploadedUrl) {
        jsonResponse(['url' => $uploadedUrl]);
    } else {
        jsonError('Upload failed');
    }
} elseif ($action === 'regenerate_all') {
    $uploadDir = '../uploads/';
    if (!is_dir($uploadDir)) {
        jsonError('Upload dir not found');
    }
    
    $files = scandir($uploadDir);
    $generatedCount = 0;
    $debug = [];
    $debug['gd_loaded'] = extension_loaded('gd');
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        if (strpos($file, 'thumb_') === 0) continue; // Skip existing thumbs
        
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $source = $uploadDir . $file;
            $dest = $uploadDir . 'thumb_' . $file;
            if (!file_exists($dest)) {
                $res = generateThumbnail($source, $dest);
                $debug['files'][] = ['source' => $source, 'res' => $res, 'file_exists_source' => file_exists($source)];
                if ($res) {
                    $generatedCount++;
                }
            } else {
                $debug['skipped_exists'][] = $dest;
            }
        }
    }
    
    jsonResponse(['count' => $generatedCount, 'debug' => $debug]);
}

if ($action === 'set_focus') {
    $id = $data['id'] ?? null;
    $focusX = $data['focus_x'] ?? 50;
    $focusY = $data['focus_y'] ?? 50;
    
    if (!$id) jsonError('Missing id');
    
    $stmt = $pdo->prepare("UPDATE images SET focus_x = ?, focus_y = ? WHERE id = ?");
    $stmt->execute([$focusX, $focusY, $id]);
    
    jsonResponse(['updated' => true]);
}

jsonError('Invalid action');
?>
