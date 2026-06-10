# Soft Delete de Usuarios + CRUD Admin — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar soft delete transaccional de usuarios con cascada (pausa ofertas, revoca Firebase) + patrón uniforme de Ver/Editar/Borrar en las 4 tablas admin con drawer lateral derecho + visualización consistente de usuarios inactivos en chats/reseñas/vinculaciones.

**Architecture:** Backend CI4 nuevo service `UsuarioBajaService` (transaccional, idempotente). 1 migración: `ofertas.pausada_por_admin`, `users.baja_motivo`, `users.baja_por_user_id`. 6 endpoints admin nuevos. Frontend: componentes nuevos `DetailDrawer`, `UserName`, `ConfirmDialog`, `useFocusTrap` + drawers admin específicos.

**Tech Stack:** CodeIgniter 4.7 (PHP 8.3+), MySQL 8, React 19, TypeScript 5.7, TanStack Query, Tailwind 4. PHPUnit y Vitest.

**Referencia:** spec en `docs/superpowers/specs/2026-06-10-soft-delete-usuarios-crud-admin-design.md`.

---

## Estructura de archivos

### Backend (apps/api)

**Nuevos:**
- `app/Database/Migrations/2026-06-10-000001_AddSoftDeleteCascadeFields.php`
- `app/Services/UsuarioBajaService.php`
- `app/Services/UsuarioReactivarService.php`
- `tests/Unit/UsuarioBajaServiceTest.php`
- `tests/Unit/UsuarioReactivarServiceTest.php`
- `tests/Feature/Admin/UsuariosBajaTest.php`
- `tests/Feature/Admin/CategoriasTest.php`
- `tests/Feature/Admin/OfertasDetalleTest.php`

**Modificados:**
- `app/Controllers/Api/V1/Admin/Usuarios.php` (añadir `show`, `darBaja`, `reactivar`; modificar `index` con `incluir_bajas`)
- `app/Controllers/Api/V1/Admin/Ofertas.php` (añadir `show`; modificar `index` para devolver `pausada_por_admin`)
- `app/Controllers/Api/V1/Admin/Tickets.php` (añadir `show`)
- `app/Controllers/Api/V1/Admin/Categorias.php` (añadir `update`, `toggleActiva`)
- `app/Config/Routes.php` (nuevas rutas)
- `app/Models/OfertaModel.php` (añadir `pausada_por_admin` a `$allowedFields` con guard interno)
- `app/Models/UserModel.php` (añadir `baja_motivo`, `baja_por_user_id` a `$allowedFields`)
- `app/Services/OfertaService.php` (`listarParaExplorar` excluye ofertas con `pausada_por_admin=1`; añadir `oferente_inactivo` en queries de detalle)
- `app/Services/VinculacionService.php` (devolver `oferente_inactivo`, `buscador_inactivo`)
- `app/Services/ResenaService.php` (devolver `autor_inactivo`, `destino_inactivo`)
- `app/Services/TicketService.php` (devolver `creador_inactivo`)

### Frontend (apps/web)

**Nuevos:**
- `src/lib/useFocusTrap.ts`
- `src/components/ui/DetailDrawer.tsx`
- `src/components/ui/UserName.tsx`
- `src/components/ui/ConfirmDialog.tsx`
- `src/features/admin/components/UsuarioDetailDrawer.tsx`
- `src/features/admin/components/OfertaDetailDrawer.tsx`
- `src/features/admin/components/TicketDetailDrawer.tsx`
- `src/features/admin/hooks/useUsuarioBaja.ts`
- `src/features/admin/hooks/useUsuarioDetalle.ts`
- `src/features/admin/hooks/useOfertaDetalleAdmin.ts`
- `src/features/admin/hooks/useTicketDetalleAdmin.ts`
- `src/components/ui/__tests__/DetailDrawer.test.tsx`
- `src/components/ui/__tests__/UserName.test.tsx`
- `src/components/ui/__tests__/ConfirmDialog.test.tsx`

**Modificados:**
- `src/lib/types.ts` (extender User, Oferta, Vinculacion, Resena, Ticket con flags)
- `src/features/admin/hooks/useAdminUsuarios.ts` (añadir `incluir_bajas`)
- `src/features/admin/hooks/useAdminCategorias.ts` (añadir `useUpdateCategoria`, `useToggleCategoria`)
- `src/features/admin/AdminUsuariosPage.tsx`
- `src/features/admin/AdminOfertasPage.tsx`
- `src/features/admin/AdminTicketsPage.tsx`
- `src/features/admin/AdminCategoriasPage.tsx`
- `src/features/chat/components/ChatWindow.tsx`
- `src/features/chat/components/ChatInput.tsx`
- `src/features/resenas/components/ResenaCard.tsx`
- `src/features/vinculaciones/VinculacionDetallePage.tsx`
- `src/features/vinculaciones/components/VinculacionCard.tsx`
- `src/features/ofertas/OfertaDetallePage.tsx`
- `src/features/perfil/ProfilePage.tsx`

---

## Convención TDD

- **Backend:** PHPUnit. Test primero, falla, implementación mínima, pasa.
- **Frontend:** Vitest + Testing Library. Test primero para componentes con lógica (DetailDrawer, ConfirmDialog, ChatWindow). Para componentes presentacionales puros (UserName), test ligero de smoke.
- Commit después de cada task. Mensaje: `feat(api|web): <descripción corta>`.

---

# FASE 1 — Backend: schema y services core

## Task 1: Migración con 3 columnas nuevas

**Files:**
- Create: `apps/api/app/Database/Migrations/2026-06-10-000001_AddSoftDeleteCascadeFields.php`

- [ ] **Step 1: Crear archivo de migración**

```php
<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

final class AddSoftDeleteCascadeFields extends Migration
{
    public function up(): void
    {
        // ofertas.pausada_por_admin — flag para distinguir pausa automática (baja) de manual
        $this->forge->addColumn('ofertas', [
            'pausada_por_admin' => [
                'type'    => 'TINYINT',
                'unsigned'=> true,
                'default' => 0,
                'after'   => 'estado',
            ],
        ]);
        $this->db->query('CREATE INDEX idx_ofertas_pausada_por_admin ON ofertas (pausada_por_admin)');

        // users.baja_motivo y users.baja_por_user_id
        $this->forge->addColumn('users', [
            'baja_motivo' => [
                'type'    => 'VARCHAR',
                'constraint' => 500,
                'null'    => true,
                'after'   => 'deleted_at',
            ],
            'baja_por_user_id' => [
                'type'     => 'BIGINT',
                'unsigned' => true,
                'null'     => true,
                'after'    => 'baja_motivo',
            ],
        ]);
        $this->forge->addForeignKey('baja_por_user_id', 'users', 'id', '', 'SET NULL', 'fk_users_baja_por')->processIndexes('users');
        // CodeIgniter no añade FK retroactivamente; usar SQL crudo:
        $this->db->query('ALTER TABLE users ADD CONSTRAINT fk_users_baja_por FOREIGN KEY (baja_por_user_id) REFERENCES users(id) ON DELETE SET NULL');
    }

    public function down(): void
    {
        $this->db->query('ALTER TABLE users DROP FOREIGN KEY fk_users_baja_por');
        $this->forge->dropColumn('users', 'baja_por_user_id');
        $this->forge->dropColumn('users', 'baja_motivo');

        $this->db->query('DROP INDEX idx_ofertas_pausada_por_admin ON ofertas');
        $this->forge->dropColumn('ofertas', 'pausada_por_admin');
    }
}
```

- [ ] **Step 2: Ejecutar migración**

Run: `cd apps/api && php spark migrate`
Expected: `Migrated to 2026-06-10-000001`

- [ ] **Step 3: Verificar schema en MySQL**

Run: `cd apps/api && php spark db:table users` (debería listar `baja_motivo` y `baja_por_user_id`)

- [ ] **Step 4: Modificar UserModel para incluir nuevos campos en `$allowedFields`**

Edit `app/Models/UserModel.php`: añadir `'baja_motivo'`, `'baja_por_user_id'` al array `$allowedFields`. **NO** añadir `deleted_at` (se gestiona automáticamente por `useSoftDeletes`).

- [ ] **Step 5: Modificar OfertaModel**

Edit `app/Models/OfertaModel.php`: añadir `'pausada_por_admin'` al array `$allowedFields`.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/Database/Migrations/2026-06-10-000001_AddSoftDeleteCascadeFields.php apps/api/app/Models/UserModel.php apps/api/app/Models/OfertaModel.php
git commit -m "feat(api): add soft delete cascade fields (pausada_por_admin, baja_motivo, baja_por_user_id)"
```

---

## Task 2: UsuarioBajaService con tests

**Files:**
- Create: `apps/api/app/Services/UsuarioBajaService.php`
- Create: `apps/api/tests/Unit/UsuarioBajaServiceTest.php`

- [ ] **Step 1: Escribir test happy path (rojo)**

Create `apps/api/tests/Unit/UsuarioBajaServiceTest.php`:

```php
<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\AuditoriaModel;
use App\Models\OfertaModel;
use App\Models\UserModel;
use App\Services\UsuarioBajaService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

