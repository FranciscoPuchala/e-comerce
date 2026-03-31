<?php
// ============================================================
//  MercadoPago — Crear preferencia de pago
//  Sin dependencias externas, usa curl nativo de PHP.
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ---- Access Token ----
$ACCESS_TOKEN = 'APP_USR-1059284618059671-032917-e5c98e4edfdb5bb3ae36726e14676066-459903372';

// ---- Precio oficial del servidor (nunca confiar en el cliente) ----
$PRICE_LIST = [
    '1' => ['name' => 'iPhone 16 Pro Max',   'price' => 10],
    '2' => ['name' => 'iPhone 16',           'price' => 999],
    '3' => ['name' => 'iPad Pro M4',         'price' => 1099],
    '4' => ['name' => 'Apple Watch Ultra 2', 'price' => 799],
    '5' => ['name' => 'AirPods Pro 2',       'price' => 249],
    '6' => ['name' => 'MacBook Air M3',      'price' => 1099],
    '7' => ['name' => 'Funda de Silicona',   'price' => 49],
    '8' => ['name' => 'Cargador MagSafe',    'price' => 39],
];

$body    = json_decode(file_get_contents('php://input'), true);
$items   = $body['items']   ?? [];
$payer   = $body['payer']   ?? [];
$orderId = $body['orderId'] ?? '';

if (empty($items) || empty($payer['email']) || empty($orderId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos incompletos']);
    exit;
}

// Validar y construir items con precios del servidor
$mpItems = [];
foreach ($items as $item) {
    $id  = (string)($item['id'] ?? '');
    $qty = (int)($item['quantity'] ?? 0);

    if (!isset($PRICE_LIST[$id]) || $qty < 1 || $qty > 99) {
        http_response_code(400);
        echo json_encode(['error' => "Producto inválido: $id"]);
        exit;
    }

    $mpItems[] = [
        'id'          => $id,
        'title'       => $PRICE_LIST[$id]['name'],
        'unit_price'  => (float)$PRICE_LIST[$id]['price'],
        'quantity'    => $qty,
        'currency_id' => 'ARS',
    ];
}

// ---- Llamar a la API de MercadoPago con curl ----
$domain = 'https://layoutprueba.com';

$payload = [
    'items'              => $mpItems,
    'payer'              => [
        'name'    => $payer['name']    ?? '',
        'surname' => $payer['surname'] ?? '',
        'email'   => $payer['email'],
    ],
    'external_reference' => $orderId,
    'back_urls'          => [
        'success' => "$domain/Checkout/success.html",
        'failure' => "$domain/Checkout/failure.html",
        'pending' => "$domain/Checkout/pending.html",
    ],
    'auto_return' => 'approved',
    'statement_descriptor' => 'iPlace',
];

$ch = curl_init('https://api.mercadopago.com/checkout/preferences');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $ACCESS_TOKEN,
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 201) {
    error_log('MercadoPago error: ' . $response);
    http_response_code(500);
    echo json_encode(['error' => 'Error al crear preferencia de pago']);
    exit;
}

$data = json_decode($response, true);

echo json_encode([
    'preferenceId' => $data['id'],
    'init_point'   => $data['init_point'],
]);
