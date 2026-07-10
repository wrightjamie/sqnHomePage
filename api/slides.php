<?php
// api/slides.php
require_once 'config.php';
require_once 'utils.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

function injectFocusCoordinates($pdo, &$slides) {
    if (!$slides) return;
    $stmtImg = $pdo->prepare("SELECT focus_x, focus_y FROM images WHERE filename = ?");
    foreach ($slides as &$slide) {
        if ($slide['type'] === 'image' || $slide['type'] === 'gallery') {
            $contentObj = json_decode($slide['content'], true);
            if ($contentObj && !empty($contentObj['imageUrl'])) {
                $filename = basename($contentObj['imageUrl']);
                $stmtImg->execute([$filename]);
                $img = $stmtImg->fetch();
                if ($img) {
                    $contentObj['focusX'] = $img['focus_x'];
                    $contentObj['focusY'] = $img['focus_y'];
                    $slide['content'] = json_encode($contentObj);
                }
            }
        }
    }
}

// Check if it's a public request (fetching active slide set)
if ($method === 'GET' && $action === 'active_set') {
    $stmt = $pdo->query("SELECT * FROM slide_sets WHERE is_active = 1 ORDER BY display_order ASC");
    $activeSets = $stmt->fetchAll();
    
    if (count($activeSets) > 0) {
        // Fetch slides for all active sets
        $allSets = [];
        $stmtSlides = $pdo->prepare("SELECT * FROM slides WHERE slide_set_id = ? ORDER BY display_order ASC");
        
        foreach ($activeSets as $set) {
            $stmtSlides->execute([$set['id']]);
            $slides = $stmtSlides->fetchAll();
            injectFocusCoordinates($pdo, $slides);
            $set['slides'] = $slides;
            $allSets[] = $set;
        }
        
        jsonResponse(['sets' => $allSets]);
    } else {
        jsonError('No active slide sets', 404);
    }
    exit;
}

// Ensure user is logged in for all other actions
if (!$isLoggedIn) {
    jsonError('Unauthorized', 401);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // If it's a multipart/form-data request, json_decode php://input won't work for the main body
    // because POST fields are in $_POST. We need to handle both cases.
    if (!empty($_POST)) {
        $data = $_POST;
    } else {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
    }
} else {
    $data = $_GET;
}

require_once 'utils.php';

