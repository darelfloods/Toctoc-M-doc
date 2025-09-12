# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Context (Read First)
- **Tech Stack**: Vue 3 + TypeScript + Pinia + PrimeVue + Vite
- **Main File**: HomeView.vue (~1500+ lines) - Primary application interface
- **Core Mechanic**: Pharmacy reservation system with credit-based payments
- **Key Integration**: Backend API at https://51.68.46.67:8000, n8n at localhost:5678
- **Platform Support**: Web application with mobile-responsive design
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
npm run test:unit    # Run Vitest unit tests
npm run test:e2e     # Run Playwright end-to-end tests
npx playwright install  # Install browsers for first E2E run
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

The intelligent reservation feature (`aiHeadlessReservationFlow` in HomeView.vue:567) performs:

1. **Authentication Check** - Ensures user is logged in
2. **Province Resolution** - Matches location mentions to valid provinces
3. **Availability Check** - Queries pharmacy stock via `homeService.disponibilite()`
4. **Credit Verification** - Checks balance and debits 1 credit via `CreditService.souscrireCredit()`
5. **Auto-Selection** - Chooses best pharmacy based on location scoring
6. **Cart Addition** - Adds reservation to cart automatically

### Known Issue: Credit System Bug
**Location**: HomeView.vue:692-708
**Problem**: Credit verification fails even with sufficient balance
**Symptoms**: "Impossibilité de faire une réservation intelligente" message
**Root Cause**: Credit deduction fails at `CreditService.souscrireCredit()` call

## Configuration

### API Endpoints
- **Main API**: Proxied `/api/*` → `https://51.68.46.67:8000`
- **n8n Integration**: Proxied `/n8n/*` → `http://localhost:5678`
- **Development Server**: Fixed on port 5173 with CORS enabled

### Environment Integration
- **NGROK Support**: Configured for external tunnel access
- **Hot Reload**: Vite dev server with Vue DevTools integration
- **Proxy Configuration**: Handles API routing and CORS issues

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
- Large HomeView.vue component (~1500 lines) - consider splitting for maintainability
- API calls include multiple fallback strategies (see CreditService.ts:44-83)
- Province matching uses fuzzy search algorithms
- Cart data persists to localStorage on every change

## Testing Strategy
- Unit tests with Vitest for store logic
- E2E tests with Playwright for user flows
- Manual testing required for credit/payment integration
- API mocking recommended for reliable test environments