# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Context (Read First)
- **Tech Stack**: Vue 3 + TypeScript + Pinia + PrimeVue + Vite + FontAwesome + XLSX
- **Main File**: HomeView.vue (~3000+ lines) - Primary application interface
- **Core Mechanic**: Pharmacy reservation system with credit-based payments and AI-powered search
- **Key Integration**: Backend TTM hébergé sur Render à https://api-ttm.onrender.com (production), fallback vers localhost:8000 (développement local), additional reservations API at demo2.srv557357.hstgr.cloud
- **Platform Support**: Web application with mobile-responsive design, ngrok-ready dev server
- **DO NOT**: Commit changes unless explicitly requested by user

## Commands Reference

### Development
```bash
npm run dev          # Start development server on port 5173
npm run build        # Build for production (runs type-check first)
npm run preview      # Preview production build
npm run type-check   # Run TypeScript compiler check
npm run lint         # Run ESLint with auto-fix
npm run format       # Format code with Prettier
```

### Testing
```bash
npm run test:unit              # Run Vitest unit tests
npm run test:e2e               # Run Playwright end-to-end tests
npm run test:e2e -- --project=chromium  # Run tests only on Chromium
npm run test:e2e -- tests/example.spec.ts  # Run specific test file
npm run test:e2e -- --debug   # Run tests in debug mode
npx playwright install        # Install browsers for first E2E run
```

## Architecture Overview

### Store Management (Pinia)
- **Credit System**: `useCreditStore` - Manages user credit balance, account operations, and payment processing
- **Authentication**: `useAuthStore` - User login/logout, token management, session persistence
- **Shopping Cart**: `useCartStore` - Reservation management, quantity tracking, local storage sync
- **Application State**: `useAppStore` - Product selection, pharmacy availability, temporary UI state

### Key Components Flow
1. **HomeView.vue** - Main interface with search, AI assistant, and reservation management
2. **Credit Verification** - All reservations require 1 credit deduction before processing
3. **Smart Reservation Flow** - AI-powered search and automatic reservation (`aiHeadlessReservationFlow`)
4. **Province-based Filtering** - Geographic constraints for pharmacy availability

### Services Layer
- **CreditService.ts** - Handles credit operations with multiple API endpoint fallbacks
- **HomeService.ts** - Product search, availability checks, and alternative suggestions
- **AuthService.ts** - Authentication flows integrated with Pinia stores
- **ProductService.ts** - Product catalog and search operations

## Smart Reservation System

The intelligent reservation feature (`aiHeadlessReservationFlow` in HomeView.vue) performs:

1. **Authentication Check** - Ensures user is logged in
2. **Province Resolution** - Matches location mentions to valid provinces
3. **Availability Check** - Queries pharmacy stock via `homeService.disponibilite()`
4. **Credit Verification** - Checks balance and debits 1 credit via `CreditService.souscrireCredit()`
5. **Auto-Selection** - Chooses best pharmacy based on location scoring
6. **Cart Addition** - Adds reservation to cart automatically

### Known Issue: Credit System Bug
**Problem**: Credit verification fails even with sufficient balance
**Symptoms**: "Impossibilité de faire une réservation intelligente" message
**Root Cause**: Credit deduction fails at `CreditService.souscrireCredit()` call - this service tries 6 different API endpoints as fallbacks

## Configuration

### API Endpoints (Backend Render - Production)
- **Backend TTM sur Render** (Production): `https://api-ttm.onrender.com`
  - Auth endpoints: `/auth/login`, `/auth/login_admin`
  - User management: `/user/*`
  - Account management: `/account/*`
  - Rate management: `/rate/*`
  - Product endpoints: `/api_epg/*`
  - Payment: `/my_pay_ga/*`, `/sing_pay_api/*`
- **Backend Local** (Développement): `http://localhost:8000` (fallback automatique)
- **Reservations API**: `https://demo2.srv557357.hstgr.cloud` (via `/reservations-api/*` proxy)
- **Development Server**: Fixed on port 5173 with CORS enabled and multiple proxy configurations

