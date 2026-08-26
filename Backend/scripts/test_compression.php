<?php

declare(strict_types=1);

/**
 * One-off CLI test script for verifying ImageCompressionService.
 *
 * Usage:
 *   php scripts/test_compression.php <path-to-sample-image>
 *
 * Example:
 *   php scripts/test_compression.php C:\Users\smile\Pictures\sample.jpg
 *
 * This script is not part of the API, not reachable through the Router, and
 * must never be exposed as an HTTP endpoint. It exists solely for manual
 * verification during development.
 */

namespace App\Scripts;

use App\Services\ImageCompressionService;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

require_once dirname(__DIR__) . '/vendor/autoload.php';

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only be run from the command line.\n");
    exit(1);
}

if ($argc < 2) {
    fwrite(STDERR, "Usage: php scripts/test_compression.php <path-to-image>\n");
    fwrite(STDERR, "Example: php scripts/test_compression.php C:\\Users\\smile\\Pictures\\sample.jpg\n");
    exit(1);
}

$sourceImagePath = $argv[1];

if (!is_file($sourceImagePath)) {
    fwrite(STDERR, sprintf("Error: File not found: %s\n", $sourceImagePath));
    exit(1);
}

// Use the project's compressed uploads directory as the output target.
$storageDirectory = dirname(__DIR__) . '/public/storage/uploads/compressed';

if (!is_dir($storageDirectory)) {
    fwrite(STDERR, sprintf("Error: Storage directory does not exist: %s\n", $storageDirectory));
    fwrite(STDERR, "Please create it before running this script.\n");
    exit(1);
}

try {
    $originalSize = filesize($sourceImagePath);

    if ($originalSize === false) {
        throw new RuntimeException('Failed to read original file size.');
    }

    $originalInfo = @getimagesize($sourceImagePath);
    $originalDimensions = is_array($originalInfo)
        ? sprintf('%dx%d', $originalInfo[0], $originalInfo[1])
        : 'unknown';

    fwrite(STDOUT, "=== ImageCompressionService Test ===\n\n");
    fwrite(STDOUT, sprintf("Source file:       %s\n", $sourceImagePath));
    fwrite(STDOUT, sprintf("Source dimensions: %s\n", $originalDimensions));
    fwrite(STDOUT, sprintf("Source file size:  %s\n", formatBytes($originalSize)));
    fwrite(STDOUT, "\nCompressing...\n\n");

    $service = new ImageCompressionService($storageDirectory);
    $storedFilename = $service->compress($sourceImagePath, basename($sourceImagePath));

    $compressedPath = $storageDirectory . DIRECTORY_SEPARATOR . $storedFilename;
    $compressedSize = filesize($compressedPath);

    if ($compressedSize === false) {
        throw new RuntimeException('Failed to read compressed file size.');
    }

    $compressedInfo = @getimagesize($compressedPath);
    $compressedDimensions = is_array($compressedInfo)
        ? sprintf('%dx%d', $compressedInfo[0], $compressedInfo[1])
        : 'unknown';

    $reduction = $originalSize > 0
        ? round((1 - ($compressedSize / $originalSize)) * 100, 1)
        : 0.0;

    fwrite(STDOUT, sprintf("Stored filename:       %s\n", $storedFilename));
    fwrite(STDOUT, sprintf("Compressed dimensions: %s\n", $compressedDimensions));
    fwrite(STDOUT, sprintf("Compressed file size:  %s\n", formatBytes($compressedSize)));
    fwrite(STDOUT, sprintf("Size reduction:        %.1f%%\n", $reduction));
    fwrite(STDOUT, sprintf("Full output path:      %s\n", $compressedPath));
    fwrite(STDOUT, "\n✓ Compression test completed successfully.\n");

    exit(0);
} catch (InvalidArgumentException $exception) {
    fwrite(STDERR, sprintf("Validation error: %s\n", $exception->getMessage()));
    exit(1);
} catch (RuntimeException $exception) {
    fwrite(STDERR, sprintf("Runtime error: %s\n", $exception->getMessage()));
    exit(1);
} catch (Throwable $exception) {
    fwrite(STDERR, sprintf("Unexpected error: %s\n", $exception->getMessage()));
    exit(1);
}

/**
 * Formats a byte count into a human-readable string.
 */
function formatBytes(int $bytes): string
{
    if ($bytes < 1024) {
        return sprintf('%d B', $bytes);
    }

    if ($bytes < 1048576) {
        return sprintf('%.1f KB', $bytes / 1024);
    }

    return sprintf('%.2f MB', $bytes / 1048576);
}
