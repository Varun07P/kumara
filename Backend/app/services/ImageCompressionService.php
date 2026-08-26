<?php

declare(strict_types=1);

namespace App\Services;

use GdImage;
use InvalidArgumentException;
use RuntimeException;

/**
 * Compresses and resizes uploaded images using the GD library.
 *
 * This service performs image file processing only. It does not access the
 * database, read HTTP request state, or make placement/caption decisions.
 */
final class ImageCompressionService
{
    private const MAX_DIMENSION = 1920;
    private const JPEG_QUALITY = 82;
    private const PNG_COMPRESSION = 6;

    /**
     * @var array<int, string>
     */
    private const EXTENSIONS_BY_TYPE = [
        IMAGETYPE_JPEG => 'jpg',
        IMAGETYPE_PNG => 'png',
        IMAGETYPE_WEBP => 'webp',
    ];

    private string $storageDirectory;

    /**
     * @throws InvalidArgumentException If the storage directory is missing or not writable.
     * @throws RuntimeException If GD is not available with the required format support.
     */
    public function __construct(string $storageDirectory)
    {
        $this->assertGdSupport();

        if (!is_dir($storageDirectory)) {
            throw new InvalidArgumentException(
                sprintf('Storage directory does not exist: %s', $storageDirectory)
            );
        }

        if (!is_writable($storageDirectory)) {
            throw new InvalidArgumentException(
                sprintf('Storage directory is not writable: %s', $storageDirectory)
            );
        }

        $this->storageDirectory = rtrim($storageDirectory, '/\\');
    }

    /**
     * Compresses an uploaded image file and saves the processed result.
     *
     * @return string The generated stored filename, not the full path.
     *
     * @throws InvalidArgumentException If the source file is missing or unsupported.
     * @throws RuntimeException If GD cannot process or write the image.
     */
    public function compress(string $sourceTmpPath, string $originalFilename): string
    {
        if (!is_file($sourceTmpPath) || !is_readable($sourceTmpPath)) {
            throw new InvalidArgumentException(
                sprintf('Source file does not exist or is not readable: %s', $sourceTmpPath)
            );
        }

        $imageType = $this->detectImageType($sourceTmpPath);
        $sourceImage = $this->createImageResource($sourceTmpPath, $imageType);
        $resizedImage = null;

        try {
            $resizedImage = $this->resizeIfNeeded($sourceImage);
            $outputImage = $resizedImage ?? $sourceImage;

            $saveAsPng = $imageType === IMAGETYPE_PNG && $this->hasTransparency($outputImage);
            $extension = $saveAsPng ? 'png' : 'jpg';
            $storedFilename = $this->generateUniqueFilename($extension);
            $outputPath = $this->storageDirectory . DIRECTORY_SEPARATOR . $storedFilename;

            $this->saveImage($outputImage, $outputPath, $saveAsPng);

            return $storedFilename;
        } finally {
            if ($resizedImage instanceof GdImage && $resizedImage !== $sourceImage) {
                imagedestroy($resizedImage);
            }

            imagedestroy($sourceImage);
        }
    }

    /**
     * Ensures GD has the capabilities this service requires.
     */
    private function assertGdSupport(): void
    {
        if (!function_exists('gd_info')) {
            throw new RuntimeException('Image compression requires the PHP GD extension.');
        }

        $gdInfo = gd_info();
        $requiredSupport = [
            'JPEG Support' => 'JPEG',
            'PNG Support' => 'PNG',
            'WebP Support' => 'WEBP',
        ];

        foreach ($requiredSupport as $key => $label) {
            if (($gdInfo[$key] ?? false) !== true) {
                throw new RuntimeException(sprintf('GD is missing %s support.', $label));
            }
        }
    }

    /**
     * Detects and validates the source image type using its actual file contents.
     *
     * @throws InvalidArgumentException If the file is not JPEG, PNG, or WEBP.
     */
    private function detectImageType(string $filePath): int
    {
        $header = file_get_contents($filePath, false, null, 0, 16);

        if ($header === false) {
            throw new RuntimeException(sprintf('Failed to read image header: %s', $filePath));
        }

        if (!$this->hasSupportedImageSignature($header)) {
            throw new InvalidArgumentException(
                'Unsupported image type. Only JPEG, PNG, and WEBP images are accepted.'
            );
        }

        $imageInfo = getimagesize($filePath);

        if ($imageInfo === false) {
            throw new InvalidArgumentException(
                'Unsupported image type. Only JPEG, PNG, and WEBP images are accepted.'
            );
        }

        $imageType = (int) ($imageInfo[2] ?? 0);

        if (!array_key_exists($imageType, self::EXTENSIONS_BY_TYPE)) {
            throw new InvalidArgumentException(
                'Unsupported image type. Only JPEG, PNG, and WEBP images are accepted.'
            );
        }

        return $imageType;
    }

