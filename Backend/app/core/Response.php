<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Sends consistent JSON API responses.
 */
final class Response
{
    private function __construct()
    {
    }

    /**
     * Sends a JSON response and terminates the request.
     *
     * @param array<string, mixed> $data
     */
    public static function json(array $data, int $statusCode = 200): never
    {
        if (ob_get_level() > 0 && ob_get_length() !== false) {
            ob_clean();
        }

        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Sends a JSON success response and terminates the request.
     *
     * @param array<string, mixed> $data
     */
    public static function success(array $data = [], int $statusCode = 200): never
    {
        self::json($data, $statusCode);
    }

    /**
     * Sends a JSON error response and terminates the request.
     */
    public static function error(string $message, int $statusCode = 400): never
    {
        self::json([
            'error' => [
                'message' => $message,
                'status' => $statusCode,
            ],
        ], $statusCode);
    }
}
