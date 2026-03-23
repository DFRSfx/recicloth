-- --------------------------------------------------------
-- Anfitrião:                    127.0.0.1
-- Versão do servidor:           10.4.32-MariaDB - mariadb.org binary distribution
-- SO do servidor:               Win64
-- HeidiSQL Versão:              12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- A despejar estrutura da base de dados para arte_em_ponto
CREATE DATABASE IF NOT EXISTS `arte_em_ponto` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `arte_em_ponto`;

-- A despejar estrutura para tabela arte_em_ponto.cart_items
CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `product_id` int(10) unsigned NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  UNIQUE KEY `unique_session_product` (`session_id`,`product_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_quantity` CHECK (`quantity` > 0),
  CONSTRAINT `chk_user_or_session` CHECK (`user_id` is not null and `session_id` is null or `user_id` is null and `session_id` is not null)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A despejar dados para tabela arte_em_ponto.cart_items: ~0 rows (aproximadamente)
DELETE FROM `cart_items`;

-- A despejar estrutura para tabela arte_em_ponto.categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID da categoria (1-255)',
  `name` varchar(50) NOT NULL COMMENT 'Nome da categoria',
  `slug` varchar(60) NOT NULL COMMENT 'URL-friendly identifier (ex: toalhas-bordadas)',
  `description` varchar(500) DEFAULT NULL COMMENT 'Descrição da categoria',
  `image` varchar(255) DEFAULT NULL COMMENT 'URL da imagem da categoria',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_slug` (`slug`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Categorias de produtos';

-- A despejar dados para tabela arte_em_ponto.categories: ~4 rows (aproximadamente)
DELETE FROM `categories`;
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image`, `created_at`) VALUES
	(1, 'Malas', 'malas', 'Malas únicas em crochê', NULL, '2025-10-28 01:00:00'),
	(2, 'Acessórios', 'acessorios', 'Peças únicas em crochê', NULL, '2025-10-28 01:00:00'),
	(3, 'Terços', 'tercos', 'Peças únicas em crochê', NULL, '2025-10-28 01:00:00'),
	(4, 'Roupa', 'roupa', 'Peças únicas em crochê', NULL, '2025-10-28 01:00:00');

-- A despejar estrutura para evento arte_em_ponto.cleanup_expired_email_verification_tokens
DELIMITER //
CREATE EVENT `cleanup_expired_email_verification_tokens` ON SCHEDULE EVERY 1 HOUR STARTS '2025-10-28 23:07:29' ON COMPLETION NOT PRESERVE ENABLE DO DELETE FROM email_verification_tokens 
  WHERE expires_at < NOW() OR is_used = TRUE//
DELIMITER ;

-- A despejar estrutura para evento arte_em_ponto.cleanup_expired_password_tokens
DELIMITER //
CREATE EVENT `cleanup_expired_password_tokens` ON SCHEDULE EVERY 1 HOUR STARTS '2025-10-28 22:51:29' ON COMPLETION NOT PRESERVE ENABLE DO DELETE FROM password_reset_tokens 
  WHERE expires_at < NOW() OR is_used = TRUE//
DELIMITER ;

-- A despejar estrutura para evento arte_em_ponto.cleanup_expired_verification_tokens
DELIMITER //
CREATE EVENT `cleanup_expired_verification_tokens` ON SCHEDULE EVERY 1 HOUR STARTS '2025-10-28 22:51:29' ON COMPLETION NOT PRESERVE ENABLE DO UPDATE users 
  SET email_verification_token = NULL, 
      email_verification_expires = NULL 
  WHERE email_verification_expires < NOW() 
  AND email_verified = FALSE//
DELIMITER ;

-- A despejar estrutura para evento arte_em_ponto.cleanup_old_password_attempts
DELIMITER //
CREATE EVENT `cleanup_old_password_attempts` ON SCHEDULE EVERY 6 HOUR STARTS '2025-10-28 22:51:29' ON COMPLETION NOT PRESERVE ENABLE DO DELETE FROM password_reset_attempts 
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)//
DELIMITER ;

