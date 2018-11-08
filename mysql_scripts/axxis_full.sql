-- MySQL dump 10.13  Distrib 5.5.54, for debian-linux-gnu (armv7l)
--
-- Host: localhost    Database: ibspiui
-- ------------------------------------------------------
-- Server version	5.5.54-0+deb8u1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `archives`
--

DROP TABLE IF EXISTS `archives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `archives` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `x` int(11) DEFAULT NULL COMMENT 'Position on the system status page',
  `y` int(11) DEFAULT NULL COMMENT 'Position on the system status page',
  `serial` varchar(45) DEFAULT NULL,
  `type_id` int(11) DEFAULT NULL,
  `key_switch_status` int(11) DEFAULT NULL,
  `communication_status` int(11) DEFAULT NULL,
  `blast_armed` int(11) DEFAULT NULL,
  `fire_button` int(11) DEFAULT NULL,
  `isolation_relay` int(11) DEFAULT NULL,
  `cable_fault` int(11) DEFAULT NULL,
  `earth_leakage` int(11) DEFAULT NULL,
  `detonator_status` int(11) DEFAULT NULL,
  `partial_blast_lfs` int(11) DEFAULT NULL,
  `full_blast_lfs` int(11) DEFAULT NULL,
  `booster_fired_lfs` int(11) DEFAULT NULL,
  `missing_pulse_detected_lfs` int(11) DEFAULT NULL,
  `DC_supply_voltage_status` int(11) DEFAULT NULL,
  `mains` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime DEFAULT NULL,
  `comment` varchar(45) DEFAULT NULL,
  `window_id` int(11) DEFAULT NULL,
  `shaft_fault` int(11) DEFAULT NULL,
  `low_bat` int(11) DEFAULT NULL,
  `too_low_bat` int(11) DEFAULT NULL,
  `delay` int(11) DEFAULT NULL,
  `program` int(11) DEFAULT NULL,
  `calibration` int(11) DEFAULT NULL,
  `det_fired` int(11) DEFAULT NULL,
  `tagged` int(11) DEFAULT NULL,
  `energy_storing` int(11) DEFAULT NULL,
  `bridge_wire` int(11) DEFAULT NULL,
  `dets_length` int(11) DEFAULT NULL,
  `temperature` int(11) DEFAULT NULL,
  `AC_supply_voltage_lfs` int(11) DEFAULT NULL,
  `DC_supply_voltage` int(11) DEFAULT NULL,
  `communication_flag` int(11) DEFAULT NULL,
  `logged` int(11) DEFAULT NULL,
  `led_state` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archives`
--

