-- ***
-- NOTE: the logs table should already exist if the web application is already installed.
-- ***

CREATE TABLE logs (
   id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
   message TEXT NOT NULL,
   node_serial VARCHAR(45) NULL
);

CREATE TABLE incoming_packets (
  id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  message TEXT NOT NULL,
  start CHAR(16) NULL,
  length CHAR(8) NULL,
  command CHAR(8) NULL,
  serial CHAR(32) NULL,
  data_device_type CHAR(3) NULL,
  data_device_id CHAR(5) NULL,
  data_raw_bit_0 CHAR(1) NULL,
  data_raw_bit_1 CHAR(1) NULL,
  data_raw_bit_2 CHAR(1) NULL,
  data_raw_bit_3 CHAR(1) NULL,
  data_raw_bit_4 CHAR(1) NULL,
  data_raw_bit_5 CHAR(1) NULL,
  data_raw_bit_6 CHAR(1) NULL,
  data_raw_bit_7 CHAR(1) NULL,
  crc CHAR(16) NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- ***
-- NOTE: the nodes table should already exist if the web application is already installed.
-- ***

CREATE TABLE nodes (
  id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  x INT(11) NULL,
  y INT(11) NULL,
  serial VARCHAR(45) NULL,
  type_id INT(11) NULL,
  key_switch_status INT(11) NULL,
  communication_status INT(11) NULL,
  communication_flag INT(11) NULL,
  blast_armed INT(11) NULL,
  fire_button INT(11) NULL,
  isolation_relay INT(11) NULL,
  cable_fault INT(11) NULL,
  earth_leakage INT(11) NULL,
  shaft_fault INT(11) NULL,
  detonator_status INT(11) NULL,
  partial_blast_lfs INT(11) NULL,
  full_blast_lfs INT(11) NULL,
  booster_fired_lfs INT(11) NULL,
  missing_pulse_detected_lfs INT(11) NULL,
  AC_supply_voltage_lfs INT(11) NULL,
  DC_supply_voltage INT(11) NULL,
  DC_supply_voltage_status INT(11) NULL,
  mains INT(11) NULL,
  low_bat INT(11) NULL,
  too_low_bat INT(11) NULL,
  delay INT(11) NULL,
  program INT(11) NULL,
  calibration INT(11) NULL,
  det_fired INT(11) NULL,
  tagged INT(11) NULL,
  energy_storing INT(11) NULL,
  bridge_wire INT(11) NULL,
  parent_id INT(11) NULL,
  tree_parent_id INT(11) NULL,
  window_id INT(11) NULL,
  created TIMESTAMP DEFAULT now(),
  modified DATETIME NULL
);