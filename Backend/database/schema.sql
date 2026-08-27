CREATE DATABASE IF NOT EXISTS gallery_app
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE gallery_app;

CREATE TABLE IF NOT EXISTS admin (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS images (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    caption VARCHAR(500) NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS image_placements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    image_id INT UNSIGNED NOT NULL,
    placement ENUM('gallery', 'featured') NOT NULL,
    CONSTRAINT uq_image_placement UNIQUE (image_id, placement),
    CONSTRAINT fk_image_placements_image
        FOREIGN KEY (image_id)
        REFERENCES images (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
    name VARCHAR(50) PRIMARY KEY,
    value VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45) NULL,
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_login_attempts_username_attempted_at (username, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO settings (name, value)
VALUES ('featured_section_visible', '0')
ON DUPLICATE KEY UPDATE value = VALUES(value);

CREATE TABLE IF NOT EXISTS careers (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    location    VARCHAR(100) NOT NULL,
    job_type    VARCHAR(50)  NOT NULL DEFAULT 'Full-Time',
    experience  VARCHAR(100) NOT NULL,
    skills      VARCHAR(255) NULL,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order  INT UNSIGNED NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_careers_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO careers (title, location, job_type, experience, skills, is_active, sort_order) VALUES
('Senior Electrical Design Engineer', 'Bengaluru Plant', 'Full-Time', '4–7 Years Exp.', 'AutoCAD / SLDs', 1, 1),
('Turnkey Project Manager', 'Karnataka (On-Site)', 'Full-Time', '6–10 Years Exp.', 'Substation / CEIG', 1, 2),
('Panel Testing & QC Engineer', 'Bengaluru Lab', 'Full-Time', '2–5 Years Exp.', 'HV Dielectric / FAT', 1, 3),
('AutoCAD Electrical Draftsman', 'Bengaluru', 'Full-Time', '1–4 Years Exp.', 'GA Layouts / Schematics', 1, 4)
ON DUPLICATE KEY UPDATE title = VALUES(title);
