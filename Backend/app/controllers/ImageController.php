<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Response;
use App\Models\Image;
use App\Models\Setting;
use App\Services\ImageCompressionService;
use InvalidArgumentException;
use PDO;
use RuntimeException;
use Throwable;

/**
 * Handles image upload, listing, deletion, compression metadata, and placement endpoints.
 */
final class ImageController
{
    private const MAX_UPLOAD_BYTES = 10485760;
    private const VALID_PLACEMENTS = ['gallery', 'featured'];

    private Image $image;
    private Setting $setting;
    private PDO $pdo;
    private ImageCompressionService $compressionService;
    private string $compressedStorageDirectory;

    /**
     * Creates the controller and configures image persistence dependencies.
     *
     * @throws RuntimeException If the compressed upload directory cannot be resolved.
     */
    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->image = new Image($pdo);
        $this->setting = new Setting($pdo);

        $storageDirectory = realpath(dirname(__DIR__, 2) . '/public/storage/uploads/compressed');

        if ($storageDirectory === false) {
            throw new RuntimeException('Compressed upload storage directory could not be resolved.');
        }

        $this->compressedStorageDirectory = $storageDirectory;
        $this->compressionService = new ImageCompressionService($storageDirectory);
    }

    /**
     * Handles image upload requests.
     */
    public function upload(): never
    {
        Auth::requireAuth();

        $uploadedFile = $this->getUploadedImage();
        $caption = $this->getCaption();
        $placements = $this->getPlacements();

        try {
            $storedFilename = $this->compressionService->compress(
                $uploadedFile['tmp_name'],
                $uploadedFile['name']
            );
        } catch (InvalidArgumentException $exception) {
            Response::error($exception->getMessage(), 422);
        } catch (RuntimeException $exception) {
            error_log($exception->getMessage());
            Response::error('Image processing failed', 500);
        } catch (Throwable $exception) {
            error_log($exception->getMessage());
            error_log($exception->getTraceAsString());
            Response::error('Image processing failed', 500);
        }

        try {
            $this->pdo->beginTransaction();
            $imageId = $this->image->create($uploadedFile['name'], $storedFilename, $caption);

            foreach ($placements as $placement) {
                $this->image->addPlacement($imageId, $placement);
            }

            $this->pdo->commit();
        } catch (Throwable $exception) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            $this->deleteCompressedFile($storedFilename);
            error_log($exception->getMessage());
            error_log($exception->getTraceAsString());

            Response::error('Image upload failed', 500);
        }

        Response::success([
            'id' => $imageId,
            'caption' => $caption,
            'placements' => $placements,
        ], 201);
    }

    /**
     * Handles requests for all uploaded images.
     */
    public function listAll(): never
    {
        Auth::requireAuth();

        Response::success([
            'images' => $this->image->findAll(),
        ]);
    }

    /**
     * Handles requests for gallery placement images.
     */
    public function listGallery(): never
    {
        Response::success([
            'images' => $this->image->findByPlacement('gallery'),
        ]);
    }

    /**
     * Handles requests for featured placement images.
     */
    public function listFeatured(): never
    {
        $isVisible = $this->setting->isFeaturedSectionVisible();

        if (!$isVisible) {
            Response::success([
                'visible' => false,
                'images' => [],
            ]);
        }

        Response::success([
            'visible' => true,
            'images' => $this->image->findByPlacement('featured'),
        ]);
    }

    /**
     * Handles image caption update requests.
     */
    public function updateCaption(string $id): never
    {
        Auth::requireAuth();

        $imageId = $this->parseImageId($id);
        $image = $this->image->findById($imageId);

        if ($image === null) {
            Response::error('Image not found', 404);
        }

        $payload = $this->readJsonBody();

        if (
            !array_key_exists('caption', $payload)
            || (!is_string($payload['caption']) && $payload['caption'] !== null)
        ) {
            Response::error('Caption is required', 422);
        }

        $caption = $payload['caption'] === null ? null : trim((string) $payload['caption']);
        $caption = $caption === '' ? null : $caption;

        $this->image->updateCaption($imageId, $caption);

        Response::success([
            'id' => $imageId,
            'caption' => $caption,
        ]);
    }

    /**
     * Handles image placement creation requests.
     */
    public function addPlacement(string $id): never
    {
        Auth::requireAuth();

        $imageId = $this->parseImageId($id);
        $payload = $this->readJsonBody();
        $placement = isset($payload['placement']) && is_string($payload['placement'])
            ? trim($payload['placement'])
            : '';

        if (!$this->isValidPlacement($placement)) {
            Response::error('Invalid image placement selected', 422);
        }

        if ($this->image->findById($imageId) === null) {
            Response::error('Image not found', 404);
        }

        $this->image->addPlacement($imageId, $placement);

        Response::success([
            'id' => $imageId,
            'placements' => $this->image->findPlacementsByImageId($imageId),
        ]);
    }

    /**
     * Handles image placement removal requests.
     */
    public function removePlacement(string $id, string $placement): never
    {
        Auth::requireAuth();

        $imageId = $this->parseImageId($id);
        $placement = trim($placement);

        if (!$this->isValidPlacement($placement)) {
            Response::error('Invalid image placement selected', 422);
        }

        if ($this->image->findById($imageId) === null) {
            Response::error('Image not found', 404);
        }

        $this->image->removePlacement($imageId, $placement);

        Response::success([
            'id' => $imageId,
            'placements' => $this->image->findPlacementsByImageId($imageId),
        ]);
    }

    /**
     * Handles image deletion requests.
     */
    public function delete(string $id): never
    {
        Auth::requireAuth();

        $imageId = $this->parseImageId($id);
        $image = $this->image->findById($imageId);

        if ($image === null) {
            Response::error('Image not found', 404);
        }

        $storedFilename = isset($image['stored_filename']) ? (string) $image['stored_filename'] : '';
        $filePath = $this->compressedStorageDirectory . DIRECTORY_SEPARATOR . basename($storedFilename);

        if ($storedFilename !== '' && file_exists($filePath)) {
            $this->unlinkFile($filePath, 'Failed to delete compressed image file');
        }

        $this->image->delete($imageId);

        Response::success([
            'message' => 'Image deleted successfully',
        ]);
    }

    /**
     * Returns the uploaded image file payload after validating upload status and size.
     *
     * @return array{name: string, tmp_name: string, size: int}
     */
    private function getUploadedImage(): array
    {
        if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
            Response::error('A valid image file is required', 422);
        }

        $file = $_FILES['image'];

        if (
            !isset($file['error'], $file['tmp_name'], $file['name'], $file['size'])
            || is_array($file['error'])
            || is_array($file['tmp_name'])
            || is_array($file['name'])
            || is_array($file['size'])
            || (int) $file['error'] !== UPLOAD_ERR_OK
        ) {
            Response::error('A valid image file is required', 422);
        }

        $size = (int) $file['size'];

        if ($size > self::MAX_UPLOAD_BYTES) {
            Response::error('Image file must not exceed 10MB', 422);
        }

        $tmpName = (string) $file['tmp_name'];
        $originalName = trim((string) $file['name']);

        if ($tmpName === '' || $originalName === '' || !is_uploaded_file($tmpName)) {
            Response::error('A valid image file is required', 422);
        }

        return [
            'name' => $originalName,
            'tmp_name' => $tmpName,
            'size' => $size,
        ];
    }

    /**
     * Reads the optional caption field from the multipart request.
     */
    private function getCaption(): ?string
    {
        if (!isset($_POST['caption']) || is_array($_POST['caption'])) {
            return null;
        }

        $caption = trim((string) $_POST['caption']);

        return $caption === '' ? null : $caption;
    }

    /**
     * Reads and validates optional image placement selections.
     *
     * @return list<string>
     */
    private function getPlacements(): array
    {
        if (!isset($_POST['placements'])) {
            return [];
        }

        $rawPlacements = $_POST['placements'];
        $placementValues = [];

        if (is_array($rawPlacements)) {
            foreach ($rawPlacements as $rawPlacement) {
                if (!is_string($rawPlacement)) {
                    Response::error('Invalid image placement selected', 422);
                }

                foreach (explode(',', $rawPlacement) as $placement) {
                    $placementValues[] = trim($placement);
                }
            }
        } elseif (is_string($rawPlacements)) {
            foreach (explode(',', $rawPlacements) as $placement) {
                $placementValues[] = trim($placement);
            }
        } else {
            Response::error('Invalid image placement selected', 422);
        }

        $placements = [];

        foreach ($placementValues as $placement) {
            if ($placement === '') {
                continue;
            }

            if (!in_array($placement, self::VALID_PLACEMENTS, true)) {
                Response::error('Invalid image placement selected', 422);
            }

            if (!in_array($placement, $placements, true)) {
                $placements[] = $placement;
            }
        }

        return $placements;
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

    /**
     * Parses a route image ID into a positive integer.
     */
    private function parseImageId(string $id): int
    {
        if (!ctype_digit($id) || (int) $id <= 0) {
            Response::error('Invalid image id', 422);
        }

        return (int) $id;
    }

    /**
     * Determines whether a placement value is allowed.
     */
    private function isValidPlacement(string $placement): bool
    {
        return in_array($placement, self::VALID_PLACEMENTS, true);
    }

    /**
     * Removes a compressed file after a later upload step fails.
     */
    private function deleteCompressedFile(string $storedFilename): void
    {
        $path = $this->compressedStorageDirectory . DIRECTORY_SEPARATOR . basename($storedFilename);

        if (is_file($path)) {
            $this->unlinkFile($path, 'Failed to delete compressed file after upload failure');
        }
    }

    /**
     * Deletes a file and logs failures without leaking filesystem details to API clients.
     */
    private function unlinkFile(string $path, string $message): void
    {
        if (!is_writable($path)) {
            error_log(sprintf('%s: %s is not writable', $message, $path));
            return;
        }

        if (!unlink($path)) {
            error_log(sprintf('%s: %s', $message, $path));
        }
    }
}
