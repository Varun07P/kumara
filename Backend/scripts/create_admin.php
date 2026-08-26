<?php

declare(strict_types=1);

/**
 * One-time CLI utility for creating the first administrator account.
 *
 * This script must be run manually from the command line using:
 * php scripts/create_admin.php
 *
 * It is not part of the API, is not reachable through the Router, and must never
 * be exposed as an HTTP endpoint.
 */

namespace App\Scripts;

use App\Core\Database;
use App\Models\Admin;
use PDO;
use RuntimeException;
use Throwable;

require_once dirname(__DIR__) . '/vendor/autoload.php';

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only be run from the command line.\n");
    exit(1);
}

/**
 * Reads a single line of input from the CLI.
 */
function prompt(string $message): string
{
    if (function_exists('readline')) {
        $value = readline($message);

        return is_string($value) ? $value : '';
    }

    fwrite(STDOUT, $message);
    $value = fgets(STDIN);

    return is_string($value) ? rtrim($value, "\r\n") : '';
}

try {
    if (!class_exists(Admin::class)) {
        throw new RuntimeException('Admin model could not be loaded.');
    }

    $username = trim(prompt('Admin username: '));
    $password = prompt('Admin password: ');

    if ($username === '') {
        fwrite(STDERR, "Error: username cannot be empty.\n");
        exit(1);
    }

    if (strlen($password) < 8) {
        fwrite(STDERR, "Error: password must be at least 8 characters long.\n");
        exit(1);
    }

    $pdo = Database::getInstance();

    $lookup = $pdo->query('SELECT username FROM admin ORDER BY id ASC LIMIT 1');
    $existingAdmin = $lookup instanceof \PDOStatement ? $lookup->fetch(PDO::FETCH_ASSOC) : false;

    if (is_array($existingAdmin) && isset($existingAdmin['username'])) {
        printf(
            "An admin account already exists: %s. Aborting to avoid creating duplicates.\n",
            (string) $existingAdmin['username']
        );
        exit(0);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    if ($passwordHash === false) {
        fwrite(STDERR, "Error: failed to hash the password.\n");
        exit(1);
    }

    $insert = $pdo->prepare('INSERT INTO admin (username, password) VALUES (:username, :password)');
    $insert->execute([
        'username' => $username,
        'password' => $passwordHash,
    ]);

    printf("Admin account created successfully for username: %s\n", $username);
    exit(0);
} catch (Throwable $exception) {
    fwrite(STDERR, sprintf("Error: failed to create admin account. %s\n", $exception->getMessage()));
    exit(1);
}
