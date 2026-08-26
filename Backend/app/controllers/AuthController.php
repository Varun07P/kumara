<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Response;
use App\Models\Admin;
use PDO;

/**
 * Handles administrator authentication requests and session responses.
 */
final class AuthController
{
    private const MAX_FAILED_ATTEMPTS = 5;
    private const FAILED_ATTEMPT_WINDOW_SECONDS = 900;
    private const DUMMY_PASSWORD_HASH = '$2y$10$fHz29kQXt3/QokeOT3Ot4ueT0NHuAITHUkBbWOMduIpC0HsRKXEHG';

    private Admin $admin;

    public function __construct(PDO $pdo)
    {
        $this->admin = new Admin($pdo);
    }

    /**
     * Authenticates the administrator and starts a session.
     */
    public function login(): never
    {
        Auth::startSession();

        $payload = $this->readJsonBody();
        $username = isset($payload['username']) && is_string($payload['username'])
            ? trim($payload['username'])
            : '';
        $password = isset($payload['password']) && is_string($payload['password'])
            ? $payload['password']
            : '';

        if ($username === '' || trim($password) === '') {
            Response::error('Username and password are required', 422);
        }

        if ($this->admin->countRecentFailedLoginAttempts($username, self::FAILED_ATTEMPT_WINDOW_SECONDS)
            >= self::MAX_FAILED_ATTEMPTS
        ) {
            error_log(sprintf(
                'Rate limited login attempt for username "%s" at %s from IP %s.',
                $username,
                date(DATE_ATOM),
                $this->getClientIpAddress() ?? 'unknown'
            ));

            Response::error('Too many attempts, please try again later', 429);
        }

        $admin = $this->admin->findByUsername($username);
        $storedHash = $admin !== null && isset($admin['password']) && is_string($admin['password'])
            ? $admin['password']
            : self::DUMMY_PASSWORD_HASH;
        $passwordMatches = password_verify($password, $storedHash);

        if ($admin === null || !$passwordMatches) {
            $this->admin->recordFailedLoginAttempt($username, $this->getClientIpAddress());
            error_log(sprintf(
                'Failed login attempt for username "%s" at %s from IP %s.',
                $username,
                date(DATE_ATOM),
                $this->getClientIpAddress() ?? 'unknown'
            ));

            Response::error('Invalid credentials', 401);
        }

        session_regenerate_id(true);

        $_SESSION['admin_id'] = (int) $admin['id'];
        $_SESSION['admin_username'] = (string) $admin['username'];

        $this->admin->clearFailedLoginAttempts($username);

        Response::success(['username' => (string) $admin['username']], 200);
    }

    /**
     * Destroys the current administrator session.
     */
    public function logout(): never
    {
        Auth::destroySession();

        Response::success(['message' => 'Logged out successfully']);
    }

    /**
     * Reports whether the current request has an authenticated session.
     */
    public function checkSession(): never
    {
        if (!Auth::isAuthenticated()) {
            Response::success(['authenticated' => false]);
        }

        Response::success([
            'authenticated' => true,
            'username' => isset($_SESSION['admin_username']) ? (string) $_SESSION['admin_username'] : '',
        ]);
    }

    /**
     * Reads and decodes the request JSON body.
     *
     * @return array<string, mixed>
     */
    private function readJsonBody(): array
    {
        $body = file_get_contents('php://input');
        $decoded = json_decode(is_string($body) ? $body : '', true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Returns the current client IP address when available.
     */
    private function getClientIpAddress(): ?string
    {
        return isset($_SERVER['REMOTE_ADDR']) && is_string($_SERVER['REMOTE_ADDR'])
            ? $_SERVER['REMOTE_ADDR']
            : null;
    }
}