LOCK TABLES `archives` WRITE;
/*!40000 ALTER TABLE `archives` DISABLE KEYS */;
/*!40000 ALTER TABLE `archives` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `incoming_packets`
--

DROP TABLE IF EXISTS `incoming_packets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `incoming_packets` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `start` char(16) DEFAULT NULL,
  `length` char(8) DEFAULT NULL,
  `command` char(8) DEFAULT NULL,
  `serial` char(16) DEFAULT NULL,
  `data_device_type` char(3) DEFAULT NULL,
  `data_device_id` char(5) DEFAULT NULL,
  `data_raw_bit_0` char(1) DEFAULT NULL,
  `data_raw_bit_1` char(1) DEFAULT NULL,
  `data_raw_bit_2` char(1) DEFAULT NULL,
  `data_raw_bit_3` char(1) DEFAULT NULL,
  `data_raw_bit_4` char(1) DEFAULT NULL,
  `data_raw_bit_5` char(1) DEFAULT NULL,
  `data_raw_bit_6` char(1) DEFAULT NULL,
  `data_raw_bit_7` char(1) DEFAULT NULL,
  `crc` char(16) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=966656 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `incoming_packets`
--

LOCK TABLES `incoming_packets` WRITE;
/*!40000 ALTER TABLE `incoming_packets` DISABLE KEYS */;
INSERT INTO `incoming_packets` VALUES (966655,'aaaa0c05003c00001828b915','1010101010101010','00001100','00000101','0000000000111100',NULL,NULL,'0','0','0','0','1','0','0','0','1011100100010101','2018-05-15 08:14:09');
/*!40000 ALTER TABLE `incoming_packets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` text,
  `node_serial` varchar(45) DEFAULT NULL COMMENT 'Using serial, rather than link to db, because node configuration might change. The serial can always be searched through the node database, but if id is no longer valid it does not work anymore.',
  `created` datetime DEFAULT NULL,
  `modified` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9524 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logs`
--

LOCK TABLES `logs` WRITE;
/*!40000 ALTER TABLE `logs` DISABLE KEYS */;
INSERT INTO `logs` VALUES (9522,'Power Supply Connected','60','2018-05-15 10:14:10','2018-05-15 10:14:10'),(9523,'Battery Charged','60','2018-05-15 10:14:10','2018-05-15 10:14:10');
/*!40000 ALTER TABLE `logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nodes`
--

DROP TABLE IF EXISTS `nodes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nodes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `x` int(11) DEFAULT NULL COMMENT 'Position on the system status page',
  `y` int(11) DEFAULT NULL COMMENT 'Position on the system status page',
  `serial` varchar(45) DEFAULT NULL,
  `type_id` int(11) DEFAULT NULL,
  `key_switch_status` int(11) DEFAULT NULL,
  `communication_status` int(11) DEFAULT NULL,
  `blast_armed` int(11) DEFAULT NULL,
  `fire_button` int(11) DEFAULT NULL,
  `isolation_relay` int(11) DEFAULT NULL,
  `cable_fault` int(11) DEFAULT NULL,
  `earth_leakage` int(11) DEFAULT NULL,
  `detonator_status` int(11) DEFAULT NULL,
  `partial_blast_lfs` int(11) DEFAULT NULL,
  `full_blast_lfs` int(11) DEFAULT NULL,
  `booster_fired_lfs` int(11) DEFAULT NULL,
  `detonator_lfs` varchar(35) DEFAULT NULL,
  `missing_pulse_detected_lfs` int(11) DEFAULT NULL,
  `DC_supply_voltage_status` int(11) DEFAULT NULL,
  `mains` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `modified` datetime DEFAULT NULL,
  `comment` varchar(45) DEFAULT NULL,
  `window_id` int(11) DEFAULT NULL,
  `shaft_fault` int(11) DEFAULT NULL,
  `low_bat` int(11) DEFAULT NULL,
  `too_low_bat` int(11) DEFAULT NULL,
  `delay` int(11) DEFAULT NULL,
  `program` int(11) DEFAULT NULL,
  `calibration` int(11) DEFAULT NULL,
  `det_fired` int(11) DEFAULT NULL,
  `tagged` int(11) DEFAULT NULL,
  `energy_storing` int(11) DEFAULT NULL,
  `bridge_wire` int(11) DEFAULT NULL,
  `dets_length` int(11) DEFAULT NULL,
  `temperature` int(11) DEFAULT NULL,
  `AC_supply_voltage_lfs` int(11) DEFAULT NULL,
  `DC_supply_voltage` int(11) DEFAULT NULL,
  `communication_flag` int(11) DEFAULT NULL,
  `logged` int(11) DEFAULT NULL,
  `led_state` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nodes`
--

LOCK TABLES `nodes` WRITE;
/*!40000 ALTER TABLE `nodes` DISABLE KEYS */;
INSERT INTO `nodes` VALUES (1,0,0,'2',0,0,1,0,0,1,0,0,0,0,0,0,NULL,0,NULL,NULL,1,NULL,'2018-05-15 10:12:23','',NULL,3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL);
/*!40000 ALTER TABLE `nodes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `value` varchar(45) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `modified` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,'warning_dismiss_delay','10','2016-09-07 08:39:06','2016-09-07 08:39:06'),(2,'network_default_gateway','192.168.0.1','2016-09-07 08:39:13','2016-09-07 08:39:14'),(3,'network_subnet_mask','255.255.255.0','2016-09-07 08:39:38','2016-09-07 08:39:38'),(4,'network_ip','192.168.0.201','2016-09-07 08:49:50','2016-09-07 08:49:50'),(5,'background_image_size_multiply','2','2016-09-07 09:40:16','2016-09-07 09:40:16'),(6,'network_use_dhcp',NULL,'2016-09-07 09:40:43','2016-09-07 09:40:43'),(7,'network_password','AXXISComputer','2016-09-07 09:41:15','2016-09-07 09:41:15'),(8,'network_encryption_type','1','2016-09-07 09:42:07','2016-09-07 09:42:07'),(9,'network_ssid','AXXISWifi',NULL,'2016-09-07 09:43:31'),(10,'background_image_contrast','255','2016-09-07 14:30:11','2016-09-07 14:30:11'),(11,'log_time_to_keep','4','2016-10-04 11:39:11','2016-10-04 11:39:11');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings_confirmed`
--

DROP TABLE IF EXISTS `system_settings_confirmed`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_settings_confirmed` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `value` varchar(45) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `modified` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=723504 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings_confirmed`
--

LOCK TABLES `system_settings_confirmed` WRITE;
/*!40000 ALTER TABLE `system_settings_confirmed` DISABLE KEYS */;
INSERT INTO `system_settings_confirmed` VALUES (723485,'warning_dismiss_delay','10',NULL,NULL),(723486,'network_default_gateway','192.168.0.1',NULL,NULL),(723487,'network_subnet_mask','255.255.255.0',NULL,NULL),(723488,'network_ip','192.168.0.201',NULL,NULL),(723489,'background_image_size_multiply','2',NULL,NULL),(723490,'network_use_dhcp',NULL,NULL,NULL),(723491,'network_password','AXXISComputer',NULL,NULL),(723492,'network_encryption_type','1',NULL,NULL),(723493,'network_ssid','AXXISWifi',NULL,NULL),(723494,'background_image_contrast','255',NULL,NULL),(723495,'log_time_to_keep','4',NULL,NULL),(723500,'confirmed','1',NULL,NULL),(723501,'confirmed_retries','0',NULL,NULL),(723502,'unconfirmed_retries','0',NULL,NULL),(723503,'unconfirmed_password','No password',NULL,NULL);
/*!40000 ALTER TABLE `system_settings_confirmed` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(45) DEFAULT NULL,
  `password` varchar(45) DEFAULT NULL,
  `name` varchar(45) DEFAULT NULL,
  `contact_number` varchar(45) DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `modified` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (11,'service@email.com','00078ed4719ba00960bc65a6009187564934a64b','Service','',99,'2016-06-16 11:51:14','2016-10-05 16:58:36'),(12,'user1@demo.co.za','4e97a5039fb44cc88816d4cbf58b06f8cab141dd','user1','',1,'2016-10-05 16:47:57','2016-10-05 16:47:57'),(13,NULL,NULL,'anyone',NULL,3,NULL,NULL),(14,'user1@axxis.co.za','ee267a6d25afc070fe4c564bc6e3fd7aff2fe71c','','',2,'2016-11-02 13:48:33','2017-09-27 15:35:39'),(15,'julius@bme.co.za','73208f51e208099119e4dd5c4140aa0d3699be79','Julius','0725660602',99,'2018-02-04 23:25:55','2018-05-11 05:13:37'),(16,'Blasting@cdm.co.za','210dcb7de11324156f51118a9b06538910c1eb75','Shiftboss','0792932963',3,'2018-02-19 08:45:30','2018-05-12 03:58:57'),(17,'Sean.pullen@bme.co.za','c0a367ca96a788b316be169d6e6093f419bfb0ac','Sean','0768137186',1,'2018-02-25 01:27:42','2018-02-25 01:27:42');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warnings`
--

DROP TABLE IF EXISTS `warnings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `warnings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` text,
  `acknowledged` tinyint(1) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `modified` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warnings`
--

LOCK TABLES `warnings` WRITE;
/*!40000 ALTER TABLE `warnings` DISABLE KEYS */;
/*!40000 ALTER TABLE `warnings` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-05-15  9:19:12
