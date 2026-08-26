<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Response;
use App\Models\Setting;
use InvalidArgumentException;
use PDO;

/**
 * Handles API requests for reading and updating application settings.
 */
final class SettingController
{
    private const FEATURED_SECTION_VISIBLE = 'featured_section_visible';

    private Setting $setting;

    public function __construct(PDO $pdo)
    {
        $this->setting = new Setting($pdo);
    }

    /**
     * Handles requests for the featured section visibility setting.
     */
    public function getFeaturedToggle(): never
    {
        Auth::requireAuth();

        Response::success([
            self::FEATURED_SECTION_VISIBLE => $this->setting->isFeaturedSectionVisible(),
        ]);
    }

    /**
     * Handles featured section visibility update requests.
     */
    public function updateFeaturedToggle(): never
    {
        Auth::requireAuth();

        $payload = $this->readJsonBody();

        if (
            !array_key_exists(self::FEATURED_SECTION_VISIBLE, $payload)
            || !is_bool($payload[self::FEATURED_SECTION_VISIBLE])
        ) {
            Response::error('featured_section_visible must be a boolean', 422);
        }

        $isVisible = $payload[self::FEATURED_SECTION_VISIBLE];
        $value = $isVisible ? '1' : '0';

        try {
            $this->setting->set(self::FEATURED_SECTION_VISIBLE, $value);
        } catch (InvalidArgumentException $exception) {
            error_log($exception->getMessage());
            Response::error('Internal Server Error', 500);
        }

        Response::success([
            self::FEATURED_SECTION_VISIBLE => $isVisible,
        ]);
    }

    /**
     * Reads and decodes a JSON request body.
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
