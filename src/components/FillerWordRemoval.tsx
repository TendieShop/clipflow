import { useState, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface FillerWordRemovalProps {
  transcriptionText: string;
  onApplyChanges: (newText: string, removedWords: string[]) => void;
}

interface FillerWordPattern {
  word: string;
  regex: RegExp;
  description: string;
}

// Common filler words to detect and remove
const FILLER_WORDS: FillerWordPattern[] = [
  { word: 'um', regex: /\bum\b/gi, description: '"um"' },
  { word: 'uh', regex: /\buh\b/gi, description: '"uh"' },
  { word: 'like', regex: /\blike\b/gi, description: '"like" (as filler)' },
  { word: 'you know', regex: /you know/gi, description: '"you know"' },
  { word: 'I mean', regex: /I mean/gi, description: '"I mean"' },
  { word: 'sort of', regex: /\bsort of\b/gi, description: '"sort of"' },
  { word: 'kind of', regex: /\bkind of\b/gi, description: '"kind of"' },
  { word: 'basically', regex: /\bbasically\b/gi, description: '"basically"' },
  { word: 'actually', regex: /\bactually\b/gi, description: '"actually"' },
  { word: 'right', regex: /\bright\b/gi, description: '"right" (as filler)' },
  { word: 'so', regex: /\bso\b/gi, description: '"so" (sentence starter)' },
  { word: 'well', regex: /\bwell\b/gi, description: '"well" (filler)' },
];

export function FillerWordRemoval({
  transcriptionText,
  onApplyChanges,
}: FillerWordRemovalProps) {
  const [customWords, setCustomWords] = useState<string>('');
  const [selectedFillers, setSelectedFillers] = useState<Set<string>>(
    new Set(['um', 'uh', 'like', 'you know', 'I mean'])
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [removedCounts, setRemovedCounts] = useState<Record<string, number>>({});

  // Calculate removal statistics
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalRemoved = 0;

    const activePatterns = [
      ...FILLER_WORDS.filter((f) => selectedFillers.has(f.word)),
      ...customWords
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean)
        .map((w) => ({
          word: w,
          regex: new RegExp(`\\b${w}\\b`, 'gi'),
          description: `"${w}"`,
        })),
    ];

    activePatterns.forEach((pattern) => {
      const matches = transcriptionText.match(pattern.regex);
      const count = matches ? matches.length : 0;
      counts[pattern.word] = count;
      totalRemoved += count;
    });

    return { counts, totalRemoved, activePatterns };
  }, [transcriptionText, selectedFillers, customWords]);

  const handleToggleFiller = useCallback((word: string) => {
    setSelectedFillers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(word)) {
        newSet.delete(word);
      } else {
        newSet.add(word);
      }
      return newSet;
    });
  }, []);

  const handlePreview = useCallback(() => {
    let text = transcriptionText;
    const allPatterns = [
      ...FILLER_WORDS.filter((f) => selectedFillers.has(f.word)),
      ...customWords
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean)
        .map((w) => ({
          word: w,
          regex: new RegExp(`\\b${w}\\b`, 'gi'),
          description: `"${w}"`,
        })),
    ];

    const counts: Record<string, number> = {};
    allPatterns.forEach((pattern) => {
      text = text.replace(pattern.regex, () => {
        counts[pattern.word] = (counts[pattern.word] || 0) + 1;
        return '[_removed_]';
      });
    });

    // Clean up multiple removed markers
    text = text.replace(/\[\]_removed_\[\]_removed_+/g, '[_removed_]');
    text = text.replace(/\[\]_removed_\s*/g, '');
    text = text.replace(/_removed_/g, '');

    setRemovedCounts(counts);
    setPreviewText(text);
    setPreviewMode(true);
  }, [transcriptionText, selectedFillers, customWords]);

  const handleApply = useCallback(() => {
    let text = transcriptionText;
    const removedWords: string[] = [];

    const allPatterns = [
      ...FILLER_WORDS.filter((f) => selectedFillers.has(f.word)),
      ...customWords
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean)
        .map((w) => ({
          word: w,
          regex: new RegExp(`\\b${w}\\b`, 'gi'),
          description: `"${w}"`,
        })),
    ];

    allPatterns.forEach((pattern) => {
      text = text.replace(pattern.regex, () => {
        removedWords.push(pattern.word);
        return '';
      });
    });

    onApplyChanges(text.trim(), removedWords);
    setPreviewMode(false);
  }, [transcriptionText, selectedFillers, customWords, onApplyChanges]);

  const handleReset = useCallback(() => {
    setPreviewMode(false);
    setPreviewText('');
    setRemovedCounts({});
  }, []);

  return (
    <div className="filler-removal-panel">
      <Card>
        <CardHeader>
          <CardTitle>Filler Word Removal</CardTitle>
          <CardDescription>
            Remove common filler words (um, uh, like, you know, etc.) from transcript
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="controls">
            {/* Default filler words */}
            <div className="filler-grid">
              {FILLER_WORDS.map((filler) => (
                <button
                  key={filler.word}
                  className={`filler-toggle ${selectedFillers.has(filler.word) ? 'selected' : ''}`}
                  onClick={() => handleToggleFiller(filler.word)}
                  type="button"
                >
                  <span className="filler-word">{filler.word}</span>
                  <span className="filler-count">
                    {stats.counts[filler.word] || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom words */}
            <div className="custom-words">
              <label>Custom words (comma-separated)</label>
              <input
                type="text"
                value={customWords}
                onChange={(e) => setCustomWords(e.target.value)}
                placeholder="actually, basically, literally"
              />
            </div>

            {/* Preview/Apply buttons */}
            <div className="action-buttons">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!transcriptionText}
              >
                Preview Changes
              </Button>
              <Button
                onClick={handleApply}
                disabled={!previewMode || stats.totalRemoved === 0}
              >
                Apply Removal ({stats.totalRemoved} words)
              </Button>
              {previewMode && (
                <Button variant="ghost" onClick={handleReset}>
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Preview mode */}
          {previewMode && (
            <div className="preview-section">
              <div className="preview-header">
                <h4>Preview ({stats.totalRemoved} words will be removed)</h4>
              </div>
              <div className="preview-stats">
                {Object.entries(removedCounts)
                  .filter(([, count]) => count > 0)
                  .map(([word, count]) => (
                    <span key={word} className="stat-badge">
                      {word}: {count}
                    </span>
                  ))}
              </div>
              <div className="preview-text">
                {previewText || transcriptionText}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!transcriptionText && (
            <div className="empty-state">
              <p>Transcribe a video first to remove filler words</p>
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        .filler-removal-panel {
          width: 100%;
        }

        .controls {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .filler-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .filler-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--background);
          cursor: pointer;
          transition: all 0.2s;
        }

        .filler-toggle:hover {
          border-color: var(--accent);
        }

        .filler-toggle.selected {
          background: rgba(59, 130, 246, 0.1);
          border-color: var(--accent);
        }

        .filler-word {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .filler-count {
          font-size: 0.75rem;
          padding: 0.125rem 0.375rem;
          background: var(--bg-secondary);
          border-radius: 9999px;
          color: var(--text-secondary);
        }

        .filler-toggle.selected .filler-count {
          background: var(--accent);
          color: white;
        }

        .custom-words {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .custom-words label {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .custom-words input {
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--background);
          color: var(--foreground);
          font-size: 0.875rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .preview-section {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .preview-header {
          margin-bottom: 0.75rem;
        }

        .preview-header h4 {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .preview-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .stat-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-radius: 4px;
        }

        .preview-text {
          font-size: 0.875rem;
          line-height: 1.6;
          white-space: pre-wrap;
          max-height: 300px;
          overflow-y: auto;
          padding: 0.75rem;
          background: var(--background);
          border-radius: 6px;
        }

        .empty-state {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
