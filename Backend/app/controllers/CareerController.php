<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Response;
use App\Models\Career;
use PDO;

/**
 * Handles career/job opening API requests for both public and admin endpoints.
 */
final class CareerController
{
    private const MAX_TITLE_LENGTH      = 200;
    private const MAX_LOCATION_LENGTH   = 100;
    private const MAX_JOB_TYPE_LENGTH   = 50;
    private const MAX_EXPERIENCE_LENGTH = 100;
    private const MAX_SKILLS_LENGTH     = 255;

    private const ALLOWED_JOB_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Internship'];

    private Career $career;

    public function __construct(PDO $pdo)
    {
        $this->career = new Career($pdo);
    }

    /**
     * Returns all active career openings for the public frontend.
     * No authentication required.
     */
    public function listPublic(): never
    {
        $careers = $this->career->findAllActive();

        Response::success(['careers' => $careers]);
    }

    /**
     * Returns all career openings (active and inactive) for admin management.
     */
    public function listAll(): never
    {
        Auth::requireAuth();

        $careers = $this->career->findAll();

        Response::success(['careers' => $careers]);
    }

    /**
     * Creates a new career opening.
     */
    public function create(): never
    {
        Auth::requireAuth();

        $data = $this->readAndValidatePayload();

        $id = $this->career->create($data);
        $career = $this->career->findById($id);

        Response::success(['career' => $career], 201);
    }

    /**
     * Updates an existing career opening.
     */
    public function update(string $id): never
    {
        Auth::requireAuth();

        $careerId = $this->parseId($id);
        $existing = $this->career->findById($careerId);

        if ($existing === null) {
            Response::error('Career opening not found', 404);
        }

        $data = $this->readAndValidatePayload();

        $this->career->update($careerId, $data);
        $career = $this->career->findById($careerId);

        Response::success(['career' => $career]);
    }

    /**
     * Toggles the active/inactive status of a career opening.
     */
    public function toggleActive(string $id): never
    {
        Auth::requireAuth();

        $careerId = $this->parseId($id);
        $existing = $this->career->findById($careerId);

        if ($existing === null) {
            Response::error('Career opening not found', 404);
        }

        $payload = $this->readJsonBody();
        $isActive = isset($payload['is_active']) ? (bool) $payload['is_active'] : !((bool) $existing['is_active']);

        $this->career->toggleActive($careerId, $isActive);
        $career = $this->career->findById($careerId);

        Response::success(['career' => $career]);
    }

    /**
     * Deletes a career opening permanently.
     */
    public function delete(string $id): never
    {
        Auth::requireAuth();

        $careerId = $this->parseId($id);
        $existing = $this->career->findById($careerId);

        if ($existing === null) {
            Response::error('Career opening not found', 404);
        }

        $this->career->delete($careerId);

        Response::success(['message' => 'Career opening deleted successfully']);
    }

    /**
     * Reads, validates, and sanitizes the JSON request body for create/update operations.
     *
     * @return array<string, mixed>
     */
    private function readAndValidatePayload(): array
    {
        $payload = $this->readJsonBody();

        $title = $this->extractString($payload, 'title');
        $location = $this->extractString($payload, 'location');
        $experience = $this->extractString($payload, 'experience');

        if ($title === '') {
            Response::error('Job title is required', 422);
        }
        if ($location === '') {
            Response::error('Location is required', 422);
        }
        if ($experience === '') {
            Response::error('Experience requirement is required', 422);
        }

        if (mb_strlen($title) > self::MAX_TITLE_LENGTH) {
            Response::error(sprintf('Title must not exceed %d characters', self::MAX_TITLE_LENGTH), 422);
        }
        if (mb_strlen($location) > self::MAX_LOCATION_LENGTH) {
            Response::error(sprintf('Location must not exceed %d characters', self::MAX_LOCATION_LENGTH), 422);
        }
        if (mb_strlen($experience) > self::MAX_EXPERIENCE_LENGTH) {
            Response::error(sprintf('Experience must not exceed %d characters', self::MAX_EXPERIENCE_LENGTH), 422);
        }

        $jobType = $this->extractString($payload, 'job_type');

        if ($jobType === '') {
            $jobType = 'Full-Time';
        }
        if (!in_array($jobType, self::ALLOWED_JOB_TYPES, true)) {
            Response::error(
                sprintf('Job type must be one of: %s', implode(', ', self::ALLOWED_JOB_TYPES)),
                422
            );
        }
        if (mb_strlen($jobType) > self::MAX_JOB_TYPE_LENGTH) {
            Response::error(sprintf('Job type must not exceed %d characters', self::MAX_JOB_TYPE_LENGTH), 422);
        }

        $skills = $this->extractString($payload, 'skills');

        if ($skills !== '' && mb_strlen($skills) > self::MAX_SKILLS_LENGTH) {
            Response::error(sprintf('Skills must not exceed %d characters', self::MAX_SKILLS_LENGTH), 422);
        }

        $sortOrder = isset($payload['sort_order']) && is_numeric($payload['sort_order'])
            ? max(0, (int) $payload['sort_order'])
            : 0;

        return [
            'title'      => $title,
            'location'   => $location,
            'job_type'   => $jobType,
            'experience' => $experience,
            'skills'     => $skills !== '' ? $skills : null,
            'is_active'  => isset($payload['is_active']) ? ((bool) $payload['is_active'] ? 1 : 0) : 1,
            'sort_order' => $sortOrder,
        ];
    }

    /**
     * Parses and validates a route parameter ID.
     */
    private function parseId(string $id): int
    {
        if (!ctype_digit($id) || (int) $id < 1) {
            Response::error('Invalid career ID', 400);
        }

        return (int) $id;
    }

    /**
     * Extracts a trimmed string value from the payload.
     */
    private function extractString(array $payload, string $key): string
    {
        return isset($payload[$key]) && is_string($payload[$key])
            ? trim($payload[$key])
            : '';
    }

    /**
     * Reads and decodes the JSON request body.
     *
     * @return array<string, mixed>
     */
    private function readJsonBody(): array
    {
        $body = file_get_contents('php://input');
        $decoded = json_decode(is_string($body) ? $body : '', true);

        return is_array($decoded) ? $decoded : [];
    }
}
