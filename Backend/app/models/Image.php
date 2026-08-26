<?php

declare(strict_types=1);

namespace App\Models;

use InvalidArgumentException;
use PDO;
use PDOException;

/**
 * Provides data access for the images and image_placements tables.
 *
 * This model performs pure database access only. It does not perform filesystem
 * I/O, HTTP response handling, or business logic outside image persistence.
 */
final class Image
{
    /**
     * Valid placement values that match the ENUM in the database schema.
     *
     * @var list<string>
     */
    private const VALID_PLACEMENTS = ['gallery', 'featured'];

    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Inserts a new image record and returns its generated ID.
     */
    public function create(string $originalFilename, string $storedFilename, ?string $caption): int
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO images (original_filename, stored_filename, caption)
             VALUES (:original_filename, :stored_filename, :caption)'
        );

        $statement->execute([
            'original_filename' => $originalFilename,
            'stored_filename' => $storedFilename,
            'caption' => $this->normalizeCaption($caption),
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Finds an image by ID.
     *
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, original_filename, stored_filename, caption, uploaded_at
             FROM images
             WHERE id = :id
             LIMIT 1'
        );
        $statement->execute(['id' => $id]);

        $image = $statement->fetch(PDO::FETCH_ASSOC);

        return is_array($image) ? $image : null;
    }

    /**
     * Returns all images with their current placements.
     *
     * @return list<array<string, mixed>>
     */
    public function findAll(): array
    {
        $statement = $this->pdo->query(
            'SELECT i.id, i.original_filename, i.stored_filename, i.caption, i.uploaded_at,
                    ip.placement
             FROM images i
             LEFT JOIN image_placements ip ON ip.image_id = i.id
             ORDER BY i.uploaded_at DESC, i.id DESC, ip.placement ASC'
        );

        $rows = $statement->fetchAll(PDO::FETCH_ASSOC);

        return $this->hydrateImagesWithPlacements($rows);
    }

    /**
     * Returns all images assigned to the requested placement.
     *
     * @return list<array<string, mixed>>
     *
     * @throws InvalidArgumentException When the placement value is invalid.
     */
    public function findByPlacement(string $placement): array
    {
        $this->validatePlacement($placement);

        $statement = $this->pdo->prepare(
            'SELECT i.id, i.original_filename, i.stored_filename, i.caption, i.uploaded_at
             FROM images i
             INNER JOIN image_placements ip ON ip.image_id = i.id
             WHERE ip.placement = :placement
             ORDER BY i.uploaded_at DESC, i.id DESC'
        );
        $statement->execute(['placement' => $placement]);

        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Updates an image caption.
     */
    public function updateCaption(int $id, ?string $caption): bool
    {
        $statement = $this->pdo->prepare(
            'UPDATE images SET caption = :caption WHERE id = :id'
        );
        $statement->execute([
            'caption' => $this->normalizeCaption($caption),
            'id' => $id,
        ]);

        return $statement->rowCount() > 0;
    }

    /**
     * Deletes an image row.
     *
     * Related image_placements rows are removed by the database ON DELETE CASCADE
     * constraint. This method does not delete files from disk.
     */
    public function delete(int $id): bool
    {
        $statement = $this->pdo->prepare(
            'DELETE FROM images WHERE id = :id'
        );
        $statement->execute(['id' => $id]);

        return $statement->rowCount() > 0;
    }

    /**
     * Adds a placement to an image.
     *
     * If the exact image/placement row already exists, this is treated as a
     * successful no-op. Other integrity errors, such as an invalid image ID, are
     * rethrown.
     *
     * @throws InvalidArgumentException When the placement value is invalid.
     * @throws PDOException When the database rejects the insert for any reason
     *                      other than the duplicate placement constraint.
     */
    public function addPlacement(int $imageId, string $placement): bool
    {
        $this->validatePlacement($placement);

        try {
            $statement = $this->pdo->prepare(
                'INSERT INTO image_placements (image_id, placement)
                 VALUES (:image_id, :placement)'
            );
            $statement->execute([
                'image_id' => $imageId,
                'placement' => $placement,
            ]);

            return true;
        } catch (PDOException $exception) {
            if ($this->isDuplicatePlacementViolation($exception)) {
                return true;
            }

            throw $exception;
        }
    }

    /**
     * Removes a placement from an image.
     *
     * @throws InvalidArgumentException When the placement value is invalid.
     */
    public function removePlacement(int $imageId, string $placement): bool
    {
        $this->validatePlacement($placement);

        $statement = $this->pdo->prepare(
            'DELETE FROM image_placements
             WHERE image_id = :image_id AND placement = :placement'
        );
        $statement->execute([
            'image_id' => $imageId,
            'placement' => $placement,
        ]);

        return $statement->rowCount() > 0;
    }

    /**
     * Returns the current placement list for an image.
     *
     * @return list<string>
     */
    public function findPlacementsByImageId(int $imageId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT placement
             FROM image_placements
             WHERE image_id = :image_id
             ORDER BY placement ASC'
        );
        $statement->execute(['image_id' => $imageId]);

        return array_map('strval', $statement->fetchAll(PDO::FETCH_COLUMN));
    }

    /**
     * Builds image rows with placement arrays from joined query rows.
     *
     * @param list<array<string, mixed>> $rows
     *
     * @return list<array<string, mixed>>
     */
    private function hydrateImagesWithPlacements(array $rows): array
    {
        $images = [];

        foreach ($rows as $row) {
            $id = (int) $row['id'];

            if (!isset($images[$id])) {
                $images[$id] = [
                    'id' => $id,
                    'original_filename' => $row['original_filename'],
                    'stored_filename' => $row['stored_filename'],
                    'caption' => $row['caption'],
                    'uploaded_at' => $row['uploaded_at'],
                    'placements' => [],
                ];
            }

            if ($row['placement'] !== null) {
                $images[$id]['placements'][] = $row['placement'];
            }
        }

        return array_values($images);
    }

    /**
     * Validates that a placement value matches the schema ENUM.
     *
     * @throws InvalidArgumentException When the placement value is invalid.
     */
    private function validatePlacement(string $placement): void
    {
        if (!in_array($placement, self::VALID_PLACEMENTS, true)) {
            throw new InvalidArgumentException(
                sprintf(
                    'Invalid placement "%s". Allowed values: %s.',
                    $placement,
                    implode(', ', self::VALID_PLACEMENTS)
                )
            );
        }
    }

    /**
     * Trims captions and stores empty captions as null.
     */
    private function normalizeCaption(?string $caption): ?string
    {
        if ($caption === null) {
            return null;
        }

        $caption = trim($caption);

        return $caption === '' ? null : $caption;
    }

    /**
     * Checks whether a PDO exception is the duplicate placement constraint.
     */
    private function isDuplicatePlacementViolation(PDOException $exception): bool
    {
        $errorInfo = $exception->errorInfo;
        $sqlState = $errorInfo[0] ?? $exception->getCode();
        $driverCode = isset($errorInfo[1]) ? (int) $errorInfo[1] : null;
        $message = $errorInfo[2] ?? $exception->getMessage();

        return $sqlState === '23000'
            && $driverCode === 1062
            && str_contains($message, 'uq_image_placement');
    }
}
