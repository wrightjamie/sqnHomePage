<?php
require_once 'config.php';
require_once 'utils.php';

$method = $_SERVER['REQUEST_METHOD'];

// Ensure documents schema
$pdo->exec("CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    issue_number TEXT DEFAULT '1.0',
    issue_date DATE,
    history TEXT DEFAULT '[]',
    slug TEXT UNIQUE
)");

// Migration to add slug column if it doesn't exist
try {
    $pdo->exec("ALTER TABLE documents ADD COLUMN slug TEXT UNIQUE");
} catch (PDOException $e) {
    // Column might already exist, ignore
}

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM documents WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        $doc = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($doc) {
            $doc['history'] = json_decode($doc['history'], true) ?? [];
            jsonResponse($doc);
        }
        jsonError('Document not found', 404);
    } elseif (isset($_GET['slug'])) {
        $stmt = $pdo->prepare("SELECT * FROM documents WHERE slug = ?");
        $stmt->execute([$_GET['slug']]);
        $doc = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($doc) {
            $doc['history'] = json_decode($doc['history'], true) ?? [];
            jsonResponse($doc);
        }
        jsonError('Document not found', 404);
    } else {
        $stmt = $pdo->query("SELECT id, title, issue_number, issue_date, slug FROM documents ORDER BY title ASC");
        jsonResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}

requirePermission($pdo, 'manage_settings'); // Reusing existing admin permission

function generateUniqueSlug($pdo, $slug, $excludeId = null) {
    if (empty($slug)) $slug = 'doc';
    $originalSlug = $slug;
    $count = 1;
    while (true) {
        if ($excludeId) {
            $stmt = $pdo->prepare("SELECT id FROM documents WHERE slug = ? AND id != ?");
            $stmt->execute([$slug, $excludeId]);
        } else {
            $stmt = $pdo->prepare("SELECT id FROM documents WHERE slug = ?");
            $stmt->execute([$slug]);
        }
        if (!$stmt->fetch()) break;
        $slug = $originalSlug . '-' . $count;
        $count++;
    }
    return $slug;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['title']) || !isset($data['content'])) {
        jsonError('Title and content required');
    }

    $issueNumber = $data['issue_number'] ?? '1.0';
    $issueDate = date('Y-m-d');

    $slugInput = !empty($data['slug']) ? $data['slug'] : trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($data['title'])), '-');
    $slug = generateUniqueSlug($pdo, $slugInput);

    $history = [];
    if (!empty($data['summary'])) {
        $history[] = [
            'issue_number' => $issueNumber,
            'issue_date' => $issueDate,
            'summary' => $data['summary']
        ];
    }

    $stmt = $pdo->prepare("INSERT INTO documents (title, content, issue_number, issue_date, history, slug) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        trim($data['title']),
        trim($data['content']),
        $issueNumber,
        $issueDate,
        json_encode($history),
        $slug
    ]);

    jsonResponse(['id' => $pdo->lastInsertId(), 'slug' => $slug]);
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['id']) || !isset($data['title']) || !isset($data['content'])) {
        jsonError('ID, title, and content required');
    }

    // Fetch old to see if issue number changed
    $stmt = $pdo->prepare("SELECT issue_number, history FROM documents WHERE id = ?");
    $stmt->execute([$data['id']]);
    $oldDoc = $stmt->fetch(PDO::FETCH_ASSOC);

    $issueNumber = $data['issue_number'] ?? $oldDoc['issue_number'];
    $issueDate = $data['issue_date'] ?? date('Y-m-d');
    $history = json_decode($oldDoc['history'], true) ?? [];

    $slugInput = !empty($data['slug']) ? $data['slug'] : trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($data['title'])), '-');
    $slug = generateUniqueSlug($pdo, $slugInput, $data['id']);

    if ($issueNumber !== $oldDoc['issue_number']) {
        $issueDate = date('Y-m-d'); // Auto update date on version bump
        if (!empty($data['summary'])) {
            $history[] = [
                'issue_number' => $issueNumber,
                'issue_date' => $issueDate,
                'summary' => $data['summary']
            ];
        }
    }

    $stmt = $pdo->prepare("UPDATE documents SET title = ?, content = ?, issue_number = ?, issue_date = ?, history = ?, slug = ? WHERE id = ?");
    $stmt->execute([
        trim($data['title']),
        trim($data['content']),
        $issueNumber,
        $issueDate,
        json_encode($history),
        $slug,
        $data['id']
    ]);

    jsonResponse(['success' => true]);
}

if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['id'])) {
        jsonError('ID required');
    }

    $stmt = $pdo->prepare("DELETE FROM documents WHERE id = ?");
    $stmt->execute([$data['id']]);
    jsonResponse(['success' => true]);
}

jsonError('Method not allowed', 405);
