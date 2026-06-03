<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Esquema relacional de Banco de Tiempo (doc 03, 3NF). Reversible.
 * Auth por Firebase (ADR-008): users.firebase_uid, sin password_hash ni refresh_tokens.
 * Archivos en Firebase Storage (ADR-007): se guarda solo la ruta.
 * DDL estático (sin entrada de usuario), ejecutado vía query() para tipos no soportados por Forge.
 */
final class CreateSchema extends Migration
{
    public function up(): void
    {
        $cs = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

        $this->db->query("CREATE TABLE roles (
            id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT, nombre VARCHAR(40) NOT NULL,
            PRIMARY KEY (id), UNIQUE KEY uq_roles_nombre (nombre))$cs");

        $this->db->query("CREATE TABLE users (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            firebase_uid VARCHAR(128) NOT NULL,
            nombre VARCHAR(120) NOT NULL,
            email VARCHAR(180) NOT NULL,
            bio VARCHAR(500) NULL,
            foto_perfil VARCHAR(255) NULL,
            estado_verificacion ENUM('no_verificado','pendiente','verificado','rechazado') NOT NULL DEFAULT 'no_verificado',
            estado_cuenta ENUM('activa','suspendida','baja') NOT NULL DEFAULT 'activa',
            email_verified_at TIMESTAMP NULL,
            created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL, deleted_at TIMESTAMP NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_users_firebase_uid (firebase_uid),
            UNIQUE KEY uq_users_email (email),
            KEY idx_users_estado_verif (estado_verificacion),
            KEY idx_users_estado_cuenta (estado_cuenta))$cs");

        $this->db->query("CREATE TABLE role_user (
            user_id BIGINT UNSIGNED NOT NULL, role_id TINYINT UNSIGNED NOT NULL,
            PRIMARY KEY (user_id, role_id), KEY idx_role_user_role (role_id),
            CONSTRAINT fk_ru_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_ru_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE)$cs");

        $this->db->query("CREATE TABLE categorias (
            id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT, nombre VARCHAR(80) NOT NULL,
            slug VARCHAR(90) NOT NULL, activa BOOLEAN NOT NULL DEFAULT TRUE,
            PRIMARY KEY (id), UNIQUE KEY uq_categorias_nombre (nombre), UNIQUE KEY uq_categorias_slug (slug))$cs");

        $this->db->query("CREATE TABLE ofertas (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL, categoria_id SMALLINT UNSIGNED NOT NULL,
            titulo VARCHAR(140) NOT NULL, descripcion_breve VARCHAR(200) NOT NULL, descripcion_completa TEXT NOT NULL,
            modalidad ENUM('presencial','virtual') NOT NULL, zona VARCHAR(120) NULL,
            tipo_capacidad ENUM('individual','grupal') NOT NULL DEFAULT 'individual',
            capacidad_maxima SMALLINT UNSIGNED NOT NULL DEFAULT 1,
            disponibilidad JSON NULL,
            estado ENUM('borrador','activa','pausada','eliminada') NOT NULL DEFAULT 'activa',
            created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
            PRIMARY KEY (id), KEY idx_ofertas_user (user_id), KEY idx_ofertas_categoria (categoria_id),
            KEY idx_ofertas_explorar (estado, categoria_id, modalidad),
            CONSTRAINT fk_ofertas_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_ofertas_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id))$cs");

        $this->db->query("CREATE TABLE oferta_imagenes (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, oferta_id BIGINT UNSIGNED NOT NULL,
            ruta VARCHAR(255) NOT NULL, orden SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (id), KEY idx_oferta_imagenes_oferta (oferta_id),
            CONSTRAINT fk_oimg_oferta FOREIGN KEY (oferta_id) REFERENCES ofertas(id) ON DELETE CASCADE)$cs");

        $this->db->query("CREATE TABLE documentos_verificacion (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, user_id BIGINT UNSIGNED NOT NULL,
            ruta_cifrada VARCHAR(255) NOT NULL,
            tipo_documento ENUM('ine','pasaporte','licencia','otro') NOT NULL DEFAULT 'ine',
            estado ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
            revisado_por BIGINT UNSIGNED NULL, motivo_rechazo VARCHAR(255) NULL,
            created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
            PRIMARY KEY (id), KEY idx_docver_user (user_id), KEY idx_docver_estado (estado),
            CONSTRAINT fk_docver_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_docver_revisor FOREIGN KEY (revisado_por) REFERENCES users(id) ON DELETE SET NULL)$cs");

