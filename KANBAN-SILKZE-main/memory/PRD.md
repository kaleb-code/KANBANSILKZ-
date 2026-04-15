# SilkZé Kanban - PRD

## Original Problem Statement
Rebuild an HTML/JS Kanban production management system (SilkZé t-shirt printing) as a mobile-first responsive web app. Fix security issues (Firebase credentials exposed), improve responsiveness, reduce errors. Use MongoDB instead of Firebase. Light theme with orange/white/cream colors.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Phosphor Icons
- **Backend**: FastAPI + MongoDB (Motor async) 
- **Auth**: JWT via httpOnly secure cookies
- **Image Storage**: Server filesystem (Pillow-optimized)
- **PDF Generation**: ReportLab server-side

## What's Been Implemented (2026-04-15)

### MVP (Complete)
- [x] 12-column Kanban board with drag-and-drop
- [x] Order detail slide-over with 6 tabs (Informações, Orçar, Grade, Verificar, Imagem, Layout)
- [x] Dynamic budget with auto-calculations (subtotal, discount, entrada, restante)
- [x] Adult + Kids size grids with totals
- [x] Print grade with image functionality
- [x] Production checklist with progress bar
- [x] Image upload with optimization
- [x] PDF generation for budgets
- [x] Backup/Restore functionality
- [x] Search by client/material/details
- [x] Mobile-first responsive design

### Code Quality Refactor (Complete)
- [x] Migrated from localStorage to httpOnly secure cookies
- [x] Extracted custom hooks (useDragAndDrop, usePedidoForm)
- [x] Fixed all React hooks dependency warnings
- [x] Replaced array index keys with stable UIDs
- [x] Removed all console statements
- [x] Refactored PDF generation into helper functions
- [x] Added logout endpoint with cookie cleanup

### UI Updates (2026-04-15)
- [x] Renamed tabs: Info→Informações, Orcamento→Orçar, Check→Verificar
- [x] Added "Imprimir Grade com Imagem" button in Grade tab

## Test Results
- Backend: 100% (11/11 endpoints)
- Frontend: 98% (all flows passing)

## Prioritized Backlog
### P1 (Next)
- Real-time sync (WebSocket)
- Multi-user with roles
- PWA/Offline support

### P2
- Dashboard/analytics
- History/audit log
- Comments per order
- Bulk operations
