<?php
// ============================================================
//  MercadoPago — Crear preferencia de pago
//  Este archivo va en Bluehost (raíz del sitio).
//
//  Instalación en Bluehost:
//    1. Subir todos los archivos del sitio por FTP o File Manager
//    2. Desde el File Manager o SSH, instalar Composer:
//       curl -sS https://getcomposer.org/installer | php
//       php composer.phar require mercadopago/dx-php
//    3. Reemplazar MP_ACCESS_TOKEN con tu token real
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
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

require_once __DIR__ . '/vendor/autoload.php';

use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\MercadoPagoConfig;

// ---- REEMPLAZAR con tu Access Token de producción ----
MercadoPagoConfig::setAccessToken('APP_USR-7634223680689579-032917-70c522dfd66ce90169590c50a72d7614-3302020268');

// ---- Precio oficial (nunca confiar en el cliente) ----
$PRICE_LIST = [
    '1' => ['name' => 'iPhone 16 Pro Max',   'price' => 10],
    '2' => ['name' => 'iPhone 16',           'price' => 999 ],
    '3' => ['name' => 'iPad Pro M4',         'price' => 1099],
    '4' => ['name' => 'Apple Watch Ultra 2', 'price' => 799 ],
    '5' => ['name' => 'AirPods Pro 2',       'price' => 249 ],
    '6' => ['name' => 'MacBook Air M3',      'price' => 1099],
    '7' => ['name' => 'Funda de Silicona',   'price' => 49  ],
    '8' => ['name' => 'Cargador MagSafe',    'price' => 39  ],
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

try {
    $client = new PreferenceClient();

    // Reemplazar con tu dominio real en Bluehost
    $domain = 'https://layoutprueba.com';

    $preference = $client->create([
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
        'auto_return'        => 'approved',
        'statement_descriptor' => 'iPlace',
    ]);

    echo json_encode([
        'preferenceId' => $preference->id,
        'init_point'   => $preference->init_point,
    ]);

} catch (Exception $e) {
    error_log('MercadoPago error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error al procesar el pago']);
}
