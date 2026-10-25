<?php
// api/upload.php - Direct File Upload to Hostinger Storage
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$shopId = trim($_POST['shop_id'] ?? '');
$customer = trim($_POST['customer'] ?? '');
$customerPhone = trim($_POST['customer_phone'] ?? '');
$pages = (int)($_POST['pages'] ?? 1);
$copies = (int)($_POST['copies'] ?? 1);
$color = trim($_POST['color'] ?? 'bw');
$sides = trim($_POST['sides'] ?? 'single');
$paperSize = trim($_POST['paper_size'] ?? 'A4');
$binding = trim($_POST['binding'] ?? 'none');
$pageRange = trim($_POST['page_range'] ?? 'all');
$amount = (float)($_POST['amount'] ?? 0);
$tokenNo = trim($_POST['token_no'] ?? (string)rand(1000, 9999));

if (!$shopId || !$customer) {
    http_response_code(400);
    echo json_encode(['error' => 'Shop ID and Customer name are required']);
    exit();
}

// Verify shop exists and is accepting uploads
$stmt = $pdo->prepare('SELECT id, accept_uploads FROM shops WHERE id = ?');
$stmt->execute([$shopId]);
$shop = $stmt->fetch();
if (!$shop) {
    http_response_code(404);
    echo json_encode(['error' => 'Shop not found']);
    exit();
}
if (!$shop['accept_uploads']) {
    http_response_code(400);
    echo json_encode(['error' => 'This shop is not accepting uploads right now']);
    exit();
}

// Validate uploaded file
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    $errCode = $_FILES['file']['error'] ?? 'missing';
    echo json_encode(['error' => 'File upload error: code ' . $errCode]);
    exit();
}

$file = $_FILES['file'];
$fileName = basename($file['name']);
$cleanName = preg_replace('/[^\w.\-]+/', '_', $fileName);

// Create upload directory on Hostinger: uploads/{shopId}/
$uploadDir = dirname(__DIR__) . '/uploads/' . $shopId;
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$uniqueFileName = bin2hex(random_bytes(8)) . '-' . $cleanName;
$targetPath = $uploadDir . '/' . $uniqueFileName;
$relativeStoragePath = $shopId . '/' . $uniqueFileName;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save file on Hostinger storage']);
    exit();
}

$orderId = 'ORD-' . strtoupper(bin2hex(random_bytes(3)));

$stmt = $pdo->prepare('INSERT INTO orders (
    id, token_no, shop_id, customer, customer_phone, file_name, file_path,
    pages, copies, color, sides, paper_size, binding, page_range, amount, status
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

$stmt->execute([
    $orderId,
    $tokenNo,
    $shopId,
    $customer,
    $customerPhone ?: null,
    $fileName,
    $relativeStoragePath,
    $pages,
    $copies,
    $color,
    $sides,
    $paperSize,
    $binding,
    $pageRange,
    $amount,
    'pending'
]);

echo json_encode([
    'success' => true,
    'order' => [
        'id' => $orderId,
        'tokenNo' => $tokenNo,
        'amount' => $amount,
        'fileName' => $fileName,
    ]
]);
