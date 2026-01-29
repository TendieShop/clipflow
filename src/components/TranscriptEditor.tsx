import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

interface TranscriptEditorProps {
  segments: TranscriptSegment[];
  onChange: (segments: TranscriptSegment[]) => void;
  originalText?: string;
}

export function TranscriptEditor({
  segments,
  onChange,
  originalText,
}: TranscriptEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<TranscriptSegment[][]>([segments]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Calculate stats
  const totalWords = segments.reduce((sum, s) => sum + s.text.split(/\s+/).filter(Boolean).length, 0);
  const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0);
  const duration = segments.length > 0 ? segments[segments.length - 1].end - segments[0].start : 0;

  // Save to history
  const saveToHistory = useCallback((newSegments: TranscriptSegment[]) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newSegments);
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  }, [history, historyIndex, onChange]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  }, [history, historyIndex, onChange]);

  // Start editing a segment
  const handleStartEdit = useCallback((segment: TranscriptSegment) => {
    setEditingId(segment.id);
    setEditText(segment.text);
  }, []);

  // Save edited segment
  const handleSaveEdit = useCallback(() => {
    if (editingId) {
      const newSegments = segments.map((s) =>
        s.id === editingId ? { ...s, text: editText } : s
      );
      saveToHistory(newSegments);
      onChange(newSegments);
      setEditingId(null);
      setEditText('');
    }
  }, [editingId, editText, segments, saveToHistory, onChange]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText('');
  }, []);

  // Delete a segment
  const handleDeleteSegment = useCallback((id: string) => {
    const newSegments = segments.filter((s) => s.id !== id);
    saveToHistory(newSegments);
    onChange(newSegments);
  }, [segments, saveToHistory, onChange]);

  // Split segment at cursor or midpoint
  const handleSplitSegment = useCallback((segment: TranscriptSegment) => {
    const words = segment.text.split(' ');
    const midIndex = Math.floor(words.length / 2);
    const firstHalf = words.slice(0, midIndex).join(' ');
    const secondHalf = words.slice(midIndex).join(' ');

    const midTime = segment.start + (segment.end - segment.start) / 2;

    const newSegments = segments.map((s) => {
      if (s.id === segment.id) {
        return [
          { ...s, id: `${s.id}-1`, text: firstHalf, end: midTime },
          { ...s, id: `${s.id}-2`, text: secondHalf, start: midTime },
        ];
      }
      return s;
    }).flat();

    saveToHistory(newSegments);
    onChange(newSegments);
  }, [segments, saveToHistory, onChange]);

  // Merge with next segment
  const handleMergeNext = useCallback((segment: TranscriptSegment, index: number) => {
    if (index >= segments.length - 1) return;

    const nextSegment = segments[index + 1];
    const merged: TranscriptSegment = {
      ...segment,
      id: segment.id,
      text: `${segment.text} ${nextSegment.text}`.trim(),
      end: nextSegment.end,
    };

    const newSegments = [
      ...segments.slice(0, index),
      merged,
      ...segments.slice(index + 2),
    ];

    saveToHistory(newSegments);
    onChange(newSegments);
  }, [segments, saveToHistory, onChange]);

  // Auto-save on undo/redo
  useEffect(() => {
    setHistory((prev) => {
      const lastState = prev[prev.length - 1];
      if (JSON.stringify(lastState) !== JSON.stringify(segments)) {
        return [...prev, segments];
      }
      return prev;
    });
  }, [segments]);

  // Filter segments by search
  const filteredSegments = segments.filter((s) =>
    s.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="transcript-editor">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Transcript Editor</CardTitle>
              <CardDescription>
                Edit, split, merge, and search your transcript
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyIndex === 0}>
                ↶ Undo
              </Button>
              <Button variant="outline" size="sm" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                ↷ Redo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats bar */}
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-value">{formatTime(duration)}</span>
              <span className="stat-label">Duration</span>
            </div>
            <div className="stat">
              <span className="stat-value">{totalWords}</span>
              <span className="stat-label">Words</span>
            </div>
            <div className="stat">
              <span className="stat-value">{totalChars}</span>
              <span className="stat-label">Characters</span>
            </div>
            <div className="stat">
              <span className="stat-value">{segments.length}</span>
              <span className="stat-label">Segments</span>
            </div>
          </div>

          {/* Search */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                Clear
              </Button>
            )}
          </div>

          {/* Segments list */}
          <div className="segments-list">
            {(searchQuery ? filteredSegments : segments).map((segment, index) => (
              <div
                key={segment.id}
                className={`segment ${editingId === segment.id ? 'editing' : ''}`}
              >
                <div className="segment-header">
                  <span className="segment-time">{formatTime(segment.start)}</span>
                  {segment.speaker && (
                    <span className="segment-speaker">{segment.speaker}</span>
                  )}
                  <div className="segment-actions">
                    {index < segments.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMergeNext(segment, searchQuery ? segments.indexOf(segment) : index)}
                        title="Merge with next"
                      >
                        ⊕
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSplitSegment(segment)}
                      title="Split segment"
                      disabled={segment.text.split(' ').length < 2}
                    >
                      ✂
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSegment(segment.id)}
                      title="Delete segment"
                    >
                      🗑
                    </Button>
                  </div>
                </div>

                {editingId === segment.id ? (
                  <div className="edit-area">
                    <textarea
                      ref={editInputRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="edit-textarea"
                      rows={3}
                    />
                    <div className="edit-actions">
                      <span className="char-count">{editText.length} chars</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit}>
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="segment-text" onClick={() => handleStartEdit(segment)}>
                    {searchQuery ? (
                      <HighlightText text={segment.text} highlight={searchQuery} />
                    ) : (
                      segment.text
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Original text comparison */}
          {originalText && (
            <div className="original-comparison">
              <details>
                <summary>View Original Transcript</summary>
                <p className="original-text">{originalText}</p>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        .transcript-editor {
          width: 100%;
        }

        .stats-bar {
          display: flex;
          gap: 1.5rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .search-bar {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .search-input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--background);
          color: var(--foreground);
          font-size: 0.875rem;
        }

        .segments-list {
          max-height: 500px;
          overflow-y: auto;
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .segment {
          padding: 0.75rem;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.2s;
        }

        .segment:hover {
          background: var(--bg-secondary);
        }

        .segment.editing {
          background: rgba(59, 130, 246, 0.05);
        }

        .segment:last-child {
          border-bottom: none;
        }

        .segment-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .segment-time {
          font-size: 0.75rem;
          font-family: monospace;
          color: var(--text-secondary);
          padding: 0.125rem 0.375rem;
          background: var(--bg-secondary);
          border-radius: 4px;
        }

        .segment-speaker {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--accent);
        }

        .segment-actions {
          margin-left: auto;
          display: flex;
          gap: 0.25rem;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .segment:hover .segment-actions,
        .segment.editing .segment-actions {
          opacity: 1;
        }

        .segment-text {
          font-size: 0.875rem;
          line-height: 1.6;
          padding-left: 3.5rem;
        }

        .edit-area {
          padding-left: 3.5rem;
        }

        .edit-textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--accent);
          border-radius: 6px;
          background: var(--background);
          color: var(--foreground);
          font-size: 0.875rem;
          resize: vertical;
          font-family: inherit;
        }

        .edit-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
        }

        .char-count {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .flex {
          display: flex;
        }

        .gap-2 {
          gap: 0.5rem;
        }

        .original-comparison {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }

        .original-comparison summary {
          font-size: 0.875rem;
          cursor: pointer;
          color: var(--text-secondary);
        }

        .original-text {
          margin-top: 0.5rem;
          padding: 0.75rem;
          font-size: 0.8125rem;
          line-height: 1.6;
          background: var(--bg-secondary);
          border-radius: 6px;
          color: var(--text-secondary);
        }

        .highlight {
          background: rgba(251, 191, 36, 0.3);
          color: inherit;
          padding: 0 0.125rem;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}

// Helper component for search highlighting
function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <>{text}</>;

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="highlight">{part}</span>
        ) : (
          part
        )
      )}
    </>
  );
}