    /**
     * Checks for supported image magic bytes before calling GD metadata readers.
     */
    private function hasSupportedImageSignature(string $header): bool
    {
        return str_starts_with($header, "\xFF\xD8\xFF")
            || str_starts_with($header, "\x89PNG\r\n\x1A\n")
            || (str_starts_with($header, 'RIFF') && substr($header, 8, 4) === 'WEBP');
    }

    /**
     * Creates a GD image from the source file.
     */
    private function createImageResource(string $filePath, int $imageType): GdImage
    {
        $image = match ($imageType) {
            IMAGETYPE_JPEG => imagecreatefromjpeg($filePath),
            IMAGETYPE_PNG => imagecreatefrompng($filePath),
            IMAGETYPE_WEBP => imagecreatefromwebp($filePath),
            default => false,
        };

        if (!$image instanceof GdImage) {
            throw new RuntimeException(sprintf('Failed to load image from file: %s', $filePath));
        }

        return $image;
    }

    /**
     * Resizes the image proportionally when it exceeds the maximum long edge.
     */
    private function resizeIfNeeded(GdImage $image): ?GdImage
    {
        $originalWidth = imagesx($image);
        $originalHeight = imagesy($image);
        $longestSide = max($originalWidth, $originalHeight);

        if ($longestSide <= self::MAX_DIMENSION) {
            return null;
        }

        $scaleFactor = self::MAX_DIMENSION / $longestSide;
        $newWidth = max(1, (int) round($originalWidth * $scaleFactor));
        $newHeight = max(1, (int) round($originalHeight * $scaleFactor));
        $resized = imagecreatetruecolor($newWidth, $newHeight);

        if (!$resized instanceof GdImage) {
            throw new RuntimeException('Failed to create resized image canvas.');
        }

        imagealphablending($resized, false);
        imagesavealpha($resized, true);

        if (!imagecopyresampled(
            $resized,
            $image,
            0,
            0,
            0,
            0,
            $newWidth,
            $newHeight,
            $originalWidth,
            $originalHeight
        )) {
            imagedestroy($resized);
            throw new RuntimeException('Failed to resample image during resize.');
        }

        return $resized;
    }

    /**
     * Detects whether a PNG image contains transparent or semi-transparent pixels.
     */
    private function hasTransparency(GdImage $image): bool
    {
        if (imagecolortransparent($image) >= 0) {
            return true;
        }

        $width = imagesx($image);
        $height = imagesy($image);

        for ($x = 0; $x < $width; $x++) {
            for ($y = 0; $y < $height; $y++) {
                $rgba = imagecolorat($image, $x, $y);
                $alpha = ($rgba >> 24) & 0x7F;

                if ($alpha > 0) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Generates a collision-resistant stored filename.
     */
    private function generateUniqueFilename(string $extension): string
    {
        return bin2hex(random_bytes(16)) . '.' . $extension;
    }

    /**
     * Writes the processed image to disk.
     */
    private function saveImage(GdImage $image, string $outputPath, bool $saveAsPng): void
    {
        if ($saveAsPng) {
            imagealphablending($image, false);
            imagesavealpha($image, true);
            $success = imagepng($image, $outputPath, self::PNG_COMPRESSION);
        } else {
            $success = imagejpeg($image, $outputPath, self::JPEG_QUALITY);
        }

        if (!$success) {
            $this->deletePartialFile($outputPath);

            throw new RuntimeException(sprintf('Failed to save compressed image to: %s', $outputPath));
        }
    }

    /**
     * Removes a partial output file after a failed write.
     */
    private function deletePartialFile(string $outputPath): void
    {
        if (!is_file($outputPath)) {
            return;
        }

        if (!is_writable($outputPath)) {
            error_log(sprintf('Partial image file is not writable and could not be removed: %s', $outputPath));
            return;
        }

        if (!unlink($outputPath)) {
            error_log(sprintf('Failed to remove partial image file: %s', $outputPath));
        }
    }
}
