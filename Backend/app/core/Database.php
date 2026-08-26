<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Provides a shared PDO database connection for the API.
 */
final class Database
{
    private static ?PDO $connection = null;

    private function __construct()
    {
    }

    private function __clone()
    {
    }

    /**
     * Returns the shared PDO connection.
     *
     * @throws RuntimeException When the configuration file is invalid or the connection fails.
     */
    public static function connection(): PDO
    {
        if (self::$connection instanceof PDO) {
            return self::$connection;
        }

        $configPath = dirname(__DIR__) . '/config/database.php';
        $config = require $configPath;

        if (!is_array($config)) {
            throw new RuntimeException('Database configuration must return an array.');
        }

        foreach (['host', 'dbname', 'user', 'pass'] as $key) {
            if (!array_key_exists($key, $config)) {
                throw new RuntimeException(sprintf('Database configuration is missing "%s".', $key));
            }
        }

        $dsnParts = [
            sprintf('host=%s', (string) $config['host']),
            sprintf('dbname=%s', (string) $config['dbname']),
            'charset=utf8mb4',
        ];

        if (array_key_exists('port', $config) && $config['port'] !== null && $config['port'] !== '') {
            $dsnParts[] = sprintf('port=%d', (int) $config['port']);
        }

        $dsn = sprintf('mysql:%s', implode(';', $dsnParts));

        try {
            self::$connection = new PDO(
                $dsn,
                (string) $config['user'],
                (string) $config['pass'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $exception) {
            throw new RuntimeException(
                sprintf('Database connection failed: %s', $exception->getMessage()),
                (int) $exception->getCode(),
                $exception
            );
        }

        return self::$connection;
    }

    /**
     * Returns the shared PDO connection.
     *
     * @throws RuntimeException When the configuration file is invalid or the connection fails.
     */
    public static function getInstance(): PDO
    {
        return self::connection();
    }
}
