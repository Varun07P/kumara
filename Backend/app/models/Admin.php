<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

/**
 * Provides data access for administrator account records used by API authentication.
 */
final class Admin
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Finds an administrator account by username.
     *
     * @return array<string, mixed>|null
     */
    public function findByUsername(string $username): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, username, password, created_at FROM admin WHERE username = :username LIMIT 1'
        );
        $statement->execute(['username' => $username]);

        $admin = $statement->fetch(PDO::FETCH_ASSOC);

        return is_array($admin) ? $admin : null;
    }

    /**
     * Counts recent failed login attempts for a username.
     */
    public function countRecentFailedLoginAttempts(string $username, int $windowSeconds): int
    {
        $this->deleteExpiredFailedLoginAttempts($windowSeconds);

        $statement = $this->pdo->prepare(
            'SELECT COUNT(*) FROM login_attempts WHERE username = :username'
        );
        $statement->execute(['username' => $username]);

        return (int) $statement->fetchColumn();
    }

    /**
     * Records a failed login attempt for security monitoring and rate limiting.
     */
    public function recordFailedLoginAttempt(string $username, ?string $ipAddress): void
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO login_attempts (username, ip_address) VALUES (:username, :ip_address)'
        );
        $statement->execute([
            'username' => $username,
            'ip_address' => $ipAddress,
        ]);
    }

    /**
     * Clears failed login attempts after a successful login.
     */
    public function clearFailedLoginAttempts(string $username): void
    {
        $statement = $this->pdo->prepare(
            'DELETE FROM login_attempts WHERE username = :username'
        );
        $statement->execute(['username' => $username]);
    }

    /**
     * Removes failed login attempts outside the active rate-limit window.
     */
    private function deleteExpiredFailedLoginAttempts(int $windowSeconds): void
    {
        $cutoff = date('Y-m-d H:i:s', time() - $windowSeconds);
        $statement = $this->pdo->prepare(
            'DELETE FROM login_attempts WHERE attempted_at < :cutoff'
        );
        $statement->execute(['cutoff' => $cutoff]);
    }
}
