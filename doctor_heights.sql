-- phpMyAdmin SQL Dump
-- version 5.0.4
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 15, 2025 at 10:34 AM
-- Server version: 5.7.29-log
-- PHP Version: 8.0.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `doctor_heights`
--

-- --------------------------------------------------------

--
-- Table structure for table `auth_users`
--

CREATE TABLE `auth_users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `auth_users`
--

INSERT INTO `auth_users` (`id`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'admin@doctorheights.pk', '$2a$10$FfZ7FDockeLHCbVm/T4aEeEOrmYATtqs4zCVQtewjnxi1wKWTzWMe', 'admin', '2025-03-18 07:43:48');

-- --------------------------------------------------------

--
-- Table structure for table `ownership_history`
--

CREATE TABLE `ownership_history` (
  `id` int(11) NOT NULL,
  `property_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_id` int(11) NOT NULL,
  `from_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `to_date` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ownership_history`
--

INSERT INTO `ownership_history` (`id`, `property_id`, `owner_id`, `from_date`, `to_date`) VALUES
(4, 'LB01 storage', 2, '2025-03-25 12:47:43', NULL),
(5, 'DH01 parking', 2, '2025-03-25 12:47:45', NULL),
(6, 'PH', 4, '2025-04-22 01:52:06', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

CREATE TABLE `properties` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `floor` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_owner_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `property_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_owner_id` int(11) DEFAULT NULL,
  `new_owner_id` int(11) NOT NULL,
  `status` enum('pending','approved','rejected','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `payment_schedule` json DEFAULT NULL,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `payment_status` enum('not_started','in_progress','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'not_started',
  `witness1_id` int(11) DEFAULT NULL,
  `witness2_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `property_id`, `previous_owner_id`, `new_owner_id`, `status`, `created_at`, `updated_at`, `total_amount`, `payment_schedule`, `paid_amount`, `payment_status`, `witness1_id`, `witness2_id`) VALUES
(8, 'LB01 storage', NULL, 2, 'approved', '2025-03-25 06:29:37', '2025-03-25 12:47:43', '10000000.00', NULL, '1000000.00', 'in_progress', NULL, NULL),
(9, 'DH01 parking', NULL, 2, 'approved', '2025-03-25 12:47:39', '2025-03-25 13:30:16', '1000000000.00', NULL, '0.00', 'not_started', NULL, NULL),
(10, 'PH', NULL, 4, 'approved', '2025-04-22 01:33:41', '2025-04-22 02:55:38', '14000000000.00', NULL, '0.00', 'in_progress', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `transaction_documents`
--

CREATE TABLE `transaction_documents` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('contract','id_proof','payment_proof') COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaction_files`
--

CREATE TABLE `transaction_files` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('agreement','receipt','video','proof_documents') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaction_payments`
--

CREATE TABLE `transaction_payments` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_method` enum('cash','bank_transfer','check') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','paid','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `receipt_file_id` int(11) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaction_witnesses`
--

CREATE TABLE `transaction_witnesses` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `witness_type` enum('witness1','witness2') COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnic` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transfer_requests`
--

CREATE TABLE `transfer_requests` (
  `id` int(11) NOT NULL,
  `property_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requester_id` int(11) NOT NULL,
  `requester_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requester_cnic` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `admin_notes` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnic` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(13) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `status` enum('active','blocked') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `cnic`, `phone`, `address`, `status`, `role`, `created_at`, `updated_at`) VALUES
(5, 'fdsfdsfsd', 'fdsfdsfsd_6629', '$2a$10$4v3wmaLIsGR6Z/eZAvyDCOpEDZzubV66O.ugWIh48UTKRmfVgykLq', '12457-1234567-1', '+923001234567', 'dfvsdfsd', 'active', 'user', '2025-07-15 06:11:16', '2025-07-15 06:11:16');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `auth_users`
--
ALTER TABLE `auth_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `ownership_history`
--
ALTER TABLE `ownership_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_property` (`property_id`),
  ADD KEY `idx_owner` (`owner_id`);

--
-- Indexes for table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_current_owner` (`current_owner_id`);

--
-- Indexes for table `transactions`
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
-- Indexes for table `transaction_documents`
--
ALTER TABLE `transaction_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_transaction` (`transaction_id`);

--
-- Indexes for table `transaction_files`
--
ALTER TABLE `transaction_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transaction_id` (`transaction_id`);

--
-- Indexes for table `transaction_payments`
--
ALTER TABLE `transaction_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_transaction_payments_transaction` (`transaction_id`),
  ADD KEY `fk_transaction_payments_receipt` (`receipt_file_id`);

--
-- Indexes for table `transaction_witnesses`
--
ALTER TABLE `transaction_witnesses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transaction_id` (`transaction_id`);

--
-- Indexes for table `transfer_requests`
--
ALTER TABLE `transfer_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `requester_id` (`requester_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `cnic` (`cnic`),
  ADD UNIQUE KEY `idx_email` (`email`),
  ADD UNIQUE KEY `idx_cnic` (`cnic`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `auth_users`
--
ALTER TABLE `auth_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `ownership_history`
--
ALTER TABLE `ownership_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `properties`
--
ALTER TABLE `properties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `transaction_documents`
--
ALTER TABLE `transaction_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transaction_files`
--
ALTER TABLE `transaction_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transaction_payments`
--
ALTER TABLE `transaction_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transaction_witnesses`
--
ALTER TABLE `transaction_witnesses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transfer_requests`
--
ALTER TABLE `transfer_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ownership_history`
--
ALTER TABLE `ownership_history`
  ADD CONSTRAINT `ownership_history_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`current_owner_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`previous_owner_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transactions_ibfk_3` FOREIGN KEY (`new_owner_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transactions_ibfk_4` FOREIGN KEY (`witness1_id`) REFERENCES `transaction_witnesses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transactions_ibfk_5` FOREIGN KEY (`witness2_id`) REFERENCES `transaction_witnesses` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `transaction_documents`
--
ALTER TABLE `transaction_documents`
  ADD CONSTRAINT `transaction_documents_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`);

--
-- Constraints for table `transaction_files`
--
ALTER TABLE `transaction_files`
  ADD CONSTRAINT `transaction_files_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transaction_payments`
--
ALTER TABLE `transaction_payments`
  ADD CONSTRAINT `fk_transaction_payments_receipt` FOREIGN KEY (`receipt_file_id`) REFERENCES `transaction_files` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_transaction_payments_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaction_payments_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaction_payments_ibfk_2` FOREIGN KEY (`receipt_file_id`) REFERENCES `transaction_files` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `transaction_witnesses`
--
ALTER TABLE `transaction_witnesses`
  ADD CONSTRAINT `transaction_witnesses_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transfer_requests`
--
ALTER TABLE `transfer_requests`
  ADD CONSTRAINT `transfer_requests_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
