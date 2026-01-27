# TIL India Crane Puzzle

Interactive jigsaw puzzle game for TIL India kiosks.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **VitePWA** - Offline support & service workers
- **IndexedDB** - Local storage

## Run Instructions

```bash
# Install dependencies
npm install

# Development server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build (http://localhost:4173)
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (button, card, dialog, input)
│   ├── GameHeader.tsx   # Game screen header with controls
│   ├── GamePlayArea.tsx # Main puzzle drag-drop area
│   └── ImageUpload.tsx  # Image upload component
├── screens/
│   ├── AdminPanel.tsx   # Admin config screen
│   └── GameScreen.tsx   # Main game + difficulty selection
├── stores/
│   ├── adminStore.ts    # Admin settings (image, password)
│   ├── appStore.ts      # App navigation state
│   └── gameStore.ts     # Game logic & puzzle state
├── lib/
│   ├── constants.ts     # Grid configs & constants
│   ├── crypto.ts        # Password hashing
│   ├── imageSlicer.ts   # Image slicing logic
│   ├── puzzleRules.ts   # Puzzle validation & rules
│   ├── storage.ts       # IndexedDB persistence
│   └── utils.ts         # Utility functions
├── App.tsx              # Root component
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## Features

- 3x3, 4x4, 5x5 puzzle grids
- Drag & drop with touch support
- Offline-capable PWA
- Admin panel for image upload
