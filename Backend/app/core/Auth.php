<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Provides reusable session authentication checks for protected API actions.
 */
final class Auth
{
    private const SESSION_COOKIE_PATH = '/';
    private const SESSION_COOKIE_SAMESITE = 'Lax';
    private const SESSION_STORAGE_DIRECTORY = '/storage/sessions';

    private function __construct()
    {
    }

    /**
     * Requires an authenticated administrator session.
     */
    public static function requireAuth(): void
    {
        self::startSession();

        if (!self::isAuthenticated()) {
            Response::error('Unauthorized', 401);
        }
    }

    /**
     * Determines whether the current request has an authenticated administrator session.
     */
    public static function isAuthenticated(): bool
    {
        self::startSession();

        return isset($_SESSION['admin_id']) && is_numeric($_SESSION['admin_id']);
    }

    /**
     * Starts the PHP session if it is not already active.
     */
    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        if (headers_sent($file, $line)) {
            error_log(sprintf('Cannot start session because headers were already sent in %s on line %d.', $file, $line));
            Response::error('Internal Server Error', 500);
        }

        self::configureSessionStorage();
        self::configureSessionCookie();

        if (!session_start()) {
            error_log('Failed to start PHP session.');
            Response::error('Internal Server Error', 500);
        }
    }

    /**
     * Destroys the active session and expires the client-side session cookie.
     */
    public static function destroySession(): void
    {
        self::startSession();

        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();

            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params['path'] ?: self::SESSION_COOKIE_PATH,
                'domain' => $params['domain'] ?? '',
                'secure' => (bool) ($params['secure'] ?? false),
                'httponly' => (bool) ($params['httponly'] ?? true),
                'samesite' => (string) ($params['samesite'] ?? self::SESSION_COOKIE_SAMESITE),
            ]);
        }

        session_destroy();
    }

    /**
     * Configures secure session cookie defaults before the session starts.
     */
    private static function configureSessionCookie(): void
    {
        $isHttps = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== '' && $_SERVER['HTTPS'] !== 'off';

        session_set_cookie_params([
            'lifetime' => 0,
            'path' => self::SESSION_COOKIE_PATH,
            'domain' => '',
            // Keep false for local HTTP development. This must be true in production over HTTPS.
            'secure' => $isHttps,
            'httponly' => true,
            'samesite' => self::SESSION_COOKIE_SAMESITE,
        ]);
    }

    /**
     * Configures a private writable session storage directory for the API.
     */
    private static function configureSessionStorage(): void
    {
        $sessionPath = dirname(__DIR__, 2) . self::SESSION_STORAGE_DIRECTORY;

        if (!is_dir($sessionPath) && !mkdir($sessionPath, 0775, true) && !is_dir($sessionPath)) {
            error_log(sprintf('Failed to create session storage directory: %s', $sessionPath));
            Response::error('Internal Server Error', 500);
        }

        if (!is_writable($sessionPath)) {
            error_log(sprintf('Session storage directory is not writable: %s', $sessionPath));
            Response::error('Internal Server Error', 500);
        }

        ini_set('session.use_only_cookies', '1');
        ini_set('session.use_strict_mode', '1');
        session_save_path($sessionPath);
    }
}
