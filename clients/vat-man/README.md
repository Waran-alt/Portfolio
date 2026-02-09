# VatMan

SaaS PWA for winery vat management. A visual "terrain layer" that works alongside existing ERPs.

## Tech Stack

- **Frontend**: Next.js 15, Konva/React-Konva (canvas), Tailwind CSS, Lucide-React
- **Backend**: Express, PostgreSQL
- **Data**: Coordinates (x, y) stored as percentages (0.0–1.0) for responsiveness

## V1 MVP Features

- Cellar plan canvas with background image upload (PNG/JPG)
- Interactive vat markers with status colors
- Mobile-first Quick Update form
- Multi-tenant isolation (domain-scoped vats)
- Role-based access: Admin, Editor, Viewer
- Audit log: TankEvent records (Who, What, When, Before/After)

## Performance Targets

- Cellar plan load: <2s
- Vat update: <10s
