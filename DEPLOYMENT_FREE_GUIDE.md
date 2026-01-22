# 🚀 GUÍA DE DEPLOYMENT GRATUITO - SIRIU

Esta guía te ayudará a deployar tu aplicación SIRIU en plataformas gratuitas antes de subir a Google Cloud Platform.

## 📋 TABLA DE CONTENIDOS

1. [Opción #1: Render + MongoDB Atlas (RECOMENDADO)](#opción-1-render--mongodb-atlas)
2. [Opción #2: Railway.app](#opción-2-railwayapp)
3. [Opción #3: Fly.io](#opción-3-flyio)
4. [MongoDB Atlas (Base de Datos)](#mongodb-atlas-configuración)

---

## ✅ OPCIÓN #1: RENDER + MONGODB ATLAS (RECOMENDADO)

### Por qué esta opción:
- ✅ 100% compatible con tu código actual
- ✅ 750 horas/mes gratis (suficiente para 24/7)
- ✅ SSL automático
- ✅ GitHub auto-deploy
- ✅ Sin tarjeta de crédito

### Paso 1: Configurar MongoDB Atlas

1. Ir a https://www.mongodb.com/cloud/atlas/register
2. Crear cuenta gratuita
3. Crear cluster M0 (Free tier)
4. En "Security" → "Database Access":
   - Crear usuario: `siriu_user`
   - Password: (guardar para después)
   - Rol: `Atlas admin`
5. En "Security" → "Network Access":
   - Agregar IP: `0.0.0.0/0` (permite acceso desde cualquier IP)
6. En "Deployment" → "Database" → Click en "Connect":
   - Seleccionar "Connect your application"
   - Copiar connection string:
     ```
     mongodb+srv://siriu_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Reemplazar `<password>` con tu contraseña real

### Paso 2: Deploy en Render

1. **Crear cuenta en Render:**
   - Ir a https://render.com
   - "Get Started for Free"
   - Sign up con GitHub

2. **Conectar repositorio:**
   - Autorizar acceso a tu repositorio
   - Seleccionar el repo de SIRIU

3. **Crear Web Service (Backend):**
   - Click "New +"
   - "Web Service"
   - Seleccionar tu repositorio
   - Configurar:
     ```
     Name: siriu-backend
     Region: Oregon (US West) o el más cercano
     Branch: main
     Root Directory: backend
     Environment: Docker
     Plan: Free
     ```

4. **Variables de entorno:**
   En la sección "Environment Variables", agregar:
   ```
   MONGO_URL = mongodb+srv://siriu_user:TU_PASSWORD@cluster0.xxxxx.mongodb.net/siriu?retryWrites=true&w=majority
   DB_NAME = siriu
   USE_FIRESTORE = false
   JWT_SECRET_KEY = (click "Generate" para crear una clave segura)
   CORS_ORIGINS = *
   PORT = 8080
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Esperar 5-10 minutos
   - Tu API estará en: `https://siriu-backend.onrender.com`

### Paso 3: Deploy Frontend en Vercel

1. **Crear cuenta en Vercel:**
   - Ir a https://vercel.com
   - Sign up con GitHub

2. **Import proyecto:**
   - Click "Add New..."
   - "Project"
   - Seleccionar tu repositorio
   - Configurar:
     ```
     Root Directory: frontend
     Framework Preset: Create React App
     Build Command: npm run build
     Output Directory: build
     ```

3. **Variables de entorno:**
   ```
   REACT_APP_BACKEND_URL = https://siriu-backend.onrender.com
   ```

4. **Deploy:**
   - Click "Deploy"
   - Tu app estará en: `https://siriu-app.vercel.app` (o el nombre que elijas)

### Paso 4: Inicializar Base de Datos

Conéctate a MongoDB Atlas con MongoDB Compass o ejecuta:

```bash
# Desde tu máquina local, actualiza .env con la URL de Atlas:
MONGO_URL="mongodb+srv://siriu_user:PASSWORD@cluster0.xxxxx.mongodb.net/siriu"

# Ejecuta los scripts de inicialización:
cd backend
node init_mongodb.js
node init_tipos_marcas.js
```

### Paso 5: Actualizar CORS en Render

Volver a Render → Environment Variables → Actualizar:
```
CORS_ORIGINS = https://siriu-app.vercel.app,https://siriu-backend.onrender.com
```

---

## 🚂 OPCIÓN #2: RAILWAY.APP

### Ventajas:
- $5 crédito mensual gratis
- Soporte MongoDB nativo
- Deploy más rápido

### Paso 1: Instalar Railway CLI

```powershell
# Windows PowerShell:
npm install -g @railway/cli
```

### Paso 2: Deploy

```bash
# 1. Login
railway login

# 2. Crear proyecto
cd backend
railway init

# 3. Agregar MongoDB
railway add mongodb

# 4. Configurar variables
railway variables set USE_FIRESTORE=false
railway variables set JWT_SECRET_KEY=$(openssl rand -hex 32)
railway variables set CORS_ORIGINS="*"

# 5. Deploy
railway up

# 6. Obtener URL
railway domain
```

### Paso 3: Deploy Frontend

```bash
cd ../frontend
railway init

# Configurar variable
railway variables set REACT_APP_BACKEND_URL=https://tu-backend-url.railway.app

# Deploy
railway up
```

---

## ✈️ OPCIÓN #3: FLY.IO

### Ventajas:
- 3 VMs gratis permanentemente
- Distribuido globalmente
- Muy rápido

### Paso 1: Instalar flyctl

```powershell
# Windows PowerShell:
iwr https://fly.io/install.ps1 -useb | iex
```

### Paso 2: Login y Launch

```bash
# 1. Login
fly auth login

# 2. Launch backend
cd backend
fly launch --name siriu-backend --region dfw

# Confirmar configuración:
# - Copiar: fly.toml (ya incluido)
# - Database: No (usaremos MongoDB Atlas)

# 3. Configurar secrets
fly secrets set MONGO_URL="mongodb+srv://user:pass@cluster.mongodb.net/siriu"
fly secrets set DB_NAME=siriu
fly secrets set USE_FIRESTORE=false
fly secrets set JWT_SECRET_KEY=$(openssl rand -hex 32)
fly secrets set CORS_ORIGINS="*"

# 4. Deploy
fly deploy

# 5. Obtener URL
fly info
```

---

## 🗄️ MONGODB ATLAS CONFIGURACIÓN

### Crear Cluster Gratis:

1. **Ir a:** https://www.mongodb.com/cloud/atlas
2. **Crear cuenta gratuita**
3. **Create a Deployment** → M0 Free
4. **Cloud Provider:** AWS
5. **Region:** Selecciona el más cercano (us-east-1 recomendado)
6. **Cluster Name:** SIRIU-Cluster

### Configurar Acceso:

```
Security → Database Access:
  Username: siriu_admin
  Password: (generar segura)
  Role: Atlas admin

Security → Network Access:
  IP Address: 0.0.0.0/0 (Allow access from anywhere)
  Comment: Development access
```

### Connection String:

```
mongodb+srv://siriu_admin:<password>@siriu-cluster.xxxxx.mongodb.net/siriu?retryWrites=true&w=majority
```

### Inicializar Datos:

Una vez conectado, ejecuta desde tu máquina local:

```bash
cd backend
MONGO_URL="tu-connection-string" node init_mongodb.js
MONGO_URL="tu-connection-string" node init_tipos_marcas.js
```

O usa MongoDB Compass:
1. Conectar con connection string
2. Crear database: `siriu`
3. Importar colecciones manualmente

---

## 🔧 TROUBLESHOOTING

### Error: "Cannot connect to database"
```bash
# Verificar que IP 0.0.0.0/0 esté en Network Access
# Verificar que password no tenga caracteres especiales
# Usar URL encoding si tiene caracteres especiales
```

### Error: "Port already in use"
```bash
# Render usa PORT=8080 automáticamente
# Verificar que Dockerfile tenga: CMD exec uvicorn server:app --host 0.0.0.0 --port ${PORT}
```

### Error: "CORS policy blocked"
```bash
# Actualizar CORS_ORIGINS con la URL de tu frontend
# Separar múltiples orígenes con coma:
CORS_ORIGINS=https://app1.com,https://app2.com
```

### Frontend no se conecta al backend
```bash
# Verificar REACT_APP_BACKEND_URL en .env
# Debe ser la URL completa: https://siriu-backend.onrender.com
# No incluir /api al final
```

---

## 📊 COMPARATIVA FINAL

| Característica | Render | Railway | Fly.io | Vercel (frontend) |
|----------------|--------|---------|--------|-------------------|
| **Costo Free** | $0 | $5 crédito | $0 | $0 |
| **Horas/mes** | 750 | ~500 | Ilimitado | Ilimitado |
| **Sleep** | 15 min | No | No | No |
| **SSL** | ✅ | ✅ | ✅ | ✅ |
| **CI/CD** | ✅ | ✅ | ✅ | ✅ |
| **Setup** | Fácil | Medio | Medio | Muy fácil |

---

## 🎯 RECOMENDACIÓN FINAL

Para testing gratuito antes de GCP:

```
Backend:  Render.com (más fácil, sin CLI)
Database: MongoDB Atlas M0 (512MB gratis permanente)
Frontend: Vercel.com (deployment automático)
```

**Pros:**
- Setup en 15-20 minutos
- Sin instalación de CLIs
- 100% interfaz web
- Auto-deploy desde GitHub
- SSL automático
- Logs en tiempo real

**Contras:**
- Backend duerme después de 15 min inactividad
- Primer request tarda ~30 segundos en despertar
- Límite de 750 horas/mes (suficiente para testing)

---

## 📞 SOPORTE

Si tienes problemas:
- Render: https://render.com/docs
- Railway: https://docs.railway.app
- Fly.io: https://fly.io/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com

¡Buena suerte con tu deployment! 🚀
