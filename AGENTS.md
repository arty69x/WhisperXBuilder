# WhisperX Builder MAX: Core Directives

## 1. Aesthetic Identity: "Corporate Brutalism"
- **Background**: Absolute White (`#FFFFFF`).
- **Borders**: Solid Black (`#000000`), 4px or 8px thickness.
- **Shadows**: Hard offset shadows only. `shadow-[4px_4px_0_black]` or `shadow-[8px_8px_0_black]`. No blurs.
- **Typography**: 
  - Display: `Outfit` (Black weight).
  - Body: `Inter` (Medium/Regular).
  - Mono: `Space Mono` (Bold/Regular).
- **Core Palette (RYGB)**:
  - Red: `#dc2626` (Danger/Heat)
  - Yellow: `#eab308` (Warning/Wizardry)
  - Green: `#16a34a` (Success/Logic)
  - Blue: `#2563eb` (Accent/Focus)

## 2. Component Standards
- **Buttons**: `btn` class. High contrast, uppercase, bold.
- **Panels**: White background, black border, hard shadow. Sharp 0px corners.
- **Inputs**: 4px border, font-bold, background shift on focus (e.g., `focus:bg-yellow-50`).

## 3. Technical Requirements
- **Authentication**: JWT-based server-side auth is mandatory. 
- **Auto-save**: Heartbeat at 30s intervals to `/api/db`.
- **Environment**: Secrets must be declared in `.env.example` and accessed via `process.env`.
- **AI Integration**: Use `gemini-3.1-pro-preview` with thinking mode enabled for complex logic.