-- A despejar estrutura para evento arte_em_ponto.cleanup_unverified_accounts
DELIMITER //
CREATE EVENT `cleanup_unverified_accounts` ON SCHEDULE EVERY 15 MINUTE STARTS '2025-10-29 00:53:25' ON COMPLETION PRESERVE ENABLE DO DELETE FROM users 
WHERE email_verified = FALSE 
AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)//
DELIMITER ;

-- A despejar estrutura para tabela arte_em_ponto.email_verification_tokens
CREATE TABLE IF NOT EXISTS `email_verification_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `email_verification_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A despejar dados para tabela arte_em_ponto.email_verification_tokens: ~0 rows (aproximadamente)
DELETE FROM `email_verification_tokens`;

-- A despejar estrutura para tabela arte_em_ponto.favorites
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `product_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  UNIQUE KEY `unique_session_product` (`session_id`,`product_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_fav_user_or_session` CHECK (`user_id` is not null and `session_id` is null or `user_id` is null and `session_id` is not null)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A despejar dados para tabela arte_em_ponto.favorites: ~0 rows (aproximadamente)
DELETE FROM `favorites`;

-- A despejar estrutura para tabela arte_em_ponto.hero_slides
CREATE TABLE IF NOT EXISTS `hero_slides` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `button_text` varchar(100) NOT NULL,
  `button_link` varchar(255) NOT NULL,
  `text_color` enum('white','dark') DEFAULT 'white',
  `display_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_display_order` (`display_order`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A despejar dados para tabela arte_em_ponto.hero_slides: ~3 rows (aproximadamente)
DELETE FROM `hero_slides`;
INSERT INTO `hero_slides` (`id`, `title`, `description`, `button_text`, `button_link`, `text_color`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 'Crochê Feito com Amor', 'Peças únicas e exclusivas, criadas à mão com técnicas tradicionais e materiais de qualidade premium.', 'Explorar      \r\n  Coleção', '/loja', 'white', 1, 1, '2025-10-29 16:20:59', '2025-11-22 15:24:11'),
	(2, 'Novidades da Temporada', 'Descubra as últimas criações do nosso ateliê. Designs exclusivos que combinam tradição e modernidade.', 'Ver Novidades', '/loja?filter=new', 'white', 2, 1, '2025-10-29 16:20:59', '2025-11-22 15:24:28'),
	(3, 'Qualidade Garantida', 'Cada peça é única e cuidadosamente trabalhada. Cores vibrantes, acabamentos perfeitos e durabilidade.', 'Produtos em    \r\n   Destaque', '/loja?filter=featured', 'white', 3, 1, '2025-10-29 16:20:59', '2025-11-22 15:18:21');

-- A despejar estrutura para tabela arte_em_ponto.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tracking_token` varchar(64) DEFAULT NULL COMMENT 'Token único para tracking por guests',
  `user_id` int(10) unsigned DEFAULT NULL COMMENT 'ID do utilizador (NULL se guest)',
  `customer_name` varchar(100) NOT NULL COMMENT 'Nome do cliente',
  `customer_email` varchar(100) NOT NULL COMMENT 'Email do cliente',
  `customer_phone` varchar(20) NOT NULL COMMENT 'Telemóvel do cliente',
  `customer_address` varchar(200) NOT NULL COMMENT 'Morada completa',
  `customer_city` varchar(60) NOT NULL COMMENT 'Cidade',
  `customer_postal_code` varchar(10) NOT NULL COMMENT 'Código postal (XXXX-XXX)',
  `total` decimal(10,2) NOT NULL COMMENT 'Valor total do pedido',
  `status` enum('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  `payment_status` enum('pending','paid','failed','expired') NOT NULL DEFAULT 'pending',
  `payment_method` varchar(30) NOT NULL COMMENT 'Método de pagamento',
  `payment_reference` varchar(50) DEFAULT NULL COMMENT 'Referência Multibanco ou MB WAY transaction ID',
  `payment_entity` varchar(10) DEFAULT NULL COMMENT 'Entidade Multibanco',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payment_intent_id` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tracking_token` (`tracking_token`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_customer_email` (`customer_email`),
  KEY `idx_status_created` (`status`,`created_at`) COMMENT 'Para dashboard admin',
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_customer_email_tracking` (`customer_email`,`tracking_token`),
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pedidos de clientes';

-- A despejar dados para tabela arte_em_ponto.orders: ~0 rows (aproximadamente)
DELETE FROM `orders`;

-- A despejar estrutura para tabela arte_em_ponto.order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(10) unsigned NOT NULL COMMENT 'ID do pedido',
  `product_id` int(10) unsigned NOT NULL COMMENT 'ID do produto',
  `quantity` smallint(5) unsigned NOT NULL COMMENT 'Quantidade comprada',
  `price` decimal(8,2) NOT NULL COMMENT 'Preço unitário (snapshot)',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `fk_orderitem_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_orderitem_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Itens de cada pedido';

-- A despejar dados para tabela arte_em_ponto.order_items: ~0 rows (aproximadamente)
DELETE FROM `order_items`;

-- A despejar estrutura para tabela arte_em_ponto.password_reset_attempts
CREATE TABLE IF NOT EXISTS `password_reset_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `email` varchar(255) NOT NULL,
  `attempt_count` int(11) DEFAULT 1,
  `blocked_until` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_ip_email` (`ip_address`,`email`),
  KEY `idx_blocked_until` (`blocked_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A despejar dados para tabela arte_em_ponto.password_reset_attempts: ~0 rows (aproximadamente)
DELETE FROM `password_reset_attempts`;

-- A despejar estrutura para tabela arte_em_ponto.password_reset_tokens
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_token_hash` (`token_hash`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A despejar dados para tabela arte_em_ponto.password_reset_tokens: ~0 rows (aproximadamente)
DELETE FROM `password_reset_tokens`;

-- A despejar estrutura para tabela arte_em_ponto.pending_checkouts
CREATE TABLE IF NOT EXISTS `pending_checkouts` (
  `payment_intent_id` varchar(128) NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`payment_intent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A despejar dados para tabela arte_em_ponto.pending_checkouts: ~0 rows (aproximadamente)
DELETE FROM `pending_checkouts`;

-- A despejar estrutura para tabela arte_em_ponto.products
CREATE TABLE IF NOT EXISTS `products` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT 'Nome do produto',
  `description` text NOT NULL COMMENT 'Descrição detalhada',
  `price` decimal(8,2) NOT NULL COMMENT 'Preço em euros (máx: 999999.99)',
  `category_id` tinyint(3) unsigned NOT NULL COMMENT 'ID da categoria',
  `stock` smallint(5) unsigned NOT NULL DEFAULT 0 COMMENT 'Quantidade em stock (0-65535)',
  `featured` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Produto em destaque?',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `colors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of available colors for this product' CHECK (json_valid(`colors`)),
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_featured` (`featured`),
  KEY `idx_stock` (`stock`),
  KEY `idx_price` (`price`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_category_featured` (`category_id`,`featured`) COMMENT 'Composite index para queries comuns',
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Produtos da loja';

-- A despejar dados para tabela arte_em_ponto.products: ~12 rows (aproximadamente)
DELETE FROM `products`;
INSERT INTO `products` (`id`, `name`, `description`, `price`, `category_id`, `stock`, `featured`, `created_at`, `updated_at`, `colors`, `images`) VALUES
	(1, 'Red Perla', 'Exclusiva. Atemporal. Feita para brilhar com contigo!✨', 10.00, 1, 15, 0, '2025-10-28 01:00:00', '2026-02-28 10:10:41', '["Vermelho"]', '["/produtos/1/image-1-1.webp","/produtos/1/image-2-1.webp","/produtos/1/image-3-1.webp"]'),
	(2, 'Bolsa Chocolate 🍫', 'Mas quem é que consegue resistir? 😋', 10.00, 1, 10, 0, '2025-10-28 01:00:00', '2026-02-28 10:10:41', '["Castanho"]', '["/produtos/2/image-1-2.webp","/produtos/2/image-2-2.webp","/produtos/2/image-3-2.webp"]'),
	(5, 'Red Perla Medium', 'O mesmo charme, mas em tamanho médio. ', 10.00, 1, 15, 0, '2025-10-29 02:23:54', '2026-02-28 10:10:41', '["Vermelho"]', '["/produtos/5/image-1-5.webp","/produtos/5/image-2-5.webp","/produtos/5/image-3-5.webp"]'),
	(6, 'Autumn whisper', 'A bolsa do teu outono 🍂 ', 10.00, 1, 11, 1, '2025-10-29 02:28:41', '2026-02-28 11:06:51', '["Castanho"]', '["/produtos/6/image-1-6.webp","/produtos/6/image-2-6.webp"]'),
	(7, 'Aurora Bordeaux', 'Ela rouba a cena por onde passa! 💃\r\nA nova Aurora Bordeaux chegou para dar um toque vibrante ao seu dia a dia.\r\nHá detalhes que fazem a diferença.\r\nGaranta a sua antes que acabe! 🔥', 10.00, 1, 15, 0, '2025-10-29 02:31:01', '2026-02-28 10:10:41', '["Bordô"]', '["/produtos/7/image-1-7.webp","/produtos/7/image-2-7.webp"]'),
	(8, 'Bolsa Winter Sky 💙', 'Azul, como a elegância deve ser.\r\nFeita à mão, com textura, estilo e um toque artesanal que encanta em cada detalhe. 👜💫', 10.00, 1, 15, 1, '2025-10-29 02:33:20', '2026-02-28 10:10:41', '["Azul"]', '["/produtos/8/image-1-8.webp","/produtos/8/image-2-8.webp","/produtos/8/image-3-8.webp"]'),
	(9, 'Bolsa Vitória 🩶', 'Textura, estilo e autenticidade: o trio perfeito para qualquer ocasião. ✨\r\nAdquire já a tua.', 10.00, 1, 15, 1, '2025-10-29 02:34:29', '2026-02-28 10:10:41', '["Castanho"]', '["/produtos/9/image-1-9.webp","/produtos/9/image-2-9.webp","/produtos/9/image-3-9.webp"]'),
	(10, 'Hand Bag Cabernet ✨🌺', 'Esta elegante mala combina sofisticação e charme em cada detalhe. Feita à mão com fios de tom vinho, apresenta uma textura trançada que confere um toque único e artesanal. Esta mala é um símbolo de arte, estilo e originalidade.', 10.00, 1, 15, 1, '2025-10-29 02:35:32', '2026-02-28 10:10:41', '["Vermelho"]', '["/produtos/10/image-1-10.webp","/produtos/10/image-2-10.webp","/produtos/10/image-3-10.webp"]'),
	(11, 'Bolsa Ianna 💜', 'Aquela que combina com TUDO, mas que combina especialmente contigo. 😊', 10.00, 1, 5, 1, '2025-10-29 02:37:24', '2026-02-28 11:06:51', '["Rosa"]', '["/produtos/11/image-1-11.webp","/produtos/11/image-2-11.webp","/produtos/11/image-3-11.webp"]'),
	(12, 'Clutch Gris 🩶', 'Um acessório perfeito tanto para de dia, como para de noite.\r\nDeslumbra com ela ✨', 10.00, 1, 15, 1, '2025-10-29 02:38:22', '2026-02-28 10:10:41', '["Azul"]', '["/produtos/12/image-1-12.webp","/produtos/12/image-2-12.webp"]'),
	(13, 'Clutch Amonet ✨❤️', 'O brilho que precisas na tua vida!! ', 10.00, 1, 15, 1, '2025-10-29 02:39:25', '2026-02-28 10:10:41', '["Vermelho"]', '["/produtos/13/image-1-13.webp","/produtos/13/image-2-13.webp"]'),
	(14, 'Mala Juno 🖤', 'A mala que é puro poder no look!', 10.00, 1, 11, 1, '2025-10-29 02:40:14', '2026-02-28 10:10:41', '["Preto"]', '["/produtos/14/image-1-14.webp","/produtos/14/image-2-14.webp"]');

-- A despejar estrutura para tabela arte_em_ponto.shipping_addresses
CREATE TABLE IF NOT EXISTS `shipping_addresses` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL COMMENT 'ID do utilizador',
  `name` varchar(100) NOT NULL COMMENT 'Nome para a morada (ex: Casa, Trabalho)',
  `address` varchar(200) NOT NULL COMMENT 'Morada completa',
  `city` varchar(60) NOT NULL COMMENT 'Cidade',
  `postal_code` varchar(10) NOT NULL COMMENT 'Código postal (XXXX-XXX)',
  `phone` varchar(20) NOT NULL COMMENT 'Telemóvel',
  `is_default` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Morada predefinida',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_default` (`is_default`),
  CONSTRAINT `fk_shipping_address_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Moradas de entrega guardadas';

-- A despejar dados para tabela arte_em_ponto.shipping_addresses: ~0 rows (aproximadamente)
DELETE FROM `shipping_addresses`;

-- A despejar estrutura para tabela arte_em_ponto.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL COMMENT 'Email do utilizador',
  `google_id` varchar(255) DEFAULT NULL,
  `avatar_url` text DEFAULT NULL,
  `password` varchar(255) NOT NULL COMMENT 'Password hash (bcrypt)',
  `name` varchar(100) NOT NULL COMMENT 'Nome completo',
  `n_telemovel` varchar(20) DEFAULT NULL COMMENT 'Número de telemóvel (formato: +351 XXX XXX XXX)',
  `role` enum('customer','admin') NOT NULL DEFAULT 'customer' COMMENT 'Tipo de utilizador',
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active' COMMENT 'Estado da conta',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `email_verified` tinyint(1) DEFAULT 0,
  `email_verification_token` varchar(255) DEFAULT NULL,
  `email_verification_expires` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `google_id` (`google_id`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_email_verification_token` (`email_verification_token`),
  KEY `idx_email_verification_expires` (`email_verification_expires`),
  KEY `idx_users_google_id` (`google_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Utilizadores do sistema (clientes e administradores)';

-- A despejar dados para tabela arte_em_ponto.users: ~5 rows (aproximadamente)
DELETE FROM `users`;
INSERT INTO `users` (`id`, `email`, `google_id`, `avatar_url`, `password`, `name`, `n_telemovel`, `role`, `status`, `created_at`, `updated_at`, `email_verified`, `email_verification_token`, `email_verification_expires`) VALUES
	(11, 'dariosoares2005@gmail.com', '104254433210661164654', 'https://lh3.googleusercontent.com/a/ACg8ocIo1F46G6ZvJQidZ2zoZOu70o6vF5L2WBL3AVZEZrUdhkklTOg=s96-c', '', 'Conta Testes', NULL, 'admin', 'active', '2025-10-28 23:21:16', '2026-02-27 22:13:55', 1, NULL, NULL),
	(13, 'dariofrsoares@gmail.com', '114843328516608538371', 'https://lh3.googleusercontent.com/a/ACg8ocIo1F46G6ZvJQidZ2zoZOu70o6vF5L2WBL3AVZEZrUdhkklTOg=s96-c', '', 'Dário', NULL, 'customer', 'active', '2025-11-22 19:12:27', '2025-11-22 19:12:27', 1, NULL, NULL),
	(15, 'flexrpbase@gmail.com', '106664284189037404671', 'https://lh3.googleusercontent.com/a/ACg8ocK_rTMGk9ol2a2d44FL7yRYJNpnJQC9YNYJ22MGJsh1PMQoZtLW=s96-c', '', 'Dário Soares', NULL, 'customer', 'active', '2026-02-27 18:03:30', '2026-02-27 18:03:30', 1, NULL, NULL),
	(16, '1beatrizpereiralima@gmail.com', '112862276961180743162', 'https://lh3.googleusercontent.com/a/ACg8ocKAsm2ph-bzX3UUgY6Yfc_PJo1Z4RPJ2oSIlgBfV8EIkZA6xpeSBg=s96-c', '', 'Beatriz Lima', NULL, 'admin', 'active', '2026-02-27 18:32:57', '2026-02-27 18:33:27', 1, NULL, NULL),
	(17, 'gabrielasapereira@gmail.com', '106668106585378495692', 'https://lh3.googleusercontent.com/a/ACg8ocIlKHqRyqdxgLTsaR55yPoTro6FddjgycLt2Omdyds_Qg9mMP6Tqw=s96-c', '', 'Gabriela Pereira', NULL, 'customer', 'active', '2026-02-27 18:34:00', '2026-02-27 18:34:00', 1, NULL, NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
