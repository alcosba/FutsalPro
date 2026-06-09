# 🚀 Guía de Instalación y Setup

## Requisitos Previos

- **Node.js** 18.0 o superior
- **npm** o **yarn**
- **Git** (opcional)

Verifica tu versión:
```bash
node --version
npm --version
```

---

## Instalación Rápida

### 1. Instalar Dependencias

```bash
cd futsal-coach-next
npm install
```

**Dependencias principales instaladas:**
- `next@16` - Framework React
- `react@19` - Librería UI
- `zustand` - Gestión de estado
- `fabric@7` - Canvas para pizarra táctica
- `@fullcalendar/react` - Calendario
- `@supabase/supabase-js` - Backend
- `tailwindcss@4` - Estilos
- `typescript@5` - Type safety

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar con tus valores
nano .env.local
```

**Variables necesarias (mínimas):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Si solo usas localStorage (sin Supabase), puedes omitir estas por ahora.

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

---

## Características Implementadas ✅

### Funcionalidad Base
- ✅ Pizarra táctica interactiva (Fabric.js)
- ✅ Calendario de entrenamientos y partidos
- ✅ Gestión de estadísticas de jugadores
- ✅ Organización de ejercicios en carpetas

### Tecnología
- ✅ TypeScript con tipos completos
- ✅ Estado global con Zustand (persistente)
- ✅ Validación de formularios
- ✅ Sistema de notificaciones (toasts)
- ✅ Componentes reutilizables
- ✅ UI moderna (Tailwind CSS)
- ✅ Temas oscuro/claro

### Datos
- ✅ Persistencia en localStorage
- ✅ Preparado para Supabase
- ✅ Sincronización (pendiente)

---

## Estructura de Carpetas

```
futsal-coach-next/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas de autenticación
│   ├── (app)/             # Rutas principales
│   ├── layout.tsx         # Layout raíz
│   ├── page.tsx           # Home
│   └── globals.css        # Estilos globales
│
├── components/            # Componentes React
│   ├── Board/             # Pizarra táctica
│   ├── Calendar/          # Calendario
│   ├── Stats.tsx          # Estadísticas
│   ├── shared/            # Componentes compartidos
│   │   ├── Modal.tsx      # Modal reutilizable
│   │   └── Toast.tsx      # Notificaciones
│   └── DarkModeToggle.tsx # Tema
│
├── hooks/                 # Custom hooks
│   ├── usePlayer.ts       # Gestión de jugadores
│   ├── useCalendar.ts     # Eventos
│   ├── useStats.ts        # Estadísticas
│   ├── useBoard.ts        # Ejercicios
│   └── useSupabase.ts     # Backend
│
├── stores/                # Estado global
│   └── appStore.ts        # Zustand store
│
├── lib/                   # Utilidades
│   ├── utils.ts           # Funciones comunes
│   ├── validators/        # Validaciones
│   └── supabase/          # Configuración DB
│
├── types/                 # TypeScript types
│   └── index.ts           # Definiciones
│
├── services/              # Servicios de API
├── public/                # Archivos estáticos
├── package.json           # Dependencias
├── tsconfig.json          # Config TypeScript
├── next.config.ts         # Config Next.js
└── tailwind.config.ts     # Config Tailwind
```

---

## Flujo de Uso

### 1. Crear un Jugador
```
Home → Estadísticas → [+ Añadir Jugador] → Completar formulario → Guardar
```
- El jugador se guarda en Zustand store + localStorage
- Automáticamente aparece en tablas y estadísticas

### 2. Programar un Entrenamiento
```
Home → Calendario → Hacer click en fecha → Completar detalles → Guardar
```

### 3. Dibujar Táctica en la Pizarra
```
Home → Pizarra Táctica → Seleccionar herramienta → Dibujar → Guardar Ejercicio
```

### 4. Ver Estadísticas
```
Home → Estadísticas → Revisar ranking, goles, minutos
```

---

## Integración con Supabase (Opcional)

Para habilitar sincronización en la nube:

### 1. Crear Proyecto en Supabase
- Ir a https://supabase.com
- Crear cuenta (gratuita)
- Crear nuevo proyecto
- Copiar URLs y claves

### 2. Configurar Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 3. Crear Tablas en Supabase
```sql
-- Ejecutar en SQL Editor de Supabase

CREATE TABLE players (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  number INTEGER,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  date DATE,
  opponent TEXT,
  location TEXT,
  time TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crear más tablas según sea necesario
```

### 4. Habilitar Sincronización
Descomenta en los hooks: `useSupabase.ts`

---

## Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo (puerto 3000)
npm run dev -- -p 3001  # En puerto diferente

# Producción
npm run build            # Compilar
npm start               # Ejecutar build

# Code Quality
npm run lint            # Validar código ESLint

# Type Check
npx tsc --noEmit        # Validar tipos

# Limpiar
rm -rf .next node_modules
npm install
```

---

## Troubleshooting

### Puerto 3000 en uso
```bash
npm run dev -- -p 3001
```

### Errores de tipos TypeScript
```bash
npx tsc --noEmit
```

### Limpiar cache
```bash
rm -rf .next
npm run dev
```

### Problemas con módulos
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Checklist de Setup ✓

- [ ] Node.js 18+ instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Variables de entorno configuradas
- [ ] Servidor de desarrollo corriendo (`npm run dev`)
- [ ] Accesible en `http://localhost:3000`
- [ ] Console sin errores rojo

---

## Próximos Pasos Recomendados

1. **Explorar la aplicación** - Crear algunos jugadores, partidos
2. **Revisar código** - Entender estructura en `stores/` y `hooks/`
3. **Conectar Supabase** - Para sincronización en la nube
4. **Añadir autenticación** - Login/signup en `app/(auth)/`
5. **Tests** - Escribir tests unitarios

---

## Documentación Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [Supabase](https://supabase.com/docs)

---

## Soporte

Si encuentras problemas:

1. Revisar logs en consola del navegador (F12)
2. Revisar logs del servidor terminal
3. Verificar variables de entorno
4. Limpiar cache (`.next`, `node_modules`)

---

**¡Listo para comenzar! 🎉**

Ejecuta `npm run dev` y accede a http://localhost:3000
