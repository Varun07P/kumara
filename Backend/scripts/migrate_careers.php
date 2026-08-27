<?php

declare(strict_types=1);

/**
 * Migration script: Creates the careers table and seeds initial data.
 */

$pdo = new PDO(
    'mysql:host=localhost;port=3308;dbname=gallery_app;charset=utf8mb4',
    'root',
    '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$pdo->exec('CREATE TABLE IF NOT EXISTS careers (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    location    VARCHAR(100) NOT NULL,
    job_type    VARCHAR(50)  NOT NULL DEFAULT \'Full-Time\',
    experience  VARCHAR(100) NOT NULL,
    skills      VARCHAR(255) NULL,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order  INT UNSIGNED NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_careers_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

echo "Table 'careers' created or already exists.\n";

$stmt = $pdo->query('SELECT COUNT(*) FROM careers');
$count = (int) $stmt->fetchColumn();

if ($count === 0) {
    $insert = $pdo->prepare(
        'INSERT INTO careers (title, location, job_type, experience, skills, is_active, sort_order)
         VALUES (:title, :location, :job_type, :experience, :skills, :is_active, :sort_order)'
    );

    $seeds = [
        ['title' => 'Senior Electrical Design Engineer', 'location' => 'Bengaluru Plant', 'job_type' => 'Full-Time', 'experience' => '4-7 Years Exp.', 'skills' => 'AutoCAD / SLDs', 'is_active' => 1, 'sort_order' => 1],
        ['title' => 'Turnkey Project Manager', 'location' => 'Karnataka (On-Site)', 'job_type' => 'Full-Time', 'experience' => '6-10 Years Exp.', 'skills' => 'Substation / CEIG', 'is_active' => 1, 'sort_order' => 2],
        ['title' => 'Panel Testing & QC Engineer', 'location' => 'Bengaluru Lab', 'job_type' => 'Full-Time', 'experience' => '2-5 Years Exp.', 'skills' => 'HV Dielectric / FAT', 'is_active' => 1, 'sort_order' => 3],
        ['title' => 'AutoCAD Electrical Draftsman', 'location' => 'Bengaluru', 'job_type' => 'Full-Time', 'experience' => '1-4 Years Exp.', 'skills' => 'GA Layouts / Schematics', 'is_active' => 1, 'sort_order' => 4],
    ];

    foreach ($seeds as $seed) {
        $insert->execute($seed);
    }

    echo "Seeded 4 career openings.\n";
} else {
    echo "Seed data already exists ({$count} rows). Skipping.\n";
}

echo "Migration complete.\n";
