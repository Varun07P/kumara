<?php

declare(strict_types=1);

/**
 * Local development router for PHP's built-in server.
 *
 * Apache/XAMPP and BigRock use .htaccess instead. This file is only for running
 * the whole site same-origin with:
 * php -S 127.0.0.1:8000 router.php
 */

$path = (string) (parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
$filePath = __DIR__ . str_replace('/', DIRECTORY_SEPARATOR, rawurldecode($path));

if ($path !== '/' && is_file($filePath)) {
    return false;
}

if (str_starts_with($path, '/api/')) {
    require __DIR__ . '/api/index.php';
    return true;
}

return false;
