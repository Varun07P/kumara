<?php

declare(strict_types=1);

/**
 * Same-origin API bridge.
 *
 * This file lets the static frontend call /api/... while reusing the existing
 * backend application located in Backend/public. It also serves compressed
 * upload assets through /api/storage/uploads/compressed/{filename}.
 */

$requestPath = (string) (parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');

if (str_starts_with($requestPath, '/api/storage/uploads/compressed/')) {
    serveCompressedUpload($requestPath);
}

require dirname(__DIR__) . '/Backend/public/index.php';

/**
 * Serves a compressed uploaded image by safe basename only.
 */
function serveCompressedUpload(string $requestPath): never
{
    $filename = basename(rawurldecode($requestPath));

    if (!preg_match('/^[a-f0-9]{32}\.(?:jpg|jpeg|png|webp)$/i', $filename)) {
        http_response_code(404);
        exit;
    }

    $filePath = dirname(__DIR__) . '/Backend/public/storage/uploads/compressed/' . $filename;

    if (!is_file($filePath) || !is_readable($filePath)) {
        http_response_code(404);
        exit;
    }

    $extension = strtolower((string) pathinfo($filePath, PATHINFO_EXTENSION));
    $contentTypes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
    ];

    header('Content-Type: ' . ($contentTypes[$extension] ?? 'application/octet-stream'));
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: public, max-age=31536000, immutable');
    header('Content-Length: ' . filesize($filePath));

    readfile($filePath);
    exit;
}
