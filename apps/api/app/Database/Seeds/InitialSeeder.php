<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Semillas iniciales (doc 03 §5): roles, categorías y 1 super-admin.
 * El super-admin se crea en Firebase Auth; aquí se inserta su fila local mapeada
 * por SEED_ADMIN_FIREBASE_UID. Sin contraseñas en MySQL (ADR-008).
 */
final class InitialSeeder extends Seeder
{
    public function run(): void
    {
        $this->db->table('roles')->ignore(true)->insertBatch([
            ['id' => 1, 'nombre' => 'super_admin'],
            ['id' => 2, 'nombre' => 'moderador'],
        ]);

        $cats = [
            ['nombre' => 'Arte y Dibujo', 'slug' => 'arte'], ['nombre' => 'Manualidades', 'slug' => 'manualidades'],
            ['nombre' => 'Música', 'slug' => 'musica'], ['nombre' => 'Deportes', 'slug' => 'deportes'],
            ['nombre' => 'Idiomas', 'slug' => 'idiomas'], ['nombre' => 'Tecnología', 'slug' => 'tecnologia'],
            ['nombre' => 'Cocina', 'slug' => 'cocina'], ['nombre' => 'Danza', 'slug' => 'danza'],
            ['nombre' => 'Fotografía', 'slug' => 'fotografia'], ['nombre' => 'Otras', 'slug' => 'otras'],
        ];
        foreach ($cats as &$c) { $c['activa'] = 1; }
        $this->db->table('categorias')->ignore(true)->insertBatch($cats);

        $uid   = (string) env('SEED_ADMIN_FIREBASE_UID', '');
        $email = (string) env('SEED_ADMIN_EMAIL', '');
        if ($uid === '' || $email === '') {
            return; // sin admin por defecto si faltan credenciales (doc 04 A05)
        }

        $now = date('Y-m-d H:i:s');
        $this->db->table('users')->insert([
            'firebase_uid' => $uid, 'nombre' => (string) env('SEED_ADMIN_NOMBRE', 'Administrador'),
            'email' => $email, 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa',
            'email_verified_at' => $now, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $this->db->table('role_user')->insert(['user_id' => $this->db->insertID(), 'role_id' => 1]);
    }
}