        $this->db->query("CREATE TABLE vinculaciones (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, oferta_id BIGINT UNSIGNED NOT NULL, buscador_id BIGINT UNSIGNED NOT NULL,
            estado ENUM('solicitada','aceptada','rechazada','completada','cancelada') NOT NULL DEFAULT 'solicitada',
            confirmado_oferente BOOLEAN NOT NULL DEFAULT FALSE, confirmado_buscador BOOLEAN NOT NULL DEFAULT FALSE,
            cancelada_por BIGINT UNSIGNED NULL, aceptada_at TIMESTAMP NULL, completada_at TIMESTAMP NULL,
            created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
            PRIMARY KEY (id), UNIQUE KEY uq_vinc_activa (oferta_id, buscador_id, estado),
            KEY idx_vinc_buscador (buscador_id), KEY idx_vinc_estado (estado),
            CONSTRAINT fk_vinc_oferta FOREIGN KEY (oferta_id) REFERENCES ofertas(id) ON DELETE CASCADE,
            CONSTRAINT fk_vinc_buscador FOREIGN KEY (buscador_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_vinc_cancelapor FOREIGN KEY (cancelada_por) REFERENCES users(id) ON DELETE SET NULL)$cs");

        $this->db->query("CREATE TABLE conversaciones (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, vinculacion_id BIGINT UNSIGNED NOT NULL,
            firestore_doc_id VARCHAR(128) NOT NULL, estado ENUM('habilitada','cerrada') NOT NULL DEFAULT 'habilitada',
            created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
            PRIMARY KEY (id), UNIQUE KEY uq_conv_vinc (vinculacion_id), UNIQUE KEY uq_conv_fsdoc (firestore_doc_id),
            CONSTRAINT fk_conv_vinc FOREIGN KEY (vinculacion_id) REFERENCES vinculaciones(id) ON DELETE CASCADE)$cs");

        $this->db->query("CREATE TABLE resenas (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, vinculacion_id BIGINT UNSIGNED NOT NULL,
            autor_id BIGINT UNSIGNED NOT NULL, destino_id BIGINT UNSIGNED NOT NULL,
            calificacion TINYINT UNSIGNED NOT NULL, comentario TEXT NULL,
            reportada BOOLEAN NOT NULL DEFAULT FALSE, oculta BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
            PRIMARY KEY (id), UNIQUE KEY uq_resena_autor (vinculacion_id, autor_id), KEY idx_resena_destino (destino_id),
            CONSTRAINT fk_resena_vinc FOREIGN KEY (vinculacion_id) REFERENCES vinculaciones(id) ON DELETE CASCADE,
            CONSTRAINT fk_resena_autor FOREIGN KEY (autor_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_resena_destino FOREIGN KEY (destino_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT chk_resena_calif CHECK (calificacion BETWEEN 1 AND 5))$cs");

        $this->db->query("CREATE TABLE tickets (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, folio VARCHAR(20) NOT NULL, creador_id BIGINT UNSIGNED NOT NULL,
            tipo ENUM('reporte','sugerencia') NOT NULL,
            entidad_tipo ENUM('usuario','oferta','mensaje','resena','otro') NOT NULL DEFAULT 'otro',
            entidad_id BIGINT UNSIGNED NULL,
            estado ENUM('abierto','en_proceso','resuelto','cerrado') NOT NULL DEFAULT 'abierto',
            descripcion TEXT NOT NULL, resolucion TEXT NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
            PRIMARY KEY (id), UNIQUE KEY uq_tickets_folio (folio), KEY idx_tickets_creador (creador_id), KEY idx_tickets_estado (estado),
            CONSTRAINT fk_tickets_creador FOREIGN KEY (creador_id) REFERENCES users(id) ON DELETE CASCADE)$cs");

        $this->db->query("CREATE TABLE ticket_asignaciones (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, ticket_id BIGINT UNSIGNED NOT NULL, moderador_id BIGINT UNSIGNED NOT NULL,
            asignado_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id), KEY idx_tasig_ticket (ticket_id), KEY idx_tasig_mod (moderador_id),
            CONSTRAINT fk_tasig_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
            CONSTRAINT fk_tasig_mod FOREIGN KEY (moderador_id) REFERENCES users(id) ON DELETE CASCADE)$cs");

        $this->db->query("CREATE TABLE notificaciones (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, user_id BIGINT UNSIGNED NOT NULL, tipo VARCHAR(60) NOT NULL,
            payload JSON NULL, leida_at TIMESTAMP NULL, created_at TIMESTAMP NULL,
            PRIMARY KEY (id), KEY idx_notif_user_leida (user_id, leida_at),
            CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)$cs");

        $this->db->query("CREATE TABLE auditoria (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, actor_id BIGINT UNSIGNED NULL, accion VARCHAR(80) NOT NULL,
            entidad_tipo VARCHAR(60) NOT NULL, entidad_id BIGINT UNSIGNED NULL, metadata JSON NULL, ip VARBINARY(16) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id), KEY idx_audit_actor (actor_id), KEY idx_audit_entidad (entidad_tipo, entidad_id),
            CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL)$cs");
    }

    public function down(): void
    {
        foreach (['auditoria','notificaciones','ticket_asignaciones','tickets','resenas','conversaciones',
                  'vinculaciones','documentos_verificacion','oferta_imagenes','ofertas','categorias',
                  'role_user','users','roles'] as $t) {
            $this->db->query('DROP TABLE IF EXISTS ' . $t);
        }
    }
}
