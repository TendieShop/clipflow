# ClipFlow

AI-powered video editor with silence detection, transcription, and narrative AI suggestions.

![ClipFlow](./docs/screenshot.png)

## Features

- **🎬 Video Import** - Import videos in MP4, MOV, AVI, MKV, WebM, M4V formats
- **🔇 Silence Detection** - Automatically detect and remove silent portions
- **📝 Local Transcription** - AI transcription using local Whisper models (no cloud API)
- **✂️ Video Trimming** - Trim videos with precision
- **📤 Export** - Export with quality settings (High, Medium, Low)
- **💾 Project Persistence** - Auto-save and crash recovery
- **🌙 Dark Mode** - System-aware theming

## Installation

### Prerequisites

- [FFmpeg](https://ffmpeg.org/) - For video processing
- [Whisper](https://github.com/openai/whisper) - For local transcription (optional)

### Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

**Windows:**
```bash
winget install FFmpeg
```

### Install Whisper (Optional)

```bash
pip install openai-whisper
```

### Run ClipFlow

```bash
npm install
npm run dev
```

## Usage

### Importing Videos

1. Click **+ Import** or press `Cmd/Ctrl + I`
2. Select video files from your computer
3. Videos are added to the project

### Silence Detection

1. Select a video from the sidebar
2. Click **Silence Detection** in the right panel
3. Adjust threshold if needed
4. View detected silent segments

### Exporting

1. Select a video
2. Click **Export**
3. Choose quality and format
4. Click **Export** to save

### Settings

Click the **Settings** icon (⚙️) to configure:
- Theme (Dark/Light/System)
- Auto-save interval
- FFmpeg path
- Whisper model

## Architecture

```
clipflow/
├── src/
│   ├── components/       # React components
│   │   ├── ImportDialog.tsx
│   │   ├── ExportDialog.tsx
│   │   ├── SettingsDialog.tsx
│   │   └── ...
│   ├── lib/              # Utilities
│   │   ├── project.ts    # Project management
│   │   ├── project-store.ts  # Persistence
│   │   ├── logger.ts     # Structured logging
│   │   ├── errors.ts     # Error types
│   │   └── video.ts      # Video operations
│   ├── App.tsx           # Main app
│   └── main.tsx          # Entry point
├── src-tauri/            # Tauri native bindings
├── tests/
│   └── e2e/              # End-to-end tests
└── .github/
    └── workflows/        # CI/CD
```

## Development

### Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for web
npm run build:tauri  # Build native app
npm run test         # Run tests
npm run gate         # Lint + Build + Test
```

### Adding Components

```bash
npx shadcn@latest add button dialog
```

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npx playwright test tests/e2e/
```

### Gate (Before Commit)

```bash
npm run gate
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tauri** - Native desktop app
- **Tailwind CSS** - Styling
- **shadcn/ui** - Design system
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## License

MIT
