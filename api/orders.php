<?php
// api/orders.php - Order Management & File Delivery on Hostinger
require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// 1. File Download Handler
if ($action === 'download') {
    $id = trim($_GET['id'] ?? '');
    if (!$id) {
        http_response_code(400);
        die('Order ID is required');
    }

    $stmt = $pdo->prepare('SELECT file_name, file_path FROM orders WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $order = $stmt->fetch();

    if (!$order) {
        http_response_code(404);
        die('Order not found');
    }

    $safePath = str_replace(['..', "\0"], '', $order['file_path']);
    $fullPath = dirname(__DIR__) . '/uploads/' . $safePath;

    if (!file_exists($fullPath)) {
        http_response_code(404);
        die('File not found on Hostinger storage');
    }

    $mime = mime_content_type($fullPath) ?: 'application/octet-stream';
    header('Content-Description: File Transfer');
    header('Content-Type: ' . $mime);
    header('Content-Disposition: attachment; filename="' . basename($order['file_name']) . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($fullPath));
    readfile($fullPath);
    exit();
}

// 2. Update Order Status
if ($action === 'status' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = trim($input['id'] ?? '');
    $status = trim($input['status'] ?? '');

    $validStatuses = ['pending', 'printing', 'ready', 'collected'];
    if (!$id || !in_array($status, $validStatuses, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid order ID or status']);
        exit();
    }

    $stmt = $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?');
    $stmt->execute([$status, $id]);

    echo json_encode(['success' => true]);
    exit();
}

// 3. Delete Order & Associated Physical File
if ($action === 'delete' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = trim($input['id'] ?? '');

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Order ID is required']);
        exit();
    }

    $stmt = $pdo->prepare('SELECT file_path FROM orders WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $order = $stmt->fetch();

    if ($order && !empty($order['file_path'])) {
        $safePath = str_replace(['..', "\0"], '', $order['file_path']);
        $fullPath = dirname(__DIR__) . '/uploads/' . $safePath;
        if (file_exists($fullPath)) {
            @unlink($fullPath);
        }
    }

    $stmt = $pdo->prepare('DELETE FROM orders WHERE id = ?');
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);
    exit();
}

// 4. List Orders for Shop
if ($method === 'GET') {
    $shopId = trim($_GET['shop_id'] ?? '');
    if (!$shopId) {
        http_response_code(400);
        echo json_encode(['error' => 'shop_id parameter is required']);
        exit();
    }

    $stmt = $pdo->prepare('SELECT * FROM orders WHERE shop_id = ? ORDER BY created_at DESC');
    $stmt->execute([$shopId]);
    $rows = $stmt->fetchAll();

    $orders = array_map(function($r) {
        return [
            'id' => (string)$r['id'],
            'tokenNo' => (string)($r['token_no'] ?: substr((string)$r['id'], -4)),
            'shopId' => (string)$r['shop_id'],
            'customer' => (string)$r['customer'],
            'customerPhone' => $r['customer_phone'] ? (string)$r['customer_phone'] : null,
            'fileName' => (string)$r['file_name'],
            'storagePath' => (string)$r['file_path'],
            'pages' => (int)($r['pages'] ?? 1),
            'copies' => (int)($r['copies'] ?? 1),
            'color' => (string)($r['color'] ?? 'bw'),
            'sides' => (string)($r['sides'] ?? 'single'),
            'paperSize' => (string)($r['paper_size'] ?? 'A4'),
            'binding' => (string)($r['binding'] ?? 'none'),
            'pageRange' => (string)($r['page_range'] ?? 'all'),
            'amount' => (float)($r['amount'] ?? 0),
            'paymentStatus' => (string)($r['payment_status'] ?? 'pending'),
            'status' => (string)($r['status'] ?? 'pending'),
            'createdAt' => (string)$r['created_at'],
        ];
    }, $rows);

    echo json_encode(['orders' => $orders]);
    exit();
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint not found']);
