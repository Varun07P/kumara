<?php

declare(strict_types=1);

/**
 * CLI-only database connection test.
 *
 * Run manually from the Backend directory using:
 * php scripts/test_database.php
 *
 * This script is not part of the API, is not reachable through the Router, and
 * must never be exposed as an HTTP endpoint.
 */

namespace App\Scripts;

use App\Core\Database;
use PDO;
use Throwable;

require_once dirname(__DIR__) . '/vendor/autoload.php';

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only be run from the command line.\n");
    exit(1);
}

try {
    $pdo = Database::getInstance();

    $statement = $pdo->query('SELECT DATABASE() AS database_name, VERSION() AS mysql_version');
    $result = $statement instanceof \PDOStatement ? $statement->fetch(PDO::FETCH_ASSOC) : false;

    if (!is_array($result)) {
        fwrite(STDERR, "Database connection test failed: no response from MySQL.\n");
        exit(1);
    }

    printf("Database connected successfully: %s\n", (string) $result['database_name']);
    printf("MySQL version: %s\n", (string) $result['mysql_version']);
    exit(0);
} catch (Throwable $exception) {
    fwrite(STDERR, sprintf("Database connection failed: %s\n", $exception->getMessage()));
    exit(1);
}
