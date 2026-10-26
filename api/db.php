<?php
// api/db.php - Hostinger Database Handler with Zero-Config Fallback
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$pdo = null;
$configFile = __DIR__ . '/config.php';

// 1. Check if MySQL is configured
if (file_exists($configFile)) {
    require_once $configFile;
    if (defined('DB_NAME') && DB_NAME !== '' && DB_NAME !== 'your_database_name') {
        try {
            $host = defined('DB_HOST') ? DB_HOST : 'localhost';
            $pdo = new PDO("mysql:host={$host};dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            // MySQL configured but connection failed; log error and fallback to SQLite
            error_log("Printex MySQL connection failed: " . $e->getMessage());
        }
    }
}

// 2. Zero-Config SQLite Fallback (Runs instantly out of the box on Hostinger without manual DB setup)
if (!$pdo) {
    try {
        $sqlitePath = __DIR__ . '/.printex.db';
        $isNew = !file_exists($sqlitePath);
        $pdo = new PDO("sqlite:" . $sqlitePath, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        if ($isNew || filesize($sqlitePath) < 100) {
            initDatabaseSchema($pdo);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database initialization failed: ' . $e->getMessage()]);
        exit();
    }
}

function initDatabaseSchema($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(191) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        token VARCHAR(255) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS shops (
        id VARCHAR(64) PRIMARY KEY,
        owner_id VARCHAR(64) NOT NULL,
        name VARCHAR(191) NOT NULL,
        owner VARCHAR(100) NOT NULL,
        whatsapp VARCHAR(20) NOT NULL,
        upi_id VARCHAR(100) DEFAULT '',
        address TEXT NOT NULL,
        state VARCHAR(100) NOT NULL,
        referral VARCHAR(50) DEFAULT NULL,
        price_bw REAL NOT NULL DEFAULT 2.00,
        price_color REAL NOT NULL DEFAULT 10.00,
        double_discount REAL NOT NULL DEFAULT 0.25,
        price_spiral REAL NOT NULL DEFAULT 30.00,
        price_staple REAL NOT NULL DEFAULT 5.00,
        price_lamination REAL NOT NULL DEFAULT 20.00,
        accept_uploads INTEGER NOT NULL DEFAULT 1,
        show_whatsapp INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        token_no VARCHAR(10) NOT NULL,
        shop_id VARCHAR(64) NOT NULL,
        customer VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) DEFAULT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        pages INTEGER NOT NULL DEFAULT 1,
        copies INTEGER NOT NULL DEFAULT 1,
        color VARCHAR(20) NOT NULL DEFAULT 'bw',
        sides VARCHAR(20) NOT NULL DEFAULT 'single',
        paper_size VARCHAR(20) NOT NULL DEFAULT 'A4',
        binding VARCHAR(30) NOT NULL DEFAULT 'none',
        page_range VARCHAR(100) NOT NULL DEFAULT 'all',
        amount REAL NOT NULL DEFAULT 0.00,
        payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )");
}

// Helper to authenticate request via Bearer token, query param, or cookie
function getAuthUser($pdo) {
    $token = null;

    // Check Authorization header in multiple server variables (LiteSpeed / FastCGI compatible)
    $auth = '';
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    if (!$auth && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (!$auth && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    if ($auth && preg_match('/Bearer\s+(\S+)/i', $auth, $matches)) {
        $token = $matches[1];
    }

    // Fallback to query param, post body, or cookie
    if (!$token) {
        $token = $_GET['token'] ?? $_POST['token'] ?? $_COOKIE['printex_token'] ?? null;
    }

    if (!$token) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id, email, display_name FROM users WHERE token = ? LIMIT 1');
    $stmt->execute([$token]);
    return $stmt->fetch() ?: null;
}
