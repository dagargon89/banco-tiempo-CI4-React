-- Base exclusiva para PHPUnit; la de desarrollo (banco_de_tiempo) no se toca.
-- MySQL solo ejecuta este script al crear el volumen. Con un volumen
-- existente, córrelo a mano (ver Banco de tiempo/CLAUDE.md).
CREATE DATABASE IF NOT EXISTS banco_de_tiempo_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON banco_de_tiempo_test.* TO 'bt_app'@'%';
FLUSH PRIVILEGES;
