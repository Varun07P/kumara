<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

/**
 * Provides data access for career/job opening records.
 */
final class Career
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Returns all active career openings ordered by sort_order for public display.
     *
     * @return array<int, array<string, mixed>>
     */
    public function findAllActive(): array
    {
        $statement = $this->pdo->query(
            'SELECT id, title, location, job_type, experience, skills
             FROM careers
             WHERE is_active = 1
             ORDER BY sort_order ASC, id ASC'
        );

        return $statement !== false ? $statement->fetchAll(PDO::FETCH_ASSOC) : [];
    }

    /**
     * Returns all career openings (active and inactive) for admin management.
     *
     * @return array<int, array<string, mixed>>
     */
    public function findAll(): array
    {
        $statement = $this->pdo->query(
            'SELECT id, title, location, job_type, experience, skills, is_active, sort_order, created_at, updated_at
             FROM careers
             ORDER BY sort_order ASC, id ASC'
        );

        return $statement !== false ? $statement->fetchAll(PDO::FETCH_ASSOC) : [];
    }

    /**
     * Finds a single career opening by its ID.
     *
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, title, location, job_type, experience, skills, is_active, sort_order, created_at, updated_at
             FROM careers
             WHERE id = :id
             LIMIT 1'
        );
        $statement->execute(['id' => $id]);

        $career = $statement->fetch(PDO::FETCH_ASSOC);

        return is_array($career) ? $career : null;
    }

    /**
     * Creates a new career opening and returns its ID.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): int
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO careers (title, location, job_type, experience, skills, is_active, sort_order)
             VALUES (:title, :location, :job_type, :experience, :skills, :is_active, :sort_order)'
        );

        $statement->execute([
            'title'      => $data['title'],
            'location'   => $data['location'],
            'job_type'   => $data['job_type'],
            'experience' => $data['experience'],
            'skills'     => $data['skills'] ?? null,
            'is_active'  => $data['is_active'] ?? 1,
            'sort_order' => $data['sort_order'] ?? $this->getNextSortOrder(),
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Updates an existing career opening.
     *
     * @param array<string, mixed> $data
     */
    public function update(int $id, array $data): bool
    {
        $statement = $this->pdo->prepare(
            'UPDATE careers
             SET title = :title,
                 location = :location,
                 job_type = :job_type,
                 experience = :experience,
                 skills = :skills,
                 sort_order = :sort_order
             WHERE id = :id'
        );

        return $statement->execute([
            'title'      => $data['title'],
            'location'   => $data['location'],
            'job_type'   => $data['job_type'],
            'experience' => $data['experience'],
            'skills'     => $data['skills'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'id'         => $id,
        ]);
    }

    /**
     * Toggles the active status of a career opening.
     */
    public function toggleActive(int $id, bool $active): bool
    {
        $statement = $this->pdo->prepare(
            'UPDATE careers SET is_active = :is_active WHERE id = :id'
        );

        return $statement->execute([
            'is_active' => $active ? 1 : 0,
            'id'        => $id,
        ]);
    }

    /**
     * Deletes a career opening permanently.
     */
    public function delete(int $id): bool
    {
        $statement = $this->pdo->prepare('DELETE FROM careers WHERE id = :id');

        return $statement->execute(['id' => $id]);
    }

    /**
     * Returns the next sort_order value for new insertions.
     */
    private function getNextSortOrder(): int
    {
        $statement = $this->pdo->query('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM careers');

        return $statement !== false ? (int) $statement->fetchColumn() : 1;
    }
}
