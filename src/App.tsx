import { useState } from 'react';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);

  return (
    <div className="app">
      <header className="header">
        <h1>Clip<span>Flow</span></h1>
        <nav>
          <button className="btn btn-secondary">Settings</button>
        </nav>
      </header>

      <main className="main-content">
        <section className="hero">
          <h2>AI-Powered Video Editing</h2>
          <p>
            Import your raw footage and let ClipFlow do the heavy lifting. 
            Silence detection, transcription, and AI-powered narrative editing — all in one app.
          </p>
          <ImportSection />
        </section>

        <section className="features">
          <FeatureCard
            icon="🎬"
            title="Smart Silence Detection"
            description="Automatically detect and remove silent portions of your footage for cleaner, tighter edits."
          />
          <FeatureCard
            icon="📝"
            title="AI Transcription"
            description="Whisper-powered transcription with filler word detection. Remove 'hmm', 'aah', and ums with one click."
          />
          <FeatureCard
            icon="🤖"
            title="Narrative AI"
            description="Claude-powered AI analyzes your footage and suggests edits that tell a compelling story."
          />
          <FeatureCard
            icon="🎨"
            title="Timeline Editor"
            description="Full NLE features with drag-and-drop timeline. Reorder clips and refine AI suggestions."
          />
        </section>
      </main>
    </div>
  );
}

interface Project {
  id: string;
  name: string;
  createdAt: Date;
}

function ImportSection() {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file drop
    console.log('Files dropped:', e.dataTransfer.files);
  };

  return (
    <div
      className="import-section"
      style={{
        borderColor: isDragging ? 'var(--accent)' : undefined,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <svg
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <h3>Import Video Footage</h3>
      <p>Drag and drop your video files here, or click to browse</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="feature-card">
      <h4>
        <span>{icon}</span>
        {title}
      </h4>
      <p>{description}</p>
    </div>
  );
}

export default App;
