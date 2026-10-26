<?php
// api/auth.php - Authentication API for Shop Owners
require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

if ($action === 'signup') {
    $email = trim(strtolower($input['email'] ?? ''));
    $password = $input['password'] ?? '';
    $name = trim($input['display_name'] ?? $input['name'] ?? explode('@', $email)[0]);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email address']);
        exit();
    }
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        exit();
    }

    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'An account with this email already exists']);
        exit();
    }

    $userId = 'usr_' . bin2hex(random_bytes(12));
    $token = bin2hex(random_bytes(32));
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare('INSERT INTO users (id, email, password_hash, display_name, token) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$userId, $email, $hash, $name, $token]);

    @setcookie('printex_token', $token, time() + 86400 * 30, '/');

    echo json_encode([
        'user' => ['id' => $userId, 'email' => $email, 'display_name' => $name],
        'token' => $token,
    ]);
    exit();
}

if ($action === 'signin') {
    $email = trim(strtolower($input['email'] ?? ''));
    $password = $input['password'] ?? '';

    $stmt = $pdo->prepare('SELECT id, email, password_hash, display_name FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        exit();
    }

    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare('UPDATE users SET token = ? WHERE id = ?');
    $stmt->execute([$token, $user['id']]);

    @setcookie('printex_token', $token, time() + 86400 * 30, '/');

    echo json_encode([
        'user' => ['id' => $user['id'], 'email' => $user['email'], 'display_name' => $user['display_name']],
        'token' => $token,
    ]);
    exit();
}

if ($action === 'me') {
    $user = getAuthUser($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['user' => null]);
        exit();
    }
    echo json_encode(['user' => $user]);
    exit();
}

if ($action === 'signout') {
    $user = getAuthUser($pdo);
    if ($user) {
        $stmt = $pdo->prepare('UPDATE users SET token = NULL WHERE id = ?');
        $stmt->execute([$user['id']]);
    }
    @setcookie('printex_token', '', time() - 3600, '/');
    echo json_encode(['success' => true]);
    exit();
}

http_response_code(404);
echo json_encode(['error' => 'Action not found']);
