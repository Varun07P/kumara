<?php

declare(strict_types=1);

namespace App\Models;

use InvalidArgumentException;
use PDO;

/**
 * Provides data access for key-value application settings.
 */
final class Setting
{
    private const FEATURED_SECTION_VISIBLE = 'featured_section_visible';

    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Returns a setting value by name, or null when it does not exist.
     */
    public function get(string $name): ?string
    {
        $statement = $this->pdo->prepare(
            'SELECT value FROM settings WHERE name = :name LIMIT 1'
        );
        $statement->execute(['name' => $name]);

        $value = $statement->fetchColumn();

        return is_string($value) ? $value : null;
    }

    /**
     * Updates an existing setting value.
     *
     * @throws InvalidArgumentException When the setting name does not exist.
     */
    public function set(string $name, string $value): bool
    {
        if ($this->get($name) === null) {
            throw new InvalidArgumentException(sprintf('Unknown setting "%s".', $name));
        }

        $statement = $this->pdo->prepare(
            'UPDATE settings SET value = :value WHERE name = :name'
        );
        $statement->execute([
            'name' => $name,
            'value' => $value,
        ]);

        return $statement->rowCount() > 0;
    }

    /**
     * Determines whether the public featured image section should be visible.
     */
    public function isFeaturedSectionVisible(): bool
    {
        return $this->get(self::FEATURED_SECTION_VISIBLE) === '1';
    }
}