if ($method === 'GET') {
    if ($action === 'list_sets') {
        $stmt = $pdo->query("SELECT * FROM slide_sets ORDER BY display_order ASC, id ASC");
        jsonResponse(['sets' => $stmt->fetchAll()]);
    } elseif ($action === 'list_slides') {
        $setId = $_GET['set_id'] ?? 0;
        $stmt = $pdo->prepare("SELECT * FROM slides WHERE slide_set_id = ? ORDER BY display_order ASC");
        $stmt->execute([$setId]);
        $slides = $stmt->fetchAll();
        injectFocusCoordinates($pdo, $slides);
        jsonResponse(['slides' => $slides]);
    }
} elseif ($method === 'POST') {
    if ($action === 'create_set') {
        $name = $data['name'] ?? 'New Set';
        $icon = $data['icon'] ?? 'folder';
        $stmt = $pdo->prepare("INSERT INTO slide_sets (name, icon) VALUES (?, ?)");
        $stmt->execute([$name, $icon]);
        jsonResponse(['id' => $pdo->lastInsertId()]);
    } elseif ($action === 'create_slide') {
        $setId = $data['slide_set_id'];
        $type = $data['type'];
        
        $contentObj = ['title' => $data['title'] ?? ''];
        if ($type === 'text') {
            $contentObj['body'] = $data['body'] ?? '';
        } elseif ($type === 'image') {
            $uploadedUrl = handleImageUpload($pdo);
            if ($uploadedUrl) {
                $contentObj['imageUrl'] = $uploadedUrl;
            } elseif (!empty($data['existing_image_url'])) {
                $contentObj['imageUrl'] = $data['existing_image_url'];
            } elseif (!empty($data['imageUrl'])) {
                $contentObj['imageUrl'] = $data['imageUrl'];
            }
            if (isset($data['focusX'])) {
                $contentObj['focusX'] = $data['focusX'];
                $contentObj['focusY'] = $data['focusY'];
            }
            if (isset($data['description'])) {
                $contentObj['description'] = $data['description'];
            }
        } elseif ($type === 'programme') {
            $contentObj['mode'] = $data['mode'] ?? 'next';
            $contentObj['specificDate'] = $data['specificDate'] ?? '';
        }
        $content = json_encode($contentObj);

        $stmt = $pdo->prepare("SELECT MAX(display_order) FROM slides WHERE slide_set_id = ?");
        $stmt->execute([$setId]);
        $order = ($stmt->fetchColumn() ?? 0) + 1;
        
        $stmt = $pdo->prepare("INSERT INTO slides (slide_set_id, type, content, display_order) VALUES (?, ?, ?, ?)");
        $stmt->execute([$setId, $type, $content, $order]);
        jsonResponse(['id' => $pdo->lastInsertId()]);
    } elseif ($action === 'update_slide') {
        $slideId = $data['slide_id'];
        $type = $data['type'];
        
        $contentObj = ['title' => $data['title'] ?? ''];
        if ($type === 'text') {
            $contentObj['body'] = $data['body'] ?? '';
        } elseif ($type === 'image') {
            $uploadedUrl = handleImageUpload($pdo);
            if ($uploadedUrl) {
                $contentObj['imageUrl'] = $uploadedUrl;
            } elseif (!empty($data['existing_image_url'])) {
                $contentObj['imageUrl'] = $data['existing_image_url'];
            } elseif (!empty($data['imageUrl'])) {
                $contentObj['imageUrl'] = $data['imageUrl'];
            }
            if (isset($data['focusX'])) {
                $contentObj['focusX'] = $data['focusX'];
                $contentObj['focusY'] = $data['focusY'];
            }
            if (isset($data['description'])) {
                $contentObj['description'] = $data['description'];
            }
        } elseif ($type === 'programme') {
            $contentObj['mode'] = $data['mode'] ?? 'next';
            $contentObj['specificDate'] = $data['specificDate'] ?? '';
        }
        $content = json_encode($contentObj);

        $stmt = $pdo->prepare("UPDATE slides SET type = ?, content = ? WHERE id = ?");
        $stmt->execute([$type, $content, $slideId]);
        jsonResponse(['message' => 'Success']);
    } elseif ($action === 'set_active') {
        $setId = $data['set_id'];
        
        // Toggle the active status instead of making it the only active set
        $stmt = $pdo->prepare("SELECT is_active FROM slide_sets WHERE id = ?");
        $stmt->execute([$setId]);
        $currentState = $stmt->fetchColumn();
        $newState = $currentState ? 0 : 1;
        
        $stmt = $pdo->prepare("UPDATE slide_sets SET is_active = ? WHERE id = ?");
        $stmt->execute([$newState, $setId]);
        jsonResponse(['message' => 'Success']);
    } elseif ($action === 'reorder_slides') {
        $orderedIds = $data['ordered_ids'] ?? [];
        $order = 1;
        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("UPDATE slides SET display_order = ? WHERE id = ?");
            foreach ($orderedIds as $id) {
                $stmt->execute([$order, $id]);
                $order++;
            }
            $pdo->commit();
            jsonResponse(['message' => 'Success']);
        } catch (PDOException $e) {
            $pdo->rollBack();
            jsonError($e->getMessage());
        }
    } elseif ($action === 'reorder_sets') {
        $orderedIds = $data['ordered_ids'] ?? [];
        $order = 1;
        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("UPDATE slide_sets SET display_order = ? WHERE id = ?");
            foreach ($orderedIds as $id) {
                $stmt->execute([$order, $id]);
                $order++;
            }
            $pdo->commit();
            jsonResponse(['message' => 'Success']);
        } catch (PDOException $e) {
            $pdo->rollBack();
            jsonError($e->getMessage());
        }
    }
} elseif ($method === 'DELETE') {
    if ($action === 'delete_slide') {
        $id = $_GET['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM slides WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['message' => 'Success']);
    }
}
?>