final class UsuarioBajaServiceTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate = true;
    protected $refresh = true;

    public function testBajaPausaOfertasActivasYMarcaUsuario(): void
    {
        $users  = model(UserModel::class);
        $ofertas= model(OfertaModel::class);

        $userId   = $users->insert(['firebase_uid' => 'fb-target', 'nombre' => 'Target', 'email' => 't@t.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);
        $adminId  = $users->insert(['firebase_uid' => 'fb-admin', 'nombre' => 'Admin', 'email' => 'a@a.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);

        $ofertas->insert(['user_id' => $userId, 'titulo' => 'O1', 'descripcion_breve' => 'desc', 'categoria_id' => 1, 'modalidad' => 'virtual', 'estado' => 'activa']);
        $ofertas->insert(['user_id' => $userId, 'titulo' => 'O2', 'descripcion_breve' => 'desc', 'categoria_id' => 1, 'modalidad' => 'virtual', 'estado' => 'activa']);
        $ofertas->insert(['user_id' => $userId, 'titulo' => 'O3', 'descripcion_breve' => 'desc', 'categoria_id' => 1, 'modalidad' => 'virtual', 'estado' => 'pausada']);

        $service = new UsuarioBajaService(skipFirebase: true);
        $result  = $service->darBaja($userId, 'motivo de prueba', $adminId);

        $this->assertSame(2, $result['ofertas_pausadas']);

        $user = $users->withDeleted()->find($userId);
        $this->assertSame('baja', $user['estado_cuenta']);
        $this->assertNotNull($user['deleted_at']);
        $this->assertSame('motivo de prueba', $user['baja_motivo']);
        $this->assertSame($adminId, (int) $user['baja_por_user_id']);

        // Las 2 ofertas activas → pausadas con flag; la 3ra pausada manual → intacta
        $pausadasPorAdmin = $ofertas->where('user_id', $userId)->where('pausada_por_admin', 1)->countAllResults();
        $this->assertSame(2, $pausadasPorAdmin);
    }

    public function testNoSePuedeAutoBaja(): void
    {
        $users = model(UserModel::class);
        $adminId = $users->insert(['firebase_uid' => 'a', 'nombre' => 'Admin', 'email' => 'a@a.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('No puedes darte baja');
        (new UsuarioBajaService(skipFirebase: true))->darBaja($adminId, null, $adminId);
    }

    public function testRechazaUsuarioYaEnBaja(): void
    {
        $users = model(UserModel::class);
        $userId = $users->insert(['firebase_uid' => 't', 'nombre' => 'T', 'email' => 't@t.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'baja']);
        $users->builder()->where('id', $userId)->update(['deleted_at' => date('Y-m-d H:i:s')]);

        $adminId = $users->insert(['firebase_uid' => 'a', 'nombre' => 'A', 'email' => 'a@a.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('ya está dado de baja');
        (new UsuarioBajaService(skipFirebase: true))->darBaja($userId, null, $adminId);
    }
}
```

- [ ] **Step 2: Correr test, ver que falla**

Run: `cd apps/api && composer test -- --filter UsuarioBajaServiceTest`
Expected: `Error: Class "App\Services\UsuarioBajaService" not found`

- [ ] **Step 3: Implementar UsuarioBajaService**

Create `apps/api/app/Services/UsuarioBajaService.php`:

```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditoriaModel;
use App\Models\OfertaModel;
use App\Models\UserModel;
use Config\Database;
use DomainException;

final class UsuarioBajaService
{
    private UserModel $users;
    private OfertaModel $ofertas;
    private AuditoriaModel $auditoria;
    private bool $skipFirebase;

    public function __construct(bool $skipFirebase = false)
    {
        $this->users        = model(UserModel::class);
        $this->ofertas      = model(OfertaModel::class);
        $this->auditoria    = model(AuditoriaModel::class);
        $this->skipFirebase = $skipFirebase;
    }

    /**
     * Da de baja a un usuario. Transaccional. Idempotente vía 409 si ya está en baja.
     *
     * @return array{ofertas_pausadas:int}
     */
    public function darBaja(int $userId, ?string $motivo, int $actorId): array
    {
        if ($userId === $actorId) {
            throw new DomainException('No puedes darte baja a ti mismo.');
        }

        $user = $this->users->withDeleted()->find($userId);
        if ($user === null) {
            throw new DomainException('Usuario no encontrado.');
        }
        if ($user['deleted_at'] !== null) {
            throw new DomainException('Usuario ya está dado de baja.');
        }

        $db = Database::connect();
        $db->transStart();

        // 1. Pausar ofertas activas con flag
        $db->table('ofertas')
            ->where('user_id', $userId)
            ->where('estado', 'activa')
            ->update(['estado' => 'pausada', 'pausada_por_admin' => 1, 'updated_at' => date('Y-m-d H:i:s')]);
        $ofertasPausadas = $db->affectedRows();

        // 2. Marcar usuario como baja + soft delete
        $db->table('users')
            ->where('id', $userId)
            ->update([
                'estado_cuenta'    => 'baja',
                'deleted_at'       => date('Y-m-d H:i:s'),
                'baja_motivo'      => $motivo,
                'baja_por_user_id' => $actorId,
            ]);

        // 3. Auditoría
        $this->auditoria->insert([
            'actor_id'  => $actorId,
            'accion'    => 'admin_dar_baja_usuario',
            'entidad'   => 'user',
            'entidad_id'=> $userId,
            'metadata'  => json_encode(['motivo' => $motivo, 'ofertas_pausadas' => $ofertasPausadas]),
            'ip'        => null,
        ]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            throw new \RuntimeException('Error al dar baja: transacción falló.');
        }

        // 4. Revocar sesiones Firebase (post-tx, no crítico para consistencia DB)
        if (!$this->skipFirebase) {
            try {
                $firebase = service('firebaseAuth');
                $firebase->revocarSesiones($user['firebase_uid']);
            } catch (\Throwable $e) {
                log_message('error', 'Firebase revoke failed for user ' . $userId . ': ' . $e->getMessage());
                $this->auditoria->insert([
                    'actor_id'  => $actorId,
                    'accion'    => 'firebase_revoke_failed',
                    'entidad'   => 'user',
                    'entidad_id'=> $userId,
                    'metadata'  => json_encode(['error' => $e->getMessage()]),
                    'ip'        => null,
                ]);
            }
        }

        return ['ofertas_pausadas' => $ofertasPausadas];
    }
}
```

- [ ] **Step 4: Verificar campos en AuditoriaModel**

Run: `grep -A 5 'allowedFields' apps/api/app/Models/AuditoriaModel.php`
Si `metadata` no está en `$allowedFields`, añadirlo. Si `accion` tiene enum validado, añadir `'admin_dar_baja_usuario'` y `'firebase_revoke_failed'`.

- [ ] **Step 5: Correr tests, ver verde**

Run: `cd apps/api && composer test -- --filter UsuarioBajaServiceTest`
Expected: 3 tests passed.

- [ ] **Step 6: PHPStan check**

Run: `cd apps/api && vendor/bin/phpstan analyse --memory-limit=512M app/Services/UsuarioBajaService.php`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add apps/api/app/Services/UsuarioBajaService.php apps/api/tests/Unit/UsuarioBajaServiceTest.php apps/api/app/Models/AuditoriaModel.php
git commit -m "feat(api): UsuarioBajaService with transactional cascade and Firebase revoke"
```

---

## Task 3: UsuarioReactivarService con tests

**Files:**
- Create: `apps/api/app/Services/UsuarioReactivarService.php`
- Create: `apps/api/tests/Unit/UsuarioReactivarServiceTest.php`

- [ ] **Step 1: Escribir test (rojo)**

Create `apps/api/tests/Unit/UsuarioReactivarServiceTest.php`:

```php
<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\OfertaModel;
use App\Models\UserModel;
use App\Services\UsuarioReactivarService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

final class UsuarioReactivarServiceTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    protected $migrate = true;
    protected $refresh = true;

    public function testReactivarRestauraSoloOfertasPausadasPorAdmin(): void
    {
        $users   = model(UserModel::class);
        $ofertas = model(OfertaModel::class);

        $userId  = $users->insert(['firebase_uid' => 'x', 'nombre' => 'X', 'email' => 'x@x.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'baja']);
        $adminId = $users->insert(['firebase_uid' => 'a', 'nombre' => 'A', 'email' => 'a@a.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);

        $users->builder()->where('id', $userId)->update(['deleted_at' => date('Y-m-d H:i:s'), 'baja_motivo' => 'test']);

        $ofertas->insert(['user_id' => $userId, 'titulo' => 'A', 'descripcion_breve' => 'd', 'categoria_id' => 1, 'modalidad' => 'virtual', 'estado' => 'pausada', 'pausada_por_admin' => 1]);
        $ofertas->insert(['user_id' => $userId, 'titulo' => 'B', 'descripcion_breve' => 'd', 'categoria_id' => 1, 'modalidad' => 'virtual', 'estado' => 'pausada', 'pausada_por_admin' => 0]);

        $result = (new UsuarioReactivarService())->reactivar($userId, $adminId);

        $this->assertSame(1, $result['ofertas_reactivadas']);

        $user = $users->find($userId);
        $this->assertSame('activa', $user['estado_cuenta']);
        $this->assertNull($user['deleted_at']);

        $activas = $ofertas->where('user_id', $userId)->where('estado', 'activa')->countAllResults();
        $this->assertSame(1, $activas);
    }

    public function testRechazaUsuarioNoEnBaja(): void
    {
        $users = model(UserModel::class);
        $userId  = $users->insert(['firebase_uid' => 'x', 'nombre' => 'X', 'email' => 'x@x.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);
        $adminId = $users->insert(['firebase_uid' => 'a', 'nombre' => 'A', 'email' => 'a@a.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);

        $this->expectException(\DomainException::class);
        (new UsuarioReactivarService())->reactivar($userId, $adminId);
    }
}
```

- [ ] **Step 2: Correr test, ver que falla**

Run: `cd apps/api && composer test -- --filter UsuarioReactivarServiceTest`
Expected: `Class "App\Services\UsuarioReactivarService" not found`

- [ ] **Step 3: Implementar el service**

Create `apps/api/app/Services/UsuarioReactivarService.php`:

```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditoriaModel;
use App\Models\OfertaModel;
use App\Models\UserModel;
use Config\Database;
use DomainException;

final class UsuarioReactivarService
{
    private UserModel $users;
    private OfertaModel $ofertas;
    private AuditoriaModel $auditoria;

    public function __construct()
    {
        $this->users     = model(UserModel::class);
        $this->ofertas   = model(OfertaModel::class);
        $this->auditoria = model(AuditoriaModel::class);
    }

    /** @return array{ofertas_reactivadas:int} */
    public function reactivar(int $userId, int $actorId): array
    {
        $user = $this->users->withDeleted()->find($userId);
        if ($user === null) {
            throw new DomainException('Usuario no encontrado.');
        }
        if ($user['deleted_at'] === null) {
            throw new DomainException('Usuario no está dado de baja.');
        }

        $db = Database::connect();
        $db->transStart();

        $db->table('ofertas')
            ->where('user_id', $userId)
            ->where('pausada_por_admin', 1)
            ->update(['estado' => 'activa', 'pausada_por_admin' => 0, 'updated_at' => date('Y-m-d H:i:s')]);
        $ofertasReactivadas = $db->affectedRows();

        $db->table('users')
            ->where('id', $userId)
            ->update([
                'estado_cuenta'    => 'activa',
                'deleted_at'       => null,
                'baja_motivo'      => null,
                'baja_por_user_id' => null,
            ]);

        $this->auditoria->insert([
            'actor_id'  => $actorId,
            'accion'    => 'admin_reactivar_usuario',
            'entidad'   => 'user',
            'entidad_id'=> $userId,
            'metadata'  => json_encode(['ofertas_reactivadas' => $ofertasReactivadas]),
            'ip'        => null,
        ]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            throw new \RuntimeException('Error al reactivar: transacción falló.');
        }

        return ['ofertas_reactivadas' => $ofertasReactivadas];
    }
}
```

- [ ] **Step 4: Correr tests, ver verde**

Run: `cd apps/api && composer test -- --filter UsuarioReactivarServiceTest`
Expected: 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/Services/UsuarioReactivarService.php apps/api/tests/Unit/UsuarioReactivarServiceTest.php
git commit -m "feat(api): UsuarioReactivarService restores admin-paused ofertas"
```

---

# FASE 2 — Backend: endpoints admin usuarios

## Task 4: Endpoint GET /admin/usuarios/{id}

**Files:**
- Modify: `apps/api/app/Controllers/Api/V1/Admin/Usuarios.php` (añadir método `show`)
- Modify: `apps/api/app/Config/Routes.php`
- Create: `apps/api/tests/Feature/Admin/UsuariosShowTest.php`

- [ ] **Step 1: Añadir ruta**

Edit `apps/api/app/Config/Routes.php`. Encontrar el bloque admin (cerca de `/admin/usuarios`) y añadir:

```php
$routes->get('usuarios/(:num)', 'Usuarios::show/$1');
```

- [ ] **Step 2: Test feature (rojo)**

Create `apps/api/tests/Feature/Admin/UsuariosShowTest.php`:

```php
<?php

namespace Tests\Feature\Admin;

use App\Models\UserModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

final class UsuariosShowTest extends CIUnitTestCase
{
    use DatabaseTestTrait, FeatureTestTrait;
    protected $migrate = true;
    protected $refresh = true;

    public function testShowReturnsUserDetails(): void
    {
        $users = model(UserModel::class);
        $userId = $users->insert(['firebase_uid' => 'fb', 'nombre' => 'Test', 'email' => 'x@y.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);
        $adminId = $users->insert(['firebase_uid' => 'fb-admin', 'nombre' => 'Admin', 'email' => 'a@a.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);
        // dar rol moderador al admin (asume tabla role_user)
        $users->db->table('role_user')->insert(['user_id' => $adminId, 'role' => 'moderador']);

        $result = $this->withHeaders(['X-Auth-UserId' => (string) $adminId])
            ->call('get', "/api/v1/admin/usuarios/{$userId}");

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);
        $this->assertSame($userId, $body['data']['id']);
        $this->assertArrayHasKey('counts', $body['data']);
        $this->assertNull($body['data']['baja']);
    }
}
```

- [ ] **Step 3: Correr test (rojo)**

Run: `cd apps/api && composer test -- --filter UsuariosShowTest`
Expected: 404 o método no existe.

- [ ] **Step 4: Implementar `show` en el controlador**

Edit `apps/api/app/Controllers/Api/V1/Admin/Usuarios.php`. Añadir método después de `index`:

```php
/** GET /admin/usuarios/{id} */
public function show(int $id): ResponseInterface
{
    $userModel = model(UserModel::class);
    $user = $userModel->withDeleted()
        ->select('id, nombre, email, foto_perfil, bio, zona, fecha_nacimiento, genero, telefono, estado_verificacion, estado_cuenta, created_at, deleted_at, baja_motivo, baja_por_user_id')
        ->find($id);

    if ($user === null) {
        return $this->notFound('Usuario no encontrado.');
    }

    $db = $userModel->db;
    $counts = [
        'ofertas_activas'           => $db->table('ofertas')->where('user_id', $id)->where('estado', 'activa')->countAllResults(),
        'ofertas_pausadas_por_admin'=> $db->table('ofertas')->where('user_id', $id)->where('pausada_por_admin', 1)->countAllResults(),
        'vinculaciones_completadas' => $db->table('vinculaciones')->groupStart()->where('buscador_id', $id)->orWhere('oferente_id', $id)->groupEnd()->where('estado', 'completada')->countAllResults(),
        'resenas_recibidas'         => $db->table('resenas')->where('destino_id', $id)->countAllResults(),
    ];

    $baja = null;
    if ($user['deleted_at'] !== null) {
        $admin = null;
        if ($user['baja_por_user_id'] !== null) {
            $admin = $userModel->withDeleted()->select('id, nombre')->find((int) $user['baja_por_user_id']);
        }
        $baja = [
            'fecha'           => $user['deleted_at'],
            'motivo'          => $user['baja_motivo'],
            'dado_baja_por'   => $admin,
        ];
    }

    unset($user['baja_motivo'], $user['baja_por_user_id']);
    $user['baja']   = $baja;
    $user['counts'] = $counts;

    return $this->ok($user);
}
```

- [ ] **Step 5: Correr test (verde)**

Run: `cd apps/api && composer test -- --filter UsuariosShowTest`
Expected: 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/Controllers/Api/V1/Admin/Usuarios.php apps/api/app/Config/Routes.php apps/api/tests/Feature/Admin/UsuariosShowTest.php
git commit -m "feat(api): GET /admin/usuarios/{id} returns user detail with counts and baja info"
```

---

## Task 5: Endpoint POST /admin/usuarios/{id}/baja

**Files:**
- Modify: `apps/api/app/Controllers/Api/V1/Admin/Usuarios.php`
- Modify: `apps/api/app/Config/Routes.php`
- Create: `apps/api/tests/Feature/Admin/UsuariosBajaTest.php`

- [ ] **Step 1: Añadir ruta**

Edit `apps/api/app/Config/Routes.php`:

```php
$routes->post('usuarios/(:num)/baja', 'Usuarios::darBaja/$1');
```

- [ ] **Step 2: Test feature (rojo)**

Create `apps/api/tests/Feature/Admin/UsuariosBajaTest.php`:

```php
<?php

namespace Tests\Feature\Admin;

use App\Models\OfertaModel;
use App\Models\UserModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

final class UsuariosBajaTest extends CIUnitTestCase
{
    use DatabaseTestTrait, FeatureTestTrait;
    protected $migrate = true;
    protected $refresh = true;

    public function testDarBajaResponds200AndPausesOfertas(): void
    {
        $users = model(UserModel::class);
        $ofertas = model(OfertaModel::class);

        $userId  = $users->insert(['firebase_uid' => 'u', 'nombre' => 'U', 'email' => 'u@u.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);
        $adminId = $users->insert(['firebase_uid' => 'a', 'nombre' => 'A', 'email' => 'a@a.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);
        $users->db->table('role_user')->insert(['user_id' => $adminId, 'role' => 'moderador']);

        $ofertas->insert(['user_id' => $userId, 'titulo' => 'O', 'descripcion_breve' => 'd', 'categoria_id' => 1, 'modalidad' => 'virtual', 'estado' => 'activa']);

        $result = $this->withHeaders(['X-Auth-UserId' => (string) $adminId, 'Content-Type' => 'application/json'])
            ->call('post', "/api/v1/admin/usuarios/{$userId}/baja", ['motivo' => 'spam']);

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);
        $this->assertSame(1, $body['data']['ofertas_pausadas']);

        $user = $users->withDeleted()->find($userId);
        $this->assertNotNull($user['deleted_at']);
    }

    public function testAutoBajaForbidden(): void
    {
        $users = model(UserModel::class);
        $adminId = $users->insert(['firebase_uid' => 'a', 'nombre' => 'A', 'email' => 'a@a.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);
        $users->db->table('role_user')->insert(['user_id' => $adminId, 'role' => 'moderador']);

        $result = $this->withHeaders(['X-Auth-UserId' => (string) $adminId, 'Content-Type' => 'application/json'])
            ->call('post', "/api/v1/admin/usuarios/{$adminId}/baja", []);

        $result->assertStatus(403);
    }
}
```

- [ ] **Step 3: Test rojo**

Run: `cd apps/api && composer test -- --filter UsuariosBajaTest`
Expected: 404 (ruta no existe).

- [ ] **Step 4: Implementar `darBaja` en el controlador**

Edit `apps/api/app/Controllers/Api/V1/Admin/Usuarios.php`. Añadir:

```php
/** POST /admin/usuarios/{id}/baja */
public function darBaja(int $id): ResponseInterface
{
    $actorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
    $body    = $this->request->getJSON(true) ?? [];
    $motivo  = $body['motivo'] ?? null;

    if ($motivo !== null && (strlen($motivo) > 500)) {
        return $this->unprocessable(['motivo' => 'Máximo 500 caracteres.']);
    }

    try {
        $result = (new \App\Services\UsuarioBajaService())->darBaja($id, $motivo, $actorId);
    } catch (\DomainException $e) {
        $msg = $e->getMessage();
        if (str_contains($msg, 'auto')) {
            return $this->forbidden($msg);
        }
        if (str_contains($msg, 'ya está') || str_contains($msg, 'no encontrado')) {
            return $this->response->setStatusCode(409)->setJSON(['message' => $msg]);
        }
        return $this->forbidden($msg);
    }

    return $this->ok($result);
}
```

- [ ] **Step 5: Tests verdes**

Run: `cd apps/api && composer test -- --filter UsuariosBajaTest`
Expected: 2 tests passed.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/Controllers/Api/V1/Admin/Usuarios.php apps/api/app/Config/Routes.php apps/api/tests/Feature/Admin/UsuariosBajaTest.php
git commit -m "feat(api): POST /admin/usuarios/{id}/baja with cascade"
```

---

## Task 6: Endpoint POST /admin/usuarios/{id}/reactivar

**Files:**
- Modify: `apps/api/app/Controllers/Api/V1/Admin/Usuarios.php`
- Modify: `apps/api/app/Config/Routes.php`

- [ ] **Step 1: Ruta**

Edit `Routes.php`:

```php
$routes->post('usuarios/(:num)/reactivar', 'Usuarios::reactivar/$1');
```

- [ ] **Step 2: Test (rojo)**

Append a `apps/api/tests/Feature/Admin/UsuariosBajaTest.php`:

```php
public function testReactivarRestauraOfertas(): void
{
    $users = model(UserModel::class);
    $ofertas = model(OfertaModel::class);

    $userId = $users->insert(['firebase_uid' => 'u', 'nombre' => 'U', 'email' => 'u@u.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'baja']);
    $adminId = $users->insert(['firebase_uid' => 'a', 'nombre' => 'A', 'email' => 'a@a.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);
    $users->db->table('role_user')->insert(['user_id' => $adminId, 'role' => 'moderador']);
    $users->builder()->where('id', $userId)->update(['deleted_at' => date('Y-m-d H:i:s')]);

    $ofertas->insert(['user_id' => $userId, 'titulo' => 'O', 'descripcion_breve' => 'd', 'categoria_id' => 1, 'modalidad' => 'virtual', 'estado' => 'pausada', 'pausada_por_admin' => 1]);

    $result = $this->withHeaders(['X-Auth-UserId' => (string) $adminId])
        ->call('post', "/api/v1/admin/usuarios/{$userId}/reactivar");

    $result->assertStatus(200);
    $body = json_decode($result->getJSON(), true);
    $this->assertSame(1, $body['data']['ofertas_reactivadas']);
}
```

- [ ] **Step 3: Test rojo**

Run: `cd apps/api && composer test -- --filter UsuariosBajaTest::testReactivarRestauraOfertas`
Expected: 404.

- [ ] **Step 4: Implementar `reactivar`**

Edit `apps/api/app/Controllers/Api/V1/Admin/Usuarios.php`:

```php
/** POST /admin/usuarios/{id}/reactivar */
public function reactivar(int $id): ResponseInterface
{
    $actorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
    try {
        $result = (new \App\Services\UsuarioReactivarService())->reactivar($id, $actorId);
    } catch (\DomainException $e) {
        return $this->response->setStatusCode(409)->setJSON(['message' => $e->getMessage()]);
    }
    return $this->ok($result);
}
```

- [ ] **Step 5: Test verde**

Run: `cd apps/api && composer test -- --filter UsuariosBajaTest`
Expected: 3 passing.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/Controllers/Api/V1/Admin/Usuarios.php apps/api/app/Config/Routes.php apps/api/tests/Feature/Admin/UsuariosBajaTest.php
git commit -m "feat(api): POST /admin/usuarios/{id}/reactivar"
```

---

## Task 7: Listado de usuarios con `incluir_bajas`

**Files:**
- Modify: `apps/api/app/Controllers/Api/V1/Admin/Usuarios.php`

- [ ] **Step 1: Test (rojo)**

Append a `apps/api/tests/Feature/Admin/UsuariosShowTest.php`:

```php
public function testIndexExcluyeBajasPorDefecto(): void
{
    $users = model(UserModel::class);
    $activo = $users->insert(['firebase_uid' => 'a1', 'nombre' => 'Activo', 'email' => 'a@a.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);
    $baja   = $users->insert(['firebase_uid' => 'b1', 'nombre' => 'Baja', 'email' => 'b@b.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'baja']);
    $users->builder()->where('id', $baja)->update(['deleted_at' => date('Y-m-d H:i:s')]);

    $admin = $users->insert(['firebase_uid' => 'm', 'nombre' => 'M', 'email' => 'm@m.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);
    $users->db->table('role_user')->insert(['user_id' => $admin, 'role' => 'moderador']);

    $r1 = $this->withHeaders(['X-Auth-UserId' => (string) $admin])->call('get', '/api/v1/admin/usuarios');
    $body1 = json_decode($r1->getJSON(), true);
    $ids1 = array_column($body1['data'], 'id');
    $this->assertContains($activo, $ids1);
    $this->assertNotContains($baja, $ids1);

    $r2 = $this->withHeaders(['X-Auth-UserId' => (string) $admin])->call('get', '/api/v1/admin/usuarios?incluir_bajas=1');
    $body2 = json_decode($r2->getJSON(), true);
    $ids2 = array_column($body2['data'], 'id');
    $this->assertContains($baja, $ids2);
}
```

- [ ] **Step 2: Modificar `index`**

En `apps/api/app/Controllers/Api/V1/Admin/Usuarios.php`, dentro de `index()` modificar la línea `->where('deleted_at IS NULL')`:

```php
$incluirBajas = (bool) $this->request->getGet('incluir_bajas');

// ... resto del builder ...

if (!$incluirBajas) {
    $builder->where('deleted_at IS NULL');
}
```

También cambiar el `select` para incluir `deleted_at`:

```php
->select('id, nombre, email, foto_perfil, estado_verificacion, estado_cuenta, zona, created_at, deleted_at')
```

- [ ] **Step 3: Tests verdes**

Run: `cd apps/api && composer test -- --filter UsuariosShowTest`
Expected: 2 passing.

- [ ] **Step 4: Commit**

```bash
git add apps/api/app/Controllers/Api/V1/Admin/Usuarios.php apps/api/tests/Feature/Admin/UsuariosShowTest.php
git commit -m "feat(api): admin usuarios index supports incluir_bajas flag"
```

---

# FASE 3 — Backend: endpoints detalle (ofertas, tickets, categorías)

## Task 8: GET /admin/ofertas/{id} + flag pausada_por_admin en listado

**Files:**
- Modify: `apps/api/app/Controllers/Api/V1/Admin/Ofertas.php`
- Modify: `apps/api/app/Config/Routes.php`
- Create: `apps/api/tests/Feature/Admin/OfertasDetalleTest.php`

- [ ] **Step 1: Ruta**

Edit `Routes.php`: `$routes->get('ofertas/(:num)', 'Ofertas::show/$1');`

- [ ] **Step 2: Test (rojo)**

Create `apps/api/tests/Feature/Admin/OfertasDetalleTest.php`:

```php
<?php

namespace Tests\Feature\Admin;

use App\Models\OfertaModel;
use App\Models\UserModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

final class OfertasDetalleTest extends CIUnitTestCase
{
    use DatabaseTestTrait, FeatureTestTrait;
    protected $migrate = true;
    protected $refresh = true;

    public function testShowReturnsOfertaConOferenteInactivoFlag(): void
    {
        $users = model(UserModel::class);
        $ofertas = model(OfertaModel::class);

        $oferenteId = $users->insert(['firebase_uid' => 'o', 'nombre' => 'O', 'email' => 'o@o.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'baja']);
        $users->builder()->where('id', $oferenteId)->update(['deleted_at' => date('Y-m-d H:i:s')]);
        $adminId = $users->insert(['firebase_uid' => 'a', 'nombre' => 'A', 'email' => 'a@a.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);
        $users->db->table('role_user')->insert(['user_id' => $adminId, 'role' => 'moderador']);

        $ofertaId = $ofertas->insert(['user_id' => $oferenteId, 'titulo' => 'T', 'descripcion_breve' => 'd', 'categoria_id' => 1, 'modalidad' => 'virtual', 'estado' => 'pausada', 'pausada_por_admin' => 1]);

        $r = $this->withHeaders(['X-Auth-UserId' => (string) $adminId])->call('get', "/api/v1/admin/ofertas/{$ofertaId}");
        $r->assertStatus(200);
        $body = json_decode($r->getJSON(), true);
        $this->assertTrue((bool) $body['data']['oferente_inactivo']);
        $this->assertSame(1, (int) $body['data']['pausada_por_admin']);
    }
}
```

- [ ] **Step 3: Test rojo**

Run: `cd apps/api && composer test -- --filter OfertasDetalleTest`

- [ ] **Step 4: Implementar `show`**

Edit `apps/api/app/Controllers/Api/V1/Admin/Ofertas.php`. Añadir método `show`:

```php
/** GET /admin/ofertas/{id} */
public function show(int $id): ResponseInterface
{
    $db = service('database');
    $oferta = $db->table('ofertas o')
        ->select('o.*, u.nombre AS oferente_nombre, u.foto_perfil AS oferente_foto, (u.deleted_at IS NOT NULL) AS oferente_inactivo')
        ->join('users u', 'u.id = o.user_id', 'left')
        ->where('o.id', $id)
        ->get()
        ->getRowArray();

    if ($oferta === null) {
        return $this->notFound('Oferta no encontrada.');
    }

    $imagenes = $db->table('ofertas_imagenes')->where('oferta_id', $id)->orderBy('orden', 'ASC')->get()->getResultArray();
    $vincCount = $db->table('vinculaciones')->where('oferta_id', $id)->countAllResults();

    $oferta['imagenes'] = $imagenes;
    $oferta['vinculaciones_count'] = $vincCount;

    return $this->ok($oferta);
}
```

- [ ] **Step 5: Modificar `index` para incluir `pausada_por_admin`**

En el mismo controlador, en el `select` del listado, añadir `pausada_por_admin`.

- [ ] **Step 6: Tests verdes**

Run: `cd apps/api && composer test -- --filter OfertasDetalleTest`

- [ ] **Step 7: Commit**

```bash
git add apps/api/app/Controllers/Api/V1/Admin/Ofertas.php apps/api/app/Config/Routes.php apps/api/tests/Feature/Admin/OfertasDetalleTest.php
git commit -m "feat(api): GET /admin/ofertas/{id} with oferente_inactivo flag"
```

---

## Task 9: GET /admin/tickets/{id}

**Files:**
- Modify: `apps/api/app/Controllers/Api/V1/Admin/Tickets.php`
- Modify: `apps/api/app/Config/Routes.php`

- [ ] **Step 1: Ruta**

`$routes->get('tickets/(:num)', 'Tickets::show/$1');`

- [ ] **Step 2: Implementar `show`**

Edit `apps/api/app/Controllers/Api/V1/Admin/Tickets.php`. Añadir:

```php
/** GET /admin/tickets/{id} */
public function show(int $id): ResponseInterface
{
    $db = service('database');
    $ticket = $db->table('tickets t')
        ->select('t.*, c.nombre AS creador_nombre, c.foto_perfil AS creador_foto, (c.deleted_at IS NOT NULL) AS creador_inactivo, m.nombre AS asignado_a_nombre')
        ->join('users c', 'c.id = t.creador_id', 'left')
        ->join('users m', 'm.id = t.asignado_a', 'left')
        ->where('t.id', $id)
        ->get()
        ->getRowArray();

    if ($ticket === null) {
        return $this->notFound('Ticket no encontrado.');
    }

    // Historial de cambios desde auditoría
    $historial = $db->table('auditoria')
        ->select('actor_id, accion, metadata, created_at')
        ->where('entidad', 'ticket')
        ->where('entidad_id', $id)
        ->orderBy('created_at', 'ASC')
        ->get()
        ->getResultArray();

    $ticket['historial'] = $historial;

    return $this->ok($ticket);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/Controllers/Api/V1/Admin/Tickets.php apps/api/app/Config/Routes.php
git commit -m "feat(api): GET /admin/tickets/{id} with creador_inactivo and historial"
```

---

## Task 10: PATCH /admin/categorias + toggle activa

**Files:**
- Modify: `apps/api/app/Controllers/Api/V1/Admin/Categorias.php`
- Modify: `apps/api/app/Config/Routes.php`
- Create: `apps/api/tests/Feature/Admin/CategoriasTest.php`

- [ ] **Step 1: Rutas**

```php
$routes->patch('categorias/(:num)', 'Categorias::update/$1', ['filter' => 'rbac:super_admin']);
$routes->patch('categorias/(:num)/activa', 'Categorias::toggleActiva/$1', ['filter' => 'rbac:super_admin']);
```

- [ ] **Step 2: Test (rojo)**

Create `apps/api/tests/Feature/Admin/CategoriasTest.php`:

```php
<?php

namespace Tests\Feature\Admin;

use App\Models\CategoriaModel;
use App\Models\UserModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

final class CategoriasTest extends CIUnitTestCase
{
    use DatabaseTestTrait, FeatureTestTrait;
    protected $migrate = true;
    protected $refresh = true;

    public function testUpdateCambiaElNombre(): void
    {
        $users = model(UserModel::class);
        $cats = model(CategoriaModel::class);
        $superId = $users->insert(['firebase_uid' => 's', 'nombre' => 'S', 'email' => 's@s.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);
        $users->db->table('role_user')->insert(['user_id' => $superId, 'role' => 'super_admin']);
        $catId = $cats->insert(['nombre' => 'Música', 'slug' => 'musica', 'activa' => 1]);

        $r = $this->withHeaders(['X-Auth-UserId' => (string) $superId, 'Content-Type' => 'application/json'])
            ->call('patch', "/api/v1/admin/categorias/{$catId}", ['nombre' => 'Música Clásica']);

        $r->assertStatus(200);
        $cat = $cats->find($catId);
        $this->assertSame('Música Clásica', $cat['nombre']);
    }

    public function testToggleActivaCambiaElEstado(): void
    {
        $users = model(UserModel::class);
        $cats = model(CategoriaModel::class);
        $superId = $users->insert(['firebase_uid' => 's2', 'nombre' => 'S', 'email' => 's2@s.com', 'estado_verificacion' => 'verificado', 'estado_cuenta' => 'activa']);
        $users->db->table('role_user')->insert(['user_id' => $superId, 'role' => 'super_admin']);
        $catId = $cats->insert(['nombre' => 'Arte', 'slug' => 'arte', 'activa' => 1]);

        $r = $this->withHeaders(['X-Auth-UserId' => (string) $superId, 'Content-Type' => 'application/json'])
            ->call('patch', "/api/v1/admin/categorias/{$catId}/activa", ['activa' => false]);

        $r->assertStatus(200);
        $cat = $cats->find($catId);
        $this->assertSame(0, (int) $cat['activa']);
    }
}
```

- [ ] **Step 3: Test rojo**

Run: `cd apps/api && composer test -- --filter CategoriasTest`

- [ ] **Step 4: Implementar `update` y `toggleActiva`**

Edit `apps/api/app/Controllers/Api/V1/Admin/Categorias.php`. Añadir:

```php
/** PATCH /admin/categorias/{id} */
public function update(int $id): ResponseInterface
{
    $actorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
    $body    = $this->request->getJSON(true) ?? [];
    $nombre  = trim($body['nombre'] ?? '');

    if ($nombre === '' || strlen($nombre) > 80) {
        return $this->unprocessable(['nombre' => 'Nombre requerido (1-80 chars).']);
    }

    $cats = model(\App\Models\CategoriaModel::class);
    $cat = $cats->find($id);
    if ($cat === null) {
        return $this->notFound('Categoría no encontrada.');
    }

    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $nombre));
    $slug = trim($slug, '-');

    // Validar slug único (excepto este id)
    $duplicate = $cats->where('slug', $slug)->where('id !=', $id)->first();
    if ($duplicate !== null) {
        return $this->response->setStatusCode(409)->setJSON(['message' => 'Ya existe una categoría con ese nombre.']);
    }

    $cats->update($id, ['nombre' => $nombre, 'slug' => $slug]);

    $auditoria = model(\App\Models\AuditoriaModel::class);
    $auditoria->insert([
        'actor_id'  => $actorId,
        'accion'    => 'admin_editar_categoria',
        'entidad'   => 'categoria',
        'entidad_id'=> $id,
        'metadata'  => json_encode(['antes' => ['nombre' => $cat['nombre'], 'slug' => $cat['slug']], 'despues' => ['nombre' => $nombre, 'slug' => $slug]]),
    ]);

    return $this->ok($cats->find($id));
}

/** PATCH /admin/categorias/{id}/activa */
public function toggleActiva(int $id): ResponseInterface
{
    $actorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
    $body    = $this->request->getJSON(true) ?? [];
    $activa  = isset($body['activa']) ? (bool) $body['activa'] : null;

    if ($activa === null) {
        return $this->unprocessable(['activa' => 'Campo requerido (boolean).']);
    }

    $cats = model(\App\Models\CategoriaModel::class);
    $cat = $cats->find($id);
    if ($cat === null) {
        return $this->notFound('Categoría no encontrada.');
    }

    $cats->update($id, ['activa' => $activa ? 1 : 0]);

    $auditoria = model(\App\Models\AuditoriaModel::class);
    $auditoria->insert([
        'actor_id'  => $actorId,
        'accion'    => 'admin_toggle_categoria',
        'entidad'   => 'categoria',
        'entidad_id'=> $id,
        'metadata'  => json_encode(['activa_antes' => (int) $cat['activa'], 'activa_despues' => $activa ? 1 : 0]),
    ]);

    return $this->ok($cats->find($id));
}
```

- [ ] **Step 5: Tests verdes**

Run: `cd apps/api && composer test -- --filter CategoriasTest`

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/Controllers/Api/V1/Admin/Categorias.php apps/api/app/Config/Routes.php apps/api/tests/Feature/Admin/CategoriasTest.php
git commit -m "feat(api): PATCH /admin/categorias/{id} and toggle activa endpoints"
```

---

## Task 11: Flag `*_inactivo` en services que devuelven datos de usuario

**Files:**
- Modify: `apps/api/app/Services/OfertaService.php`
- Modify: `apps/api/app/Services/VinculacionService.php`
- Modify: `apps/api/app/Services/ResenaService.php`
- Modify: `apps/api/app/Services/TicketService.php`

- [ ] **Step 1: Identificar queries con `JOIN users`**

Run: `grep -rn "JOIN users\|->join.*users" apps/api/app/Services/ apps/api/app/Models/`

- [ ] **Step 2: Para cada query con join a users, añadir el flag derivado**

Ejemplo para `OfertaService::detalle` (o equivalente). Modificar `select` para incluir:

```php
->select('o.*, u.nombre AS oferente_nombre, u.foto_perfil AS oferente_foto, (u.deleted_at IS NOT NULL) AS oferente_inactivo')
```

Si el join filtra `u.deleted_at IS NULL`, removerlo (queremos ver el usuario aunque esté en baja, con el flag).

Patrón a buscar y reemplazar (regex mental):
- `JOIN users u ... WHERE u.deleted_at IS NULL` → quitar el filtro deleted_at
- `select('... u.nombre AS oferente_nombre')` → añadir `(u.deleted_at IS NOT NULL) AS oferente_inactivo`

Aplicar a:
- `OfertaService::detalle($id)` → `oferente_inactivo`
- `OfertaService::listarParaExplorar` → mantener filtro (no mostrar ofertas de usuarios en baja en explorar; ya las pausa_por_admin lo cubre indirectamente, pero confirmar)
- `VinculacionService::detalle` y listados → `oferente_inactivo`, `buscador_inactivo`
- `ResenaService::resenasDeUsuario` → `autor_inactivo`
- `TicketService` listados/detalle (uso admin) → `creador_inactivo`

- [ ] **Step 3: Verificar con un test rápido**

Crear test que inserte un usuario en baja con oferta, llame al endpoint público de la oferta, y verifique que devuelve `oferente_inactivo=true`. O usar el test de Task 8 que ya valida esto.

- [ ] **Step 4: Tests existentes verdes**

Run: `cd apps/api && composer test`
Expected: todos los tests existentes pasan + el nuevo de OfertasDetalleTest valida `oferente_inactivo`.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/Services/
git commit -m "feat(api): expose user inactivo flag in oferta, vinculacion, resena, ticket services"
```

---

# FASE 4 — Frontend: componentes UI base

## Task 12: Hook useFocusTrap

**Files:**
- Create: `apps/web/src/lib/useFocusTrap.ts`

- [ ] **Step 1: Crear el hook**

```typescript
import { useEffect, type RefObject } from 'react';

/**
 * Atrapa el foco dentro del elemento referenciado mientras `active` es true.
 * Tab y Shift+Tab ciclan entre elementos focusables del contenedor.
 * ESC dispara `onEscape` si se proporciona.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const container = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

    const focusables = getFocusable();
    focusables[0]?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', handleKey);
    return () => {
      container.removeEventListener('keydown', handleKey);
      previouslyFocused?.focus();
    };
  }, [active, onEscape, ref]);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/useFocusTrap.ts
git commit -m "feat(web): useFocusTrap hook for modals/drawers"
```

---

## Task 13: DetailDrawer + test

**Files:**
- Create: `apps/web/src/components/ui/DetailDrawer.tsx`
- Create: `apps/web/src/components/ui/__tests__/DetailDrawer.test.tsx`

- [ ] **Step 1: Escribir test (rojo)**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DetailDrawer from '../DetailDrawer';

describe('DetailDrawer', () => {
  it('renders children when open', () => {
    render(<DetailDrawer open onClose={() => {}} title="Test">Contenido</DetailDrawer>);
    expect(screen.getByText('Contenido')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<DetailDrawer open={false} onClose={() => {}} title="X">Hidden</DetailDrawer>);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<DetailDrawer open onClose={onClose} title="X">y</DetailDrawer>);
    fireEvent.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on ESC key', () => {
    const onClose = vi.fn();
    render(<DetailDrawer open onClose={onClose} title="X">y</DetailDrawer>);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Test rojo**

Run: `cd apps/web && npm test -- DetailDrawer`
Expected: módulo no existe.

- [ ] **Step 3: Implementar DetailDrawer**

```tsx
import { useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/lib/useFocusTrap';

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function DetailDrawer({ open, onClose, title, children, footer }: DetailDrawerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open, onClose);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-surface shadow-lg sm:w-[480px] lg:w-[560px]"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-text-1">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-text-3 hover:bg-surface-2 hover:text-text-1"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="border-t border-border px-5 py-3">{footer}</footer>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 4: Tests verdes**

Run: `cd apps/web && npm test -- DetailDrawer`
Expected: 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/DetailDrawer.tsx apps/web/src/components/ui/__tests__/DetailDrawer.test.tsx
git commit -m "feat(web): DetailDrawer component with focus trap and ESC handling"
```

---

## Task 14: UserName + test

**Files:**
- Create: `apps/web/src/components/ui/UserName.tsx`
- Create: `apps/web/src/components/ui/__tests__/UserName.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserName from '../UserName';

describe('UserName', () => {
  it('shows only name when not inactivo', () => {
    render(<UserName nombre="María" />);
    expect(screen.getByText('María')).toBeInTheDocument();
    expect(screen.queryByText('Inactivo')).not.toBeInTheDocument();
  });

  it('shows chip when inactivo', () => {
    render(<UserName nombre="María" inactivo />);
    expect(screen.getByText('María')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implementar**

```tsx
interface UserNameProps {
  nombre: string;
  inactivo?: boolean;
  className?: string;
}

export default function UserName({ nombre, inactivo, className = '' }: UserNameProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {nombre}
      {inactivo && (
        <span
          className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-text-3"
          title="Esta cuenta fue dada de baja"
        >
          Inactivo
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 3: Tests verdes**

Run: `cd apps/web && npm test -- UserName`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/ui/UserName.tsx apps/web/src/components/ui/__tests__/UserName.test.tsx
git commit -m "feat(web): UserName component with inactivo chip"
```

---

## Task 15: ConfirmDialog + test

**Files:**
- Create: `apps/web/src/components/ui/ConfirmDialog.tsx`
- Create: `apps/web/src/components/ui/__tests__/ConfirmDialog.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  it('blocks confirm until cascade checkbox is checked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Test"
        message="Mensaje"
        cascadeCheckLabel="Confirmo que pausará 3 ofertas"
        confirmLabel="Borrar"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    const confirm = screen.getByRole('button', { name: 'Borrar' });
    expect(confirm).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Confirmo que pausará 3 ofertas'));
    expect(confirm).not.toBeDisabled();

    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalled();
  });

  it('passes motivo when provided', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Baja"
        message="?"
        motivoLabel="Motivo"
        confirmLabel="Confirmar"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'spam' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalledWith({ motivo: 'spam' });
  });
});
```

- [ ] **Step 2: Implementar**

```tsx
import { useState } from 'react';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  motivoLabel?: string;
  cascadeCheckLabel?: string;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: (payload: { motivo?: string }) => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  motivoLabel,
  cascadeCheckLabel,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [motivo, setMotivo] = useState('');
  const [cascadeChecked, setCascadeChecked] = useState(false);

  if (!open) return null;

  const disabled = (cascadeCheckLabel ? !cascadeChecked : false) || loading;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={title} className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-text-1">{title}</h2>
        <p className="mt-2 text-sm text-text-2">{message}</p>

        {motivoLabel && (
          <div className="mt-4">
            <label className="text-sm font-medium text-text-1" htmlFor="cd-motivo">{motivoLabel}</label>
            <textarea
              id="cd-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value.slice(0, 500))}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-1"
              rows={3}
            />
            <p className="mt-1 text-xs text-text-3">{motivo.length}/500</p>
          </div>
        )}

        {cascadeCheckLabel && (
          <label className="mt-4 flex items-start gap-2 text-sm text-text-2">
            <input
              type="checkbox"
              checked={cascadeChecked}
              onChange={(e) => setCascadeChecked(e.target.checked)}
              className="mt-0.5"
            />
            <span>{cascadeCheckLabel}</span>
          </label>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant="danger" onClick={() => onConfirm({ motivo: motivo || undefined })} disabled={disabled}>
            {loading ? 'Procesando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Tests verdes**

Run: `cd apps/web && npm test -- ConfirmDialog`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/ui/ConfirmDialog.tsx apps/web/src/components/ui/__tests__/ConfirmDialog.test.tsx
git commit -m "feat(web): ConfirmDialog with motivo input and cascade checkbox"
```

---

# FASE 5 — Frontend: tipos y hooks API admin

## Task 16: Extender tipos

**Files:**
- Modify: `apps/web/src/lib/types.ts`

- [ ] **Step 1: Añadir campos opcionales**

Buscar las interfaces y añadir:

```typescript
// User
export interface User {
  // ... campos existentes
  deleted_at?: string | null;
  baja_motivo?: string | null;
}

// Oferta (en interface o type)
export interface Oferta {
  // ... existente
  pausada_por_admin?: number;       // 0 | 1
  oferente_inactivo?: boolean | number;
}

// VinculacionCard
export interface VinculacionCard {
  // ... existente
  oferente_inactivo?: boolean | number;
  buscador_inactivo?: boolean | number;
}

// Resena
export interface Resena {
  // ... existente
  autor_inactivo?: boolean | number;
  destino_inactivo?: boolean | number;
}

// Ticket
export interface Ticket {
  // ... existente
  creador_inactivo?: boolean | number;
}

// AdminUsuario
export interface AdminUsuario {
  // ... existente
  deleted_at?: string | null;
}

// Nuevo tipo para el endpoint show de usuario
export interface AdminUsuarioDetalle extends AdminUsuario {
  bio: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  telefono: string | null;
  counts: {
    ofertas_activas: number;
    ofertas_pausadas_por_admin: number;
    vinculaciones_completadas: number;
    resenas_recibidas: number;
  };
  baja: null | {
    fecha: string;
    motivo: string | null;
    dado_baja_por: { id: number; nombre: string } | null;
  };
}
```

- [ ] **Step 2: Typecheck pasa**

Run: `cd apps/web && npm run typecheck`
Expected: no errors. Los componentes existentes siguen funcionando porque los campos nuevos son opcionales.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/types.ts
git commit -m "feat(web): extend types with inactivo flags and AdminUsuarioDetalle"
```

---

## Task 17: Hooks API admin (detalle + baja + categorías)

**Files:**
- Create: `apps/web/src/features/admin/hooks/useUsuarioDetalle.ts`
- Create: `apps/web/src/features/admin/hooks/useUsuarioBaja.ts`
- Create: `apps/web/src/features/admin/hooks/useOfertaDetalleAdmin.ts`
- Create: `apps/web/src/features/admin/hooks/useTicketDetalleAdmin.ts`
- Modify: `apps/web/src/features/admin/hooks/useAdminUsuarios.ts`
- Modify: `apps/web/src/features/admin/hooks/useAdminCategorias.ts`

- [ ] **Step 1: useUsuarioDetalle**

Create `apps/web/src/features/admin/hooks/useUsuarioDetalle.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminUsuarioDetalle } from '@/lib/types';

export function useUsuarioDetalle(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'usuarios', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: AdminUsuarioDetalle }>(`/admin/usuarios/${id}`);
      return data.data;
    },
    enabled: id != null,
  });
}
```

- [ ] **Step 2: useUsuarioBaja (mutación) + useUsuarioReactivar**

Create `apps/web/src/features/admin/hooks/useUsuarioBaja.ts`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDarBajaUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo?: string }) => {
      const { data } = await api.post<{ data: { ofertas_pausadas: number } }>(`/admin/usuarios/${id}/baja`, { motivo });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
    },
  });
}

export function useReactivarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<{ data: { ofertas_reactivadas: number } }>(`/admin/usuarios/${id}/reactivar`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
    },
  });
}
```

- [ ] **Step 3: useOfertaDetalleAdmin y useTicketDetalleAdmin (similar pattern)**

Create `apps/web/src/features/admin/hooks/useOfertaDetalleAdmin.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useOfertaDetalleAdmin(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'ofertas', id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/ofertas/${id}`);
      return data.data;
    },
    enabled: id != null,
  });
}
```

Create `apps/web/src/features/admin/hooks/useTicketDetalleAdmin.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useTicketDetalleAdmin(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'tickets', id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/tickets/${id}`);
      return data.data;
    },
    enabled: id != null,
  });
}
```

- [ ] **Step 4: Modificar useAdminUsuarios para incluir `incluir_bajas`**

Edit `apps/web/src/features/admin/hooks/useAdminUsuarios.ts`. Donde se construye la query string, añadir el param `incluir_bajas`. Si la interfaz `filtros` no lo tiene, añadirlo como opcional.

- [ ] **Step 5: Añadir useUpdateCategoria y useToggleCategoria**

Edit `apps/web/src/features/admin/hooks/useAdminCategorias.ts`. Añadir al final:

```typescript
export function useUpdateCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nombre }: { id: number; nombre: string }) => {
      const { data } = await api.patch(`/admin/categorias/${id}`, { nombre });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  });
}

export function useToggleCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, activa }: { id: number; activa: boolean }) => {
      const { data } = await api.patch(`/admin/categorias/${id}/activa`, { activa });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  });
}
```

- [ ] **Step 6: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/features/admin/hooks/
git commit -m "feat(web): admin hooks for detalle, baja, reactivar, update/toggle categoria"
```

---

# FASE 6 — Frontend: integración en páginas admin

## Task 18: AdminUsuariosPage con drawer, baja, reactivar

**Files:**
- Modify: `apps/web/src/features/admin/AdminUsuariosPage.tsx`
- Create: `apps/web/src/features/admin/components/UsuarioDetailDrawer.tsx`

- [ ] **Step 1: Crear UsuarioDetailDrawer**

```tsx
import { useState } from 'react';
import DetailDrawer from '@/components/ui/DetailDrawer';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useUsuarioDetalle } from '../hooks/useUsuarioDetalle';
import { useDarBajaUsuario, useReactivarUsuario } from '../hooks/useUsuarioBaja';
import { toast, toastError } from '@/lib/toast';

interface Props {
  userId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function UsuarioDetailDrawer({ userId, open, onClose }: Props) {
  const { data: user, isLoading } = useUsuarioDetalle(userId);
  const darBaja = useDarBajaUsuario();
  const reactivar = useReactivarUsuario();
  const [showBajaConfirm, setShowBajaConfirm] = useState(false);

  if (!user && !isLoading) return null;

  const enBaja = user?.deleted_at != null;

  const handleBaja = ({ motivo }: { motivo?: string }) => {
    if (!user) return;
    darBaja.mutate(
      { id: user.id, motivo },
      {
        onSuccess: (data) => {
          toast.success(`Usuario dado de baja. ${data.ofertas_pausadas} oferta(s) pausada(s).`);
          setShowBajaConfirm(false);
          onClose();
        },
        onError: (err) => toastError(err, 'Error al dar baja.'),
      },
    );
  };

  const handleReactivar = () => {
    if (!user) return;
    reactivar.mutate(user.id, {
      onSuccess: (data) => {
        toast.success(`Usuario reactivado. ${data.ofertas_reactivadas} oferta(s) restaurada(s).`);
        onClose();
      },
      onError: (err) => toastError(err, 'Error al reactivar.'),
    });
  };

  const footer = !isLoading && user && (
    <div className="flex justify-end gap-2">
      {enBaja ? (
        <Button onClick={handleReactivar} disabled={reactivar.isPending}>
          {reactivar.isPending ? 'Reactivando...' : 'Reactivar cuenta'}
        </Button>
      ) : (
        <Button variant="danger" onClick={() => setShowBajaConfirm(true)}>
          Dar baja
        </Button>
      )}
    </div>
  );

  return (
    <>
      <DetailDrawer open={open} onClose={onClose} title="Detalle de usuario" footer={footer}>
        {isLoading || !user ? (
          <p className="text-sm text-text-3">Cargando...</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar src={user.foto_perfil} nombre={user.nombre} size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-text-1">{user.nombre}</h3>
                <p className="text-sm text-text-3">{user.email}</p>
                <div className="mt-1 flex gap-1.5">
                  <Badge variant={enBaja ? 'error' : user.estado_cuenta === 'suspendida' ? 'warning' : 'success'}>
                    {enBaja ? 'Baja' : user.estado_cuenta}
                  </Badge>
                  <Badge variant={user.estado_verificacion === 'verificado' ? 'success' : 'neutral'}>
                    {user.estado_verificacion}
                  </Badge>
                </div>
              </div>
            </div>

            {enBaja && user.baja && (
              <div className="rounded-lg border border-error/20 bg-error/5 p-4 text-sm">
                <p className="font-medium text-error">Usuario dado de baja</p>
                <p className="mt-1 text-text-2">Fecha: {new Date(user.baja.fecha).toLocaleString('es-MX')}</p>
                {user.baja.motivo && <p className="mt-0.5 text-text-2">Motivo: {user.baja.motivo}</p>}
                {user.baja.dado_baja_por && (
                  <p className="mt-0.5 text-text-2">Por: {user.baja.dado_baja_por.nombre}</p>
                )}
              </div>
            )}

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-text-3">Zona</dt>
                <dd className="text-text-1">{user.zona ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-text-3">Teléfono</dt>
                <dd className="text-text-1">{user.telefono ?? '—'}</dd>
              </div>
            </dl>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-text-1">Resumen</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <p className="text-text-3">Ofertas activas</p>
                  <p className="text-base font-semibold text-text-1">{user.counts.ofertas_activas}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <p className="text-text-3">Vinculaciones completadas</p>
                  <p className="text-base font-semibold text-text-1">{user.counts.vinculaciones_completadas}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <p className="text-text-3">Reseñas recibidas</p>
                  <p className="text-base font-semibold text-text-1">{user.counts.resenas_recibidas}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <p className="text-text-3">Ofertas pausadas por baja</p>
                  <p className="text-base font-semibold text-text-1">{user.counts.ofertas_pausadas_por_admin}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {user && (
        <ConfirmDialog
          open={showBajaConfirm}
          title="Dar baja a usuario"
          message={`Esto dará de baja a ${user.nombre} y pausará ${user.counts.ofertas_activas} oferta(s) activa(s).`}
          motivoLabel="Motivo (opcional)"
          cascadeCheckLabel={user.counts.ofertas_activas > 0 ? `Confirmo que pausará ${user.counts.ofertas_activas} oferta(s).` : undefined}
          confirmLabel="Dar baja"
          loading={darBaja.isPending}
          onConfirm={handleBaja}
          onCancel={() => setShowBajaConfirm(false)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Modificar AdminUsuariosPage**

Editar para añadir:

1. Estado `selectedUserId` + `drawerOpen`.
2. Switch "Incluir bajas" en filtros (controla query param `incluir_bajas`).
3. Columna "Acciones" con icono 👁 (abrir drawer).
4. Renderizar `<UsuarioDetailDrawer userId={selectedUserId} open={drawerOpen} onClose={...} />`.
5. Si la fila tiene `deleted_at`, mostrar badge "Baja".

Patch específico:

```tsx
// Imports nuevos
import { useState } from 'react';
import { Eye } from 'lucide-react';
import UsuarioDetailDrawer from './components/UsuarioDetailDrawer';

// Dentro del componente, antes del return:
const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
const incluirBajas = searchParams.get('incluir_bajas') === '1';

// Modificar filtros para pasar incluir_bajas al hook:
const filtros = useMemo(
  () => ({ estado_verificacion: estadoVerificacion, estado_cuenta: estadoCuenta, q: q || null, page, per_page: 20, incluir_bajas: incluirBajas ? 1 : 0 }),
  [estadoVerificacion, estadoCuenta, q, page, incluirBajas],
);

// Añadir columna acciones al inicio de columns:
const columns: Column<AdminUsuario>[] = [
  // ... columnas existentes ...
  {
    key: 'acciones', header: 'Acciones',
    render: (u) => (
      <div className="flex gap-1">
        <button
          onClick={() => setSelectedUserId(u.id)}
          aria-label="Ver detalle"
          className="rounded p-1.5 text-text-3 hover:bg-surface-2 hover:text-accent"
        >
          <Eye className="h-4 w-4" />
        </button>
        {/* Suspender/reactivar inline mantenido como hoy */}
      </div>
    ),
  },
];

// En el filtro JSX añadir el switch antes del input de búsqueda:
<label className="flex items-center gap-2 text-xs">
  <input
    type="checkbox"
    checked={incluirBajas}
    onChange={(e) => setFilter('incluir_bajas', e.target.checked ? '1' : null)}
  />
  Incluir cuentas dadas de baja
</label>

// Al final del JSX (antes del cierre del fragment):
<UsuarioDetailDrawer
  userId={selectedUserId}
  open={selectedUserId != null}
  onClose={() => setSelectedUserId(null)}
/>
```

- [ ] **Step 3: Manualmente smoke test**

Run dev: `cd apps/web && npm run dev`. Ir a `/admin/usuarios`. Click en icono ojo → drawer abre. Toggle "Incluir bajas". Dar baja a un usuario test → toast aparece, fila desaparece.

- [ ] **Step 4: Typecheck + tests**

Run: `cd apps/web && npm run typecheck && npm test`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/admin/AdminUsuariosPage.tsx apps/web/src/features/admin/components/UsuarioDetailDrawer.tsx
git commit -m "feat(web): AdminUsuariosPage with detail drawer, baja flow, reactivar"
```

---

## Task 19: AdminOfertasPage con drawer

**Files:**
- Modify: `apps/web/src/features/admin/AdminOfertasPage.tsx`
- Create: `apps/web/src/features/admin/components/OfertaDetailDrawer.tsx`

- [ ] **Step 1: Crear OfertaDetailDrawer**

```tsx
import DetailDrawer from '@/components/ui/DetailDrawer';
import Badge from '@/components/ui/Badge';
import UserName from '@/components/ui/UserName';
import { useOfertaDetalleAdmin } from '../hooks/useOfertaDetalleAdmin';

interface Props {
  ofertaId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function OfertaDetailDrawer({ ofertaId, open, onClose }: Props) {
  const { data: oferta, isLoading } = useOfertaDetalleAdmin(ofertaId);

  return (
    <DetailDrawer open={open} onClose={onClose} title="Detalle de oferta">
      {isLoading || !oferta ? (
        <p className="text-sm text-text-3">Cargando...</p>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-text-1">{oferta.titulo}</h3>
            <p className="mt-1 text-sm text-text-2">{oferta.descripcion_breve}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={oferta.estado === 'activa' ? 'success' : oferta.estado === 'pausada' ? 'warning' : 'neutral'}>{oferta.estado}</Badge>
            <Badge variant="info">{oferta.modalidad}</Badge>
            {Boolean(oferta.pausada_por_admin) && (
              <Badge variant="error">Pausada por baja del oferente</Badge>
            )}
          </div>
          <div className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
            <p className="text-text-3">Oferente</p>
            <p className="font-medium text-text-1">
              <UserName nombre={oferta.oferente_nombre} inactivo={Boolean(oferta.oferente_inactivo)} />
            </p>
          </div>
          {oferta.descripcion_completa && (
            <div>
              <h4 className="mb-1 text-sm font-semibold text-text-1">Descripción</h4>
              <p className="whitespace-pre-line text-sm text-text-2">{oferta.descripcion_completa}</p>
            </div>
          )}
          <p className="text-xs text-text-3">{oferta.vinculaciones_count} vinculación(es)</p>
        </div>
      )}
    </DetailDrawer>
  );
}
```

- [ ] **Step 2: Modificar AdminOfertasPage**

Añadir state `selectedOfertaId`, columna acciones con icono Ver, renderizar drawer. Si fila tiene `pausada_por_admin=1`, mostrar mini-badge "Por baja".

Patch específico:

```tsx
// Imports
import { useState } from 'react';
import { Eye } from 'lucide-react';
import OfertaDetailDrawer from './components/OfertaDetailDrawer';
import Badge from '@/components/ui/Badge';

// State
const [selectedOfertaId, setSelectedOfertaId] = useState<number | null>(null);

// Modificar columna estado para mostrar badge adicional:
{
  key: 'estado', header: 'Estado',
  render: (o) => (
    <div className="flex flex-wrap gap-1">
      <Badge variant={estadoBadge(o.estado)}>{o.estado}</Badge>
      {Boolean((o as any).pausada_por_admin) && <Badge variant="error">Por baja</Badge>}
    </div>
  ),
},

// Añadir columna acciones (insertar antes de la columna existente "acciones" o como nueva):
{
  key: 'ver', header: '',
  render: (o) => (
    <button
      onClick={() => setSelectedOfertaId(o.id)}
      aria-label="Ver detalle"
      className="rounded p-1.5 text-text-3 hover:bg-surface-2 hover:text-accent"
    >
      <Eye className="h-4 w-4" />
    </button>
  ),
},

// Antes del cierre del fragment:
<OfertaDetailDrawer
  ofertaId={selectedOfertaId}
  open={selectedOfertaId != null}
  onClose={() => setSelectedOfertaId(null)}
/>
```

- [ ] **Step 3: Typecheck**

Run: `cd apps/web && npm run typecheck`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/admin/AdminOfertasPage.tsx apps/web/src/features/admin/components/OfertaDetailDrawer.tsx
git commit -m "feat(web): AdminOfertasPage with detail drawer and pausada_por_admin badge"
```

---

## Task 20: AdminTicketsPage migrar row expandible → drawer

**Files:**
- Modify: `apps/web/src/features/admin/AdminTicketsPage.tsx`
- Create: `apps/web/src/features/admin/components/TicketDetailDrawer.tsx`

- [ ] **Step 1: Crear TicketDetailDrawer**

```tsx
import { useState } from 'react';
import DetailDrawer from '@/components/ui/DetailDrawer';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import UserName from '@/components/ui/UserName';
import TicketEstadoBadge from './TicketEstadoBadge';
import { useTicketDetalleAdmin } from '../hooks/useTicketDetalleAdmin';
import { useCambiarEstadoTicket } from '../hooks/useAdminTickets';
import { toast, toastError } from '@/lib/toast';

interface Props {
  ticketId: number | null;
  open: boolean;
  onClose: () => void;
}

const transiciones: Record<string, string[]> = {
  abierto: ['en_proceso', 'cerrado'],
  en_proceso: ['resuelto', 'cerrado'],
  resuelto: [],
  cerrado: [],
};

export default function TicketDetailDrawer({ ticketId, open, onClose }: Props) {
  const { data: ticket, isLoading } = useTicketDetalleAdmin(ticketId);
  const cambiarEstado = useCambiarEstadoTicket();
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [resolucion, setResolucion] = useState('');

  if (!ticket && !isLoading) return null;

  const estadosDisponibles = ticket ? (transiciones[ticket.estado] ?? []) : [];

  const handleCambiar = () => {
    if (!ticket || !nuevoEstado) return;
    cambiarEstado.mutate(
      { id: ticket.id, estado: nuevoEstado, resolucion: nuevoEstado === 'resuelto' ? resolucion : undefined },
      {
        onSuccess: () => {
          toast.success(`Ticket actualizado a ${nuevoEstado}`);
          setNuevoEstado('');
          setResolucion('');
          onClose();
        },
        onError: (err) => toastError(err, 'Error al cambiar estado.'),
      },
    );
  };

  const footer = ticket && estadosDisponibles.length > 0 && (
    <div className="flex flex-col gap-2">
      <select
        value={nuevoEstado}
        onChange={(e) => setNuevoEstado(e.target.value)}
        className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-text-1"
      >
        <option value="">Cambiar estado a...</option>
        {estadosDisponibles.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
      {nuevoEstado === 'resuelto' && (
        <textarea
          value={resolucion}
          onChange={(e) => setResolucion(e.target.value)}
          placeholder="Resolución..."
          className="h-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      )}
      <Button onClick={handleCambiar} disabled={!nuevoEstado || cambiarEstado.isPending}>
        Confirmar cambio
      </Button>
    </div>
  );

  return (
    <DetailDrawer open={open} onClose={onClose} title={ticket?.folio ?? 'Detalle de ticket'} footer={footer}>
      {isLoading || !ticket ? (
        <p className="text-sm text-text-3">Cargando...</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <TicketEstadoBadge estado={ticket.estado} />
            <Badge variant={ticket.tipo === 'reporte' ? 'error' : 'info'}>{ticket.tipo}</Badge>
          </div>

          <div>
            <p className="text-xs text-text-3">Creador</p>
            <p className="text-sm text-text-1">
              <UserName nombre={ticket.creador_nombre ?? '—'} inactivo={Boolean(ticket.creador_inactivo)} />
            </p>
          </div>

          {ticket.asignado_a_nombre && (
            <div>
              <p className="text-xs text-text-3">Asignado a</p>
              <p className="text-sm text-text-1">{ticket.asignado_a_nombre}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-text-3">Descripción</p>
            <p className="whitespace-pre-line text-sm text-text-1">{ticket.descripcion}</p>
          </div>

          {ticket.resolucion && (
            <div className="rounded-lg bg-success/5 p-3">
              <p className="text-xs font-medium text-success">Resolución</p>
              <p className="text-sm text-text-2">{ticket.resolucion}</p>
            </div>
          )}

          {ticket.historial && ticket.historial.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-text-3">Historial</p>
              <ul className="space-y-1 text-xs text-text-2">
                {ticket.historial.map((h: any, i: number) => (
                  <li key={i} className="border-l-2 border-border pl-2">
                    {h.accion} · {new Date(h.created_at).toLocaleString('es-MX')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </DetailDrawer>
  );
}
```

- [ ] **Step 2: Modificar AdminTicketsPage**

Reemplazar la row expandible (`expandedRowId`/`renderExpandedRow`) por drawer:

```tsx
// Imports
import TicketDetailDrawer from './components/TicketDetailDrawer';

// State (sustituye expandedId/nuevoEstado/resolucion):
const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

// Borrar useState de expandedId, nuevoEstado, resolucion, handleCambiarEstado, renderExpandedRow.

// Modificar columna acciones — solo Ver + Tomar:
{
  key: 'acciones', header: 'Acciones',
  render: (t) => (
    <div className="flex gap-1">
      <button
        onClick={() => setSelectedTicketId(t.id)}
        aria-label="Ver detalle"
        className="rounded p-1.5 text-text-3 hover:bg-surface-2 hover:text-accent"
      >
        <Eye className="h-4 w-4" />
      </button>
      {['abierto', 'en_proceso'].includes(t.estado) && (
        <Button
          variant="secondary"
          onClick={() => asignar.mutate(t.id, {
            onSuccess: () => toast.success('Ticket asignado a ti'),
            onError: (err) => toastError(err, 'Error al tomar el ticket.'),
          })}
          disabled={asignar.isPending}
        >
          Tomar
        </Button>
      )}
    </div>
  ),
},

// Quitar expandedRowId y renderExpandedRow del DataTable.

// Antes del cierre:
<TicketDetailDrawer
  ticketId={selectedTicketId}
  open={selectedTicketId != null}
  onClose={() => setSelectedTicketId(null)}
/>
```

- [ ] **Step 3: Typecheck + smoke test**

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/admin/AdminTicketsPage.tsx apps/web/src/features/admin/components/TicketDetailDrawer.tsx
git commit -m "feat(web): AdminTicketsPage uses detail drawer instead of expandible row"
```

---

## Task 21: AdminCategoriasPage migrar a tabla con editar inline

**Files:**
- Modify: `apps/web/src/features/admin/AdminCategoriasPage.tsx`

- [ ] **Step 1: Rewrite del componente**

Sustituir el componente actual por uno con tabla DataTable:

```tsx
import { useState } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { useCategorias } from '@/features/ofertas/hooks/useCategorias';
import { useCrearCategoria, useUpdateCategoria, useToggleCategoria } from './hooks/useAdminCategorias';
import { toast, toastError } from '@/lib/toast';
import type { Categoria } from '@/lib/types';

export default function AdminCategoriasPage() {
  const { data: categorias, isLoading } = useCategorias();
  const crearCategoria = useCrearCategoria();
  const updateCategoria = useUpdateCategoria();
  const toggleCategoria = useToggleCategoria();

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    crearCategoria.mutate(nuevoNombre.trim(), {
      onSuccess: () => { toast.success('Categoría creada'); setNuevoNombre(''); },
      onError: (err) => toastError(err, 'Error al crear categoría.'),
    });
  };

  const startEdit = (cat: Categoria) => {
    setEditingId(cat.id);
    setEditValue(cat.nombre);
  };

  const saveEdit = () => {
    if (editingId == null || !editValue.trim()) return;
    updateCategoria.mutate(
      { id: editingId, nombre: editValue.trim() },
      {
        onSuccess: () => { toast.success('Categoría actualizada'); setEditingId(null); },
        onError: (err) => toastError(err, 'Error al actualizar.'),
      },
    );
  };

  const handleToggle = (cat: Categoria) => {
    const nuevaActiva = !cat.activa;
    toggleCategoria.mutate(
      { id: cat.id, activa: nuevaActiva },
      {
        onSuccess: () => toast.success(nuevaActiva ? 'Categoría activada' : 'Categoría desactivada'),
        onError: (err) => toastError(err, 'Error al cambiar estado.'),
      },
    );
  };

  const columns: Column<Categoria>[] = [
    {
      key: 'nombre', header: 'Nombre',
      render: (c) =>
        editingId === c.id ? (
          <div className="flex gap-1">
            <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} />
            <button onClick={saveEdit} aria-label="Guardar" className="rounded p-1.5 text-success hover:bg-surface-2"><Check className="h-4 w-4" /></button>
            <button onClick={() => setEditingId(null)} aria-label="Cancelar" className="rounded p-1.5 text-text-3 hover:bg-surface-2"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <span className="font-medium text-text-1">{c.nombre}</span>
        ),
    },
    { key: 'slug', header: 'Slug', mobileLabel: 'Slug', render: (c) => <code className="text-xs text-text-3">{c.slug}</code> },
    { key: 'estado', header: 'Estado', render: (c) => <Badge variant={c.activa ? 'success' : 'neutral'}>{c.activa ? 'Activa' : 'Inactiva'}</Badge> },
    {
      key: 'acciones', header: 'Acciones',
      render: (c) => (
        <div className="flex gap-1">
          {editingId !== c.id && (
            <button onClick={() => startEdit(c)} aria-label="Editar" className="rounded p-1.5 text-text-3 hover:bg-surface-2 hover:text-accent">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <Button variant="secondary" onClick={() => handleToggle(c)} disabled={toggleCategoria.isPending}>
            {c.activa ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <h1 className="mb-6 font-display text-xl font-bold text-text-1">Categorias</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-text-1">Crear categoria</h2>
        <form onSubmit={handleCrear} className="flex items-end gap-3">
          <div className="w-64">
            <Input placeholder="Nombre de la categoria" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} maxLength={80} />
          </div>
          <Button type="submit" disabled={crearCategoria.isPending || !nuevoNombre.trim()}>Crear</Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-text-1">Categorias existentes</h2>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <DataTable
            columns={columns}
            data={categorias ?? []}
            rowKey={(c) => c.id}
            emptyTitle="Sin categorías"
          />
        )}
      </section>
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/web && npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/admin/AdminCategoriasPage.tsx
git commit -m "feat(web): AdminCategoriasPage with table, inline edit, toggle activa"
```

---

# FASE 7 — Frontend: visualización de usuarios inactivos

## Task 22: ChatWindow + ChatInput deshabilitados cuando el otro está inactivo

**Files:**
- Modify: `apps/web/src/features/chat/components/ChatWindow.tsx`
- Modify: `apps/web/src/features/chat/components/ChatInput.tsx`
- Modify: `apps/web/src/features/vinculaciones/VinculacionDetallePage.tsx` (pasar prop)

- [ ] **Step 1: Modificar ChatInput para aceptar `disabled` y mostrar mensaje**

En `ChatInput.tsx`, ya tiene prop `disabled`. Añadir un mensaje opcional `disabledReason?: string` para mostrar en lugar del input cuando está disabled.

```tsx
interface Props {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  disabledReason?: string;
  error?: string | null;
}

// En el render, si disabled && disabledReason, mostrar banner en lugar de input:
if (disabled && disabledReason) {
  return (
    <div className="border-t border-border bg-warning/5 px-4 py-3 text-center text-sm text-warning">
      {disabledReason}
    </div>
  );
}
// resto del render igual
```

- [ ] **Step 2: Modificar ChatWindow para pasar `disabledReason`**

```tsx
// Props nuevos: otroInactivo?: boolean

// Render ChatInput al final:
<ChatInput
  onSend={sendMessage}
  disabled={!isConnected || otroInactivo}
  disabledReason={otroInactivo ? 'Esta cuenta fue dada de baja. Puedes leer el historial pero no enviar nuevos mensajes.' : undefined}
  error={sendError}
/>
```

- [ ] **Step 3: Modificar VinculacionDetallePage para pasar `otroInactivo`**

```tsx
// Determinar otroInactivo según el rol del usuario actual:
const otroInactivo = user
  ? (Number(user.id) === Number(vinculacion.oferente_id)
      ? Boolean(vinculacion.buscador_inactivo)
      : Boolean(vinculacion.oferente_inactivo))
  : false;

// Pasar al ChatWindow:
<ChatWindow vinculacionId={vinculacion.id} otroInactivo={otroInactivo} />
```

- [ ] **Step 4: Smoke test manual + typecheck**

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/chat/ apps/web/src/features/vinculaciones/VinculacionDetallePage.tsx
git commit -m "feat(web): chat shows read-only state when participant is inactivo"
```

---

## Task 23: VinculacionCard, VinculacionDetalle y OfertaDetalle muestran chip inactivo + banners

**Files:**
- Modify: `apps/web/src/features/vinculaciones/components/VinculacionCard.tsx`
- Modify: `apps/web/src/features/vinculaciones/VinculacionDetallePage.tsx`
- Modify: `apps/web/src/features/ofertas/OfertaDetallePage.tsx`

- [ ] **Step 1: VinculacionCard usa UserName con flag**

Buscar dónde se renderiza `vinc.oferente_nombre` / `vinc.buscador_nombre`. Sustituir por:

```tsx
import UserName from '@/components/ui/UserName';

// ...
<UserName nombre={vinc.oferente_nombre} inactivo={Boolean(vinc.oferente_inactivo)} />
```

- [ ] **Step 2: VinculacionDetallePage banner + Confirmar deshabilitado**

Después del bloque "Participantes", añadir:

```tsx
{(vinculacion.oferente_inactivo || vinculacion.buscador_inactivo) && (
  <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
    Uno de los participantes fue dado de baja. No es posible avanzar esta vinculación.
  </div>
)}
```

Pasar prop `disabled` a `<PanelConfirmacion>` y `<AccionesVinculacion>` cuando algún participante está inactivo.

- [ ] **Step 3: OfertaDetallePage banner + Me interesa deshabilitado**

En `OfertaDetallePage.tsx`, después de cargar `oferta`:

```tsx
const oferenteInactivo = Boolean((oferta as any).oferente_inactivo);

// Mostrar banner si está inactivo o pausada_por_admin:
{(oferenteInactivo || Boolean((oferta as any).pausada_por_admin)) && (
  <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
    Esta oferta está temporalmente fuera de servicio porque la cuenta del oferente fue dada de baja.
  </div>
)}

// Deshabilitar Me interesa cuando inactivo:
disabled={marcarInteres.isPending || oferenteInactivo}
```

- [ ] **Step 4: Typecheck**

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/vinculaciones/ apps/web/src/features/ofertas/OfertaDetallePage.tsx
git commit -m "feat(web): banners and disabled actions when oferente/participante inactivo"
```

---

## Task 24: ResenaCard y ProfilePage muestran chip inactivo

**Files:**
- Modify: `apps/web/src/features/resenas/components/ResenaCard.tsx`
- Modify: `apps/web/src/features/perfil/ProfilePage.tsx`

- [ ] **Step 1: ResenaCard usa UserName**

Sustituir el render del nombre del autor:

```tsx
import UserName from '@/components/ui/UserName';

// ...
<p className="text-sm font-semibold text-text-1">
  <UserName nombre={resena.autor_nombre} inactivo={Boolean(resena.autor_inactivo)} />
</p>
```

Si la card tiene botón "Reportar", ocultarlo cuando `resena.autor_inactivo` es true.

- [ ] **Step 2: ProfilePage perfil público (cuando user.id no es el actual)**

Si el componente ProfilePage soporta ver perfil de otro usuario (con `:id` en URL) y ese usuario está inactivo, mostrar banner. Si NO soporta ver perfil ajeno aún (sólo el propio), saltar este step y registrar en TODO de futura iteración. Verificar primero:

Run: `grep -n "useParams\|:id" apps/web/src/features/perfil/ProfilePage.tsx`

Si solo es el perfil propio (`useProfile()` siempre carga el actual), este step se reduce a: si por alguna razón el usuario actual está marcado `deleted_at`, mostrar un mensaje genérico (caso muy improbable porque el filtro auth-firebase ya bloquea login). Puede omitirse en esta tarea.

- [ ] **Step 3: Typecheck**

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/resenas/ apps/web/src/features/perfil/
git commit -m "feat(web): ResenaCard shows inactivo chip and hides report when inactivo"
```

---

# FASE 8 — Validación final

## Task 25: Smoke test end-to-end + verificación

**Files:** (sin cambios de código)

- [ ] **Step 1: Backend tests verdes**

Run: `cd apps/api && composer test`
Expected: 100% passing.

- [ ] **Step 2: PHPStan**

Run: `cd apps/api && vendor/bin/phpstan analyse --memory-limit=512M`
Expected: No errors.

- [ ] **Step 3: Frontend tests verdes**

Run: `cd apps/web && npm test`
Expected: all passing.

- [ ] **Step 4: Frontend typecheck + lint**

Run: `cd apps/web && npm run typecheck && npm run lint`
Expected: no nuevos errores (los pre-existentes están documentados).

- [ ] **Step 5: Build**

Run: `cd apps/web && npm run build`
Expected: succeed.

- [ ] **Step 6: Smoke manual**

Levantar `docker compose up -d` + `php spark serve --port 8080` + `npm run dev`. Como admin moderador:

1. Ir a `/admin/usuarios`.
2. Click 👁 en una fila → drawer abre con detalles.
3. Click "Dar baja" → confirm modal con campo motivo y checkbox de cascada (si tiene ofertas) → confirmar.
4. Toast verde "Usuario dado de baja. N ofertas pausadas."
5. Activar switch "Incluir bajas" → el usuario aparece con badge "Baja".
6. Click 👁 → drawer muestra bloque rojo con motivo, fecha y quién dio la baja.
7. Click "Reactivar cuenta" → toast verde.
8. Ir a `/admin/ofertas` → ver oferta del usuario dado de baja debería estar pausada con badge "Por baja".
9. Como otro usuario, intentar `/ofertas/{id}` de oferta pausada por admin → banner aparece, Me interesa deshabilitado.
10. Como otro usuario, abrir chat con el usuario dado de baja → banner "solo lectura" en lugar de input.
11. Ir a `/admin/categorias` → editar nombre inline → toggle activa.

- [ ] **Step 7: Commit final si aún hay cambios sin commitear**

```bash
git status
# Si hay archivos pendientes:
git add -A
git commit -m "chore: final adjustments after end-to-end smoke test"
```

---

## Self-review check del plan

**Coverage del spec:** ✅
- Migración (Task 1) ✓
- UsuarioBajaService (Task 2) ✓
- UsuarioReactivarService (Task 3) ✓
- GET detalle usuario (Task 4) ✓
- POST baja (Task 5) ✓
- POST reactivar (Task 6) ✓
- Flag incluir_bajas (Task 7) ✓
- GET ofertas/{id} (Task 8) ✓
- GET tickets/{id} (Task 9) ✓
- PATCH categorias + toggle (Task 10) ✓
- Flag inactivo en services (Task 11) ✓
- useFocusTrap (Task 12) ✓
- DetailDrawer (Task 13) ✓
- UserName (Task 14) ✓
- ConfirmDialog (Task 15) ✓
- Tipos (Task 16) ✓
- Hooks API (Task 17) ✓
- AdminUsuariosPage (Task 18) ✓
- AdminOfertasPage (Task 19) ✓
- AdminTicketsPage (Task 20) ✓
- AdminCategoriasPage (Task 21) ✓
- Chat (Task 22) ✓
- Vinculaciones + Oferta detalle (Task 23) ✓
- Reseñas + Perfil (Task 24) ✓
- Smoke test (Task 25) ✓

**Placeholders:** ninguno detectado.

**Consistencia de tipos:** `useUsuarioDetalle` retorna `AdminUsuarioDetalle`. Drawer usa `user.counts.ofertas_activas`. Coherente con tipo definido en Task 16.

**Convención de mensajes:** Toast usa `toast.success` / `toastError` (helpers ya implementados en sesión previa).
