<?php
require_once 'config.php';
require_once 'utils.php';

$method = $_SERVER['REQUEST_METHOD'];

// Ensure users table check logic works (it was failing earlier because NCO management requires users or a new ncos table)
// Wait, the prompt says "Create an `ncos` schema or add specific metadata fields to user profiles". Let's create an `ncos` table since it's simpler and decouple from user logins.
$pdo->exec("CREATE TABLE IF NOT EXISTS ncos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rank TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
)");

$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM ncos ORDER BY sort_order ASC, rank, name");
    jsonResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

requirePermission($pdo, 'edit_programme'); // Only those who can edit the programme can manage NCOs

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'reorder') {
        if (!isset($data['ordered_ids']) || !is_array($data['ordered_ids'])) {
            jsonError('ordered_ids array required');
        }
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("UPDATE ncos SET sort_order = ? WHERE id = ?");
            foreach ($data['ordered_ids'] as $index => $id) {
                $stmt->execute([$index, $id]);
            }
            $pdo->commit();
            jsonResponse(['success' => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Database error', 500);
        }
    }

    if (!isset($data['name']) || !isset($data['rank'])) {
        jsonError('Name and rank required');
    }

    $stmt = $pdo->prepare("INSERT INTO ncos (name, rank) VALUES (?, ?)");
    $stmt->execute([trim($data['name']), trim($data['rank'])]);
    jsonResponse(['id' => $pdo->lastInsertId()]);
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['id']) || !isset($data['name']) || !isset($data['rank'])) {
        jsonError('ID, name, and rank required');
    }

    $stmt = $pdo->prepare("UPDATE ncos SET name = ?, rank = ? WHERE id = ?");
    $stmt->execute([trim($data['name']), trim($data['rank']), $data['id']]);
    jsonResponse(['success' => true]);
}

if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['id'])) {
        jsonError('ID required');
    }

    $stmt = $pdo->prepare("DELETE FROM ncos WHERE id = ?");
    $stmt->execute([$data['id']]);
    jsonResponse(['success' => true]);
}

jsonError('Method not allowed', 405);
