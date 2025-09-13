-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1:3306
-- Время создания: Сен 13 2025 г., 19:47
-- Версия сервера: 8.0.19
-- Версия PHP: 7.1.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `doctor_heights`
--

-- --------------------------------------------------------

--
-- Структура таблицы `auth_users`
--

CREATE TABLE `auth_users` (
  `id` int NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `auth_users`
--

INSERT INTO `auth_users` (`id`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'admin@doctorheights.pk', '$2a$10$FfZ7FDockeLHCbVm/T4aEeEOrmYATtqs4zCVQtewjnxi1wKWTzWMe', 'admin', '2025-03-18 07:43:48');

-- --------------------------------------------------------

--
-- Структура таблицы `ownership_history`
--

CREATE TABLE `ownership_history` (
  `id` int NOT NULL,
  `property_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_id` int NOT NULL,
  `from_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `to_date` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `properties`
--

CREATE TABLE `properties` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `floor` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_owner_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `transactions`
--

CREATE TABLE `transactions` (
  `id` int NOT NULL,
  `property_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_owner_id` int DEFAULT NULL,
  `new_owner_id` int NOT NULL,
  `status` enum('pending','approved','rejected','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `payment_schedule` json DEFAULT NULL,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `payment_status` enum('not_started','in_progress','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'not_started',
  `witness1_id` int DEFAULT NULL,
  `witness2_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `transaction_documents`
--

CREATE TABLE `transaction_documents` (
  `id` int NOT NULL,
  `transaction_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('contract','id_proof','payment_proof') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `transaction_files`
--

CREATE TABLE `transaction_files` (
  `id` int NOT NULL,
  `transaction_id` int NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('agreement','receipt','video','proof_documents') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `transaction_payments`
--

CREATE TABLE `transaction_payments` (
  `id` int NOT NULL,
  `transaction_id` int NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_method` enum('cash','bank_transfer','check') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','paid','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `receipt_file_id` int DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `transaction_witnesses`
--

CREATE TABLE `transaction_witnesses` (
  `id` int NOT NULL,
  `transaction_id` int NOT NULL,
  `witness_type` enum('witness1','witness2') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnic` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `transfer_requests`
--

CREATE TABLE `transfer_requests` (
  `id` int NOT NULL,
  `property_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `requester_id` int NOT NULL,
  `requester_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `requester_cnic` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `admin_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnic` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('active','blocked','archived') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `role` enum('user','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `cnic`, `phone`, `address`, `status`, `role`, `created_at`) VALUES
(6, 'Rifat Sajid', 'Rifat302', '$2a$10$MLe9P7DIU9LTxkm4ouVt6OjaisdeqEXA6UlD/53YJ.MtR5E9mTxq2', '42201-8557410-2', '+923332438817', 'Apartment Number 302', 'archived', 'user', '2025-08-25 05:04:17'),
(7, 'Trst', 'trst_8751', '$2a$10$wl7POSlpQs2XLflRJk/ZdeIE5zvg.NfKWfQ/4SVPLOe.iLMacvaoa', '12345-1234567-1', '+923001234567', 'dsadas', 'active', 'user', '2025-08-25 11:32:16');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `auth_users`
--
ALTER TABLE `auth_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Индексы таблицы `ownership_history`
--
ALTER TABLE `ownership_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_property` (`property_id`),
  ADD KEY `idx_owner` (`owner_id`);

--
-- Индексы таблицы `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_current_owner` (`current_owner_id`);

--
-- Индексы таблицы `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_property` (`property_id`),
  ADD KEY `idx_previous_owner` (`previous_owner_id`),
  ADD KEY `idx_new_owner` (`new_owner_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_owner_status` (`new_owner_id`,`status`),
  ADD KEY `witness1_id` (`witness1_id`),
  ADD KEY `witness2_id` (`witness2_id`);

--
-- Индексы таблицы `transaction_documents`
--
ALTER TABLE `transaction_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_transaction` (`transaction_id`);

--
-- Индексы таблицы `transaction_files`
--
ALTER TABLE `transaction_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transaction_id` (`transaction_id`);

--
-- Индексы таблицы `transaction_payments`
--
ALTER TABLE `transaction_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_transaction_payments_transaction` (`transaction_id`),
  ADD KEY `fk_transaction_payments_receipt` (`receipt_file_id`);

--
-- Индексы таблицы `transaction_witnesses`
--
ALTER TABLE `transaction_witnesses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transaction_id` (`transaction_id`);

--
-- Индексы таблицы `transfer_requests`
--
ALTER TABLE `transfer_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `requester_id` (`requester_id`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `cnic` (`cnic`),
  ADD UNIQUE KEY `idx_email` (`email`),
  ADD UNIQUE KEY `idx_cnic` (`cnic`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `auth_users`
--
ALTER TABLE `auth_users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT для таблицы `ownership_history`
--
ALTER TABLE `ownership_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT для таблицы `properties`
--
ALTER TABLE `properties`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT для таблицы `transaction_documents`
--
ALTER TABLE `transaction_documents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `transaction_files`
--
ALTER TABLE `transaction_files`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT для таблицы `transaction_payments`
--
ALTER TABLE `transaction_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT для таблицы `transaction_witnesses`
--
ALTER TABLE `transaction_witnesses`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT для таблицы `transfer_requests`
--
ALTER TABLE `transfer_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`current_owner_id`) REFERENCES `users` (`id`);

--
-- Ограничения внешнего ключа таблицы `transaction_documents`
--
ALTER TABLE `transaction_documents`
  ADD CONSTRAINT `transaction_documents_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`);

--
-- Ограничения внешнего ключа таблицы `transaction_files`
--
ALTER TABLE `transaction_files`
  ADD CONSTRAINT `transaction_files_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `transaction_payments`
--
ALTER TABLE `transaction_payments`
  ADD CONSTRAINT `fk_transaction_payments_receipt` FOREIGN KEY (`receipt_file_id`) REFERENCES `transaction_files` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_transaction_payments_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaction_payments_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaction_payments_ibfk_2` FOREIGN KEY (`receipt_file_id`) REFERENCES `transaction_files` (`id`) ON DELETE SET NULL;

--
-- Ограничения внешнего ключа таблицы `transaction_witnesses`
--
ALTER TABLE `transaction_witnesses`
  ADD CONSTRAINT `transaction_witnesses_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `transfer_requests`
--
ALTER TABLE `transfer_requests`
  ADD CONSTRAINT `transfer_requests_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
