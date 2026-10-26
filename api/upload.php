<?php
// api/upload.php - Pure Hostinger Disk Storage Endpoint for Print Documents
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$action = $_GET['action'] ?? '';

// 1. Download file action
if ($action === 'download' || $_SERVER['REQUEST_METHOD'] === 'GET') {
    $path = trim($_GET['path'] ?? '');
    $customName = trim($_GET['name'] ?? '');

    if (!$path) {
        http_response_code(400);
        die('File path is required');
    }

    // Security: sanitize path to prevent directory traversal
    $safePath = str_replace(['..', "\0"], '', $path);
    $fullPath = dirname(__DIR__) . '/uploads/' . ltrim($safePath, '/');

    if (!file_exists($fullPath) || is_dir($fullPath)) {
        http_response_code(404);
        die('File not found on Hostinger storage');
    }

    $fileName = $customName ?: basename($fullPath);
    $mime = mime_content_type($fullPath) ?: 'application/octet-stream';

    header('Content-Description: File Transfer');
    header('Content-Type: ' . $mime);
    header('Content-Disposition: inline; filename="' . basename($fileName) . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($fullPath));
    readfile($fullPath);
    exit();
}

// 2. Delete file action
if ($action === 'delete') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $path = trim($input['path'] ?? $_POST['path'] ?? $_GET['path'] ?? '');

    if ($path) {
        $safePath = str_replace(['..', "\0"], '', $path);
        $fullPath = dirname(__DIR__) . '/uploads/' . ltrim($safePath, '/');
        if (file_exists($fullPath) && is_file($fullPath)) {
            @unlink($fullPath);
        }
    }

    echo json_encode(['success' => true]);
    exit();
}

// 3. Upload file action
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $shopId = trim($_POST['shop_id'] ?? 'general');
    $safeShopId = preg_replace('/[^A-Za-z0-9_-]+/', '_', $shopId);

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        $err = $_FILES['file']['error'] ?? 'no file';
        echo json_encode(['error' => 'File upload error: code ' . $err]);
        exit();
    }

    $file = $_FILES['file'];
    $fileName = basename($file['name']);
    $cleanName = preg_replace('/[^\w.\-]+/', '_', $fileName);

    $uploadDir = dirname(__DIR__) . '/uploads/' . $safeShopId;
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $uniqueName = bin2hex(random_bytes(6)) . '-' . $cleanName;
    $targetPath = $uploadDir . '/' . $uniqueName;
    $storagePath = $safeShopId . '/' . $uniqueName;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not save file on Hostinger storage']);
        exit();
    }

    echo json_encode([
        'success' => true,
        'filePath' => $storagePath,
        'fileName' => $fileName,
        'url' => '/uploads/' . $storagePath,
    ]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