### Vite Proxy Configuration (Backend Render)
Configuration proxy pour le backend TTM sur Render dans vite.config.ts:
- `/auth/*` → https://api-ttm.onrender.com (authentification)
- `/user/*` → https://api-ttm.onrender.com (gestion utilisateurs)
- `/account/*` → https://api-ttm.onrender.com (gestion comptes)
- `/rate/*` → https://api-ttm.onrender.com (tarification)
- `/api_epg/*` → https://api-ttm.onrender.com (produits EPG)
- `/my_pay_ga/*` → https://api-ttm.onrender.com (paiements MyPayGa)
- `/sing_pay_api/*` → https://api-ttm.onrender.com (paiements SingPay)
- `/reservations-api/*` → reservations API (externe, inchangé)

**Développement Local**: Pour utiliser le backend local, créer un fichier `.env.local` avec:
```env
VITE_API_BASE_URL=http://localhost:8000
```

**Important**: `secure: true` car Render fournit HTTPS natif

## Authentification Backend TTM

### Structure des données
Le backend TTM utilise une structure différente pour les utilisateurs:
```typescript
interface User {
  id: number
  email: string
  firstname: string
  lastname: string
  phone?: string
  role: string // "USER" ou "ADMIN"
  created_at?: string
  updated_at?: string
}

interface Token {
  access_token: string
  token_type: string // "bearer"
}
```

### Endpoints d'authentification
- **POST /auth/login**: Connexion utilisateur standard (OAuth2PasswordRequestForm)
- **POST /auth/login_admin**: Connexion administrateur (vérification du rôle)

### Méthodes AuthService
- `AuthService.login()`: Connexion standard
- `AuthService.loginAdmin()`: Connexion admin
- `AuthService.register()`: Inscription (vers `/user/add`)

### Tests de développement
Composant de test disponible: `BackendTestComponent.vue`
Service de test: `BackendTestService.ts`

### Environment Integration
- **NGROK Support**: Configured for external tunnel access with `host: true` and `allowedHosts: true`
- **Hot Reload**: Vite dev server with Vue DevTools integration
- **Strict Port**: Development server enforces port 5173 with `strictPort: true`

## Development Workflow

1. **Start Development**: `npm run dev`
2. **Test Credit Flow**: Navigate to smart search, try reservation
3. **Debug Store State**: Use Vue DevTools to inspect Pinia stores
4. **Check API Calls**: Monitor Network tab for CreditService requests
5. **Lint Before Commit**: `npm run lint && npm run type-check`

## Common Debugging Patterns

### Credit System Issues
- Check `useCreditStore.credits` for current balance
- Verify `creditStore.accountId` is properly set
- Monitor `CreditService.souscrireCredit()` API responses
- Review error messages in `CreditService.lastError`

### Authentication Problems
- Verify `useAuthStore.isLoggedIn` state
- Check localStorage for persisted user data
- Test token validity with API calls

### Reservation Failures
- Confirm product availability via `homeService.disponibilite()`
- Validate province filtering logic
- Check pharmacy candidate selection in `aiHeadlessReservationFlow`

## Migration Notes

Project migrated from localStorage to Pinia stores (see MIGRATION_PINIA.md):
- Authentication state now in `useAuthStore`
- Cart persistence through `useCartStore` 
- Credit management via `useCreditStore`
- Legacy `StorageService.ts` marked for removal

## File Structure Highlights
```
src/
├── stores/          # Pinia state management
│   ├── credit.ts    # Credit system store
│   ├── auth.ts      # Authentication store
│   └── cart.ts      # Shopping cart store
├── Services/        # API integration layer
│   ├── CreditService.ts   # Credit operations
│   └── HomeService.ts     # Core business logic
├── components/      # Vue components
├── views/
│   └── HomeView.vue # Main application interface
└── types/          # TypeScript definitions
```

## Performance Considerations
- Large HomeView.vue component (~3000 lines) - consider splitting for maintainability
- API calls include multiple fallback strategies (see CreditService.ts for 6 different credit endpoints)
- Province matching uses fuzzy search algorithms
- Cart data persists to localStorage on every change via Pinia store persistence
- Excel file processing via XLSX library for product imports

## Testing Strategy
- Unit tests with Vitest for store logic
- E2E tests with Playwright for user flows
- Manual testing required for credit/payment integration
- API mocking recommended for reliable test environments