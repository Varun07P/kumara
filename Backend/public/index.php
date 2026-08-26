<?php

declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\ImageController;
use App\Controllers\SettingController;
use App\Core\Response;
use App\Core\Router;

/**
 * Front controller for all API requests.
 */

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
ini_set('log_errors', '1');

define('BASE_PATH', dirname(__DIR__));

$uploadTempDirectory = BASE_PATH . '/storage/uploads_tmp';

if (!is_dir($uploadTempDirectory)) {
    mkdir($uploadTempDirectory, 0775, true);
}

if (is_dir($uploadTempDirectory) && is_writable($uploadTempDirectory)) {
    ini_set('upload_tmp_dir', $uploadTempDirectory);
}

ob_start();

set_error_handler(
    static function (int $severity, string $message, string $file, int $line): bool {
        if ((error_reporting() & $severity) === 0) {
            return false;
        }

        error_log(sprintf('PHP error [%d]: %s in %s on line %d', $severity, $message, $file, $line));

        throw new \ErrorException($message, 0, $severity, $file, $line);
    }
);

set_exception_handler(
    static function (\Throwable $exception): void {
        logThrowable($exception);
        sendInternalServerErrorResponse();
    }
);

require_once BASE_PATH . '/vendor/autoload.php';

$router = new Router();

$router->post('/api/login', [AuthController::class, 'login']);
$router->post('/api/logout', [AuthController::class, 'logout']);
$router->get('/api/session', [AuthController::class, 'checkSession']);

$router->post('/api/images', [ImageController::class, 'upload']);
$router->get('/api/images', [ImageController::class, 'listAll']);
$router->get('/api/gallery', [ImageController::class, 'listGallery']);
$router->get('/api/featured', [ImageController::class, 'listFeatured']);
$router->put('/api/images/{id}', [ImageController::class, 'updateCaption']);
$router->post('/api/images/{id}/placements', [ImageController::class, 'addPlacement']);
$router->delete('/api/images/{id}/placements/{placement}', [ImageController::class, 'removePlacement']);
$router->delete('/api/images/{id}', [ImageController::class, 'delete']);

$router->get('/api/settings/featured-toggle', [SettingController::class, 'getFeaturedToggle']);
$router->put('/api/settings/featured-toggle', [SettingController::class, 'updateFeaturedToggle']);

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $uri = $_SERVER['REQUEST_URI'] ?? '/';
    $path = resolveApiPath($uri);

    $router->dispatch($method, $path);
} catch (\Throwable $exception) {
    logThrowable($exception);

    Response::error('Internal Server Error', 500);
}

/**
 * Resolves the API path regardless of the public directory's mounted base path.
 */
function resolveApiPath(string $uri): string
{
    $path = (string) (parse_url($uri, PHP_URL_PATH) ?: '/');
    $scriptName = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
    $scriptDirectory = rtrim(str_replace('\\', '/', dirname($scriptName)), '/');

    if ($scriptDirectory !== '' && $scriptDirectory !== '/' && str_starts_with($path, $scriptDirectory)) {
        $path = substr($path, strlen($scriptDirectory));
    }

    $path = '/' . ltrim($path, '/');

    if (!str_starts_with($path, '/api')) {
        $path = '/api' . ($path === '/' ? '' : $path);
    }

    return $path === '' ? '/' : $path;
}

/**
 * Logs a throwable with enough detail for server-side diagnosis.
 */
function logThrowable(\Throwable $exception): void
{
    error_log(sprintf(
        'Uncaught %s: %s in %s on line %d',
        $exception::class,
        $exception->getMessage(),
        $exception->getFile(),
        $exception->getLine()
    ));
    error_log($exception->getTraceAsString());
}

/**
 * Sends a clean generic JSON 500 response when possible.
 */
function sendInternalServerErrorResponse(): never
{
    if (!headers_sent()) {
        if (ob_get_level() > 0 && ob_get_length() !== false) {
            ob_clean();
        }

        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode([
            'error' => [
                'message' => 'Internal Server Error',
                'status' => 500,
            ],
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    exit;
}
