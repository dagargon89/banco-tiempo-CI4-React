# Banco de Tiempo — Monorepo (código)

Scaffolding del MVP de **Banco de Tiempo** (Participa Juárez). Punto de partida coherente
con la documentación técnica del proyecto (carpeta superior). **No es la implementación final**:
complétalo siguiendo los documentos y el roadmap. Lee primero `../CLAUDE.md`.

```
app-codigo/
├── apps/
│   ├── api/   # CodeIgniter 4.7 — API REST (PHP 8.3)
│   └── web/   # React 19 + Vite + TypeScript — SPA
└── docker-compose.yml   # MySQL 8 + Redis para desarrollo local
```

## Arranque local

```bash
# 1) Infra
docker compose up -d            # MySQL 8 (3306) + Redis (6379)

# 2) Backend (apps/api)
cd apps/api
composer install
cp env.example .env             # rellenar Firebase + DB; correr `php spark key:generate`
php spark migrate --all
php spark db:seed InitialSeeder
php spark serve                 # http://localhost:8080

# 3) Frontend (apps/web)
cd ../web
npm install
cp .env.example .env.local      # VITE_API_URL + config pública de Firebase
npm run dev                     # http://localhost:5173 (proxy /api → 8080)
```

## Notas clave (ver ../CLAUDE.md y la documentación)

- **Auth:** Firebase Authentication (email/contraseña, Google, Facebook, Microsoft). El SPA
  obtiene el ID token; la API lo verifica con el filtro `auth-firebase` (Admin SDK) y mapea
  el `firebase_uid` al usuario local. La API no emite ni almacena tokens de sesión.
- **Archivos:** Firebase Storage. Imágenes públicas (CDN) y documentos de identidad privados
  cifrados app-side. Subida directa con token acotado de la API.
- **Seguridad:** OWASP por diseño. MySQL es la única fuente de verdad. El cliente nunca es de fiar.
- **Marca:** tokens del design system en `apps/web/src/styles/tokens.css` (morado #53155a + lima #dbec57).

## Estado del scaffolding

Incluye: estructura en capas de CI4, filtros de seguridad (auth-firebase, rbac, throttle, cors,
secureheaders), `FirebaseAuthService` (contrato + aprovisionamiento JIT), migración completa del
esquema 3NF, seeder, `UserModel`, controlador `Auth::sync`, y la base del SPA (cliente API,
Firebase, tokens de marca, tipos). Pendiente de completar por sprint: módulos Ofertas, Vinculación
(máquina de estados), Chat, Reseñas, Tickets, Admin y la UI de cada feature.
