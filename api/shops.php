<?php
// api/shops.php - Shop Management API
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

function mapShopRow($r) {
    if (!$r) return null;
    return [
        'id' => $r['id'],
        'name' => $r['name'],
        'owner' => $r['owner'],
        'whatsapp' => $r['whatsapp'],
        'upiId' => $r['upi_id'] ?? '',
        'address' => $r['address'],
        'state' => $r['state'],
        'referral' => $r['referral'] ?? null,
        'priceBw' => (float)$r['price_bw'],
        'priceColor' => (float)$r['price_color'],
        'doubleDiscount' => (float)$r['double_discount'],
        'priceSpiral' => (float)$r['price_spiral'],
        'priceStaple' => (float)$r['price_staple'],
        'priceLamination' => (float)$r['price_lamination'],
        'acceptUploads' => (bool)$r['accept_uploads'],
        'showWhatsapp' => (bool)$r['show_whatsapp'],
        'createdAt' => $r['created_at'],
    ];
}

// GET - Read Shop
if ($method === 'GET') {
    // 1. Get My Shop (for dashboard)
    if (isset($_GET['my_shop'])) {
        $user = getAuthUser($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['shop' => null]);
            exit();
        }
        $stmt = $pdo->prepare('SELECT * FROM shops WHERE owner_id = ? LIMIT 1');
        $stmt->execute([$user['id']]);
        $row = $stmt->fetch();
        echo json_encode(['shop' => mapShopRow($row)]);
        exit();
    }

    // 2. Get Public Shop by slug ID
    $slug = trim($_GET['id'] ?? $_GET['slug'] ?? '');
    if ($slug !== '') {
        $stmt = $pdo->prepare('SELECT * FROM shops WHERE id = ? LIMIT 1');
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['shop' => null, 'error' => 'Shop not found']);
            exit();
        }
        echo json_encode(['shop' => mapShopRow($row)]);
        exit();
    }

    // 3. Search public shops
    $q = trim($_GET['q'] ?? '');
    if ($q !== '') {
        $stmt = $pdo->prepare('SELECT * FROM shops WHERE name LIKE ? OR address LIKE ? ORDER BY created_at DESC LIMIT 20');
        $stmt->execute(["%$q%", "%$q%"]);
    } else {
        $stmt = $pdo->query('SELECT * FROM shops ORDER BY created_at DESC LIMIT 20');
    }
    $rows = $stmt->fetchAll();
    echo json_encode(['shops' => array_map('mapShopRow', $rows)]);
    exit();
}

// POST - Register Shop
if ($method === 'POST') {
    $user = getAuthUser($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Please sign in first']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $name = trim($input['name'] ?? '');
    $owner = trim($input['owner'] ?? $user['display_name']);
    $whatsapp = trim($input['whatsapp'] ?? '');
    $address = trim($input['address'] ?? '');
    $state = trim($input['state'] ?? '');
    $referral = trim($input['referral'] ?? '') ?: null;

    if ($name === '' || $whatsapp === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Shop name and WhatsApp are required']);
        exit();
    }

    // Generate clean slug
    $baseSlug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));
    if (!$baseSlug) $baseSlug = 'shop';
    $slug = substr($baseSlug, 0, 40);

    // Check slug uniqueness
    $stmt = $pdo->prepare('SELECT id FROM shops WHERE id = ?');
    $stmt->execute([$slug]);
    if ($stmt->fetch()) {
        $slug = $slug . '-' . substr(bin2hex(random_bytes(2)), 0, 4);
    }

    $stmt = $pdo->prepare('INSERT INTO shops (id, owner_id, name, owner, whatsapp, address, state, referral) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$slug, $user['id'], $name, $owner, $whatsapp, $address, $state, $referral]);

    $stmt = $pdo->prepare('SELECT * FROM shops WHERE id = ?');
    $stmt->execute([$slug]);
    echo json_encode(['shop' => mapShopRow($stmt->fetch())]);
    exit();
}

// PUT - Update Shop Profile & Rates
if ($method === 'PUT') {
    $user = getAuthUser($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = trim($input['id'] ?? '');

    // Verify ownership
    $stmt = $pdo->prepare('SELECT id FROM shops WHERE id = ? AND owner_id = ?');
    $stmt->execute([$id, $user['id']]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not own this shop']);
        exit();
    }

    $stmt = $pdo->prepare('UPDATE shops SET
        name = ?, owner = ?, whatsapp = ?, upi_id = ?, address = ?, state = ?,
        price_bw = ?, price_color = ?, double_discount = ?, price_spiral = ?,
        price_staple = ?, price_lamination = ?, accept_uploads = ?, show_whatsapp = ?
        WHERE id = ?');
    $stmt->execute([
        $input['name'] ?? '',
        $input['owner'] ?? '',
        $input['whatsapp'] ?? '',
        $input['upiId'] ?? '',
        $input['address'] ?? '',
        $input['state'] ?? '',
        (float)($input['priceBw'] ?? 2),
        (float)($input['priceColor'] ?? 10),
        (float)($input['doubleDiscount'] ?? 0.25),
        (float)($input['priceSpiral'] ?? 30),
        (float)($input['priceStaple'] ?? 5),
        (float)($input['priceLamination'] ?? 20),
        isset($input['acceptUploads']) ? (int)$input['acceptUploads'] : 1,
        isset($input['showWhatsapp']) ? (int)$input['showWhatsapp'] : 1,
        $id,
    ]);

    echo json_encode(['success' => true]);
    exit();
}
