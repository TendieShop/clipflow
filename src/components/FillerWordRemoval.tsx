// Filler Word Removal - Simple pattern matching for common fillers
import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

// Common filler words to detect and remove
const COMMON_FILLERS = [
  { word: 'um', regex: /\bum\b/gi, description: '"um"' },
  { word: 'uh', regex: /\buh\b/gi, description: '"uh"' },
  { word: 'like', regex: /\blike\b(?!\s+(?:you|me|to|that|this))\b/gi, description: '"like" (filler)' },
  { word: 'you know', regex: /you know/gi, description: '"you know"' },
  { word: 'I mean', regex: /I mean/gi, description: '"I mean"' },
  { word: 'sort of', regex: /\bsort of\b/gi, description: '"sort of"' },
  { word: 'kind of', regex: /\bkind of\b/gi, description: '"kind of"' },
  { word: 'basically', regex: /\bbasically\b/gi, description: '"basically"' },
  { word: 'actually', regex: /\bactually\b/gi, description: '"actually"' },
  { word: 'right', regex: /\bright\b(?!\s*\?)/gi, description: '"right" (not question)' },
  { word: 'so', regex: /\bso\b(?=\s*[A-Z])/g, description: '"so" (sentence starter)' },
  { word: 'well', regex: /\bwell\b(?=\s*[A-Z])/g, description: '"well" (filler)' },
];

interface FillerWordRemovalProps {
  transcriptionText: string;
  onApplyChanges: (newText: string, removedCount: number) => void;
}

export function FillerWordRemoval({
  transcriptionText,
  onApplyChanges,
}: FillerWordRemovalProps) {
  const [selectedFillers, setSelectedFillers] = useState<Set<string>>(
    new Set(['um', 'uh', 'like', 'you know', 'I mean'])
  );
  const [previewMode, setPreviewMode] = useState(false);

  const toggleFiller = useCallback((word: string) => {
    setSelectedFillers(prev => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.add(word);
      }
      return next;
    });
  }, []);

  const countFillers = useCallback((text: string, fillers: Set<string>): number => {
    let count = 0;
    for (const filler of fillers) {
      const pattern = COMMON_FILLERS.find(f => f.word === filler);
      if (pattern) {
        const matches = text.match(pattern.regex);
        count += matches ? matches.length : 0;
      }
    }
    return count;
  }, []);

  const removeFillers = useCallback((text: string, fillers: Set<string>): string => {
    let result = text;
    for (const filler of fillers) {
      const pattern = COMMON_FILLERS.find(f => f.word === filler);
      if (pattern) {
        result = result.replace(pattern.regex, '');
      }
    }
    // Clean up extra spaces
    return result.replace(/\s+/g, ' ').trim();
  }, []);

  const handleApply = useCallback(() => {
    const cleanedText = removeFillers(transcriptionText, selectedFillers);
    const removedCount = countFillers(transcriptionText, selectedFillers);
    onApplyChanges(cleanedText, removedCount);
  }, [transcriptionText, selectedFillers, removeFillers, countFillers, onApplyChanges]);

  const previewText = previewMode ? removeFillers(transcriptionText, selectedFillers) : transcriptionText;
  const removedCount = countFillers(transcriptionText, selectedFillers);

  return (
    <div className="filler-removal">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Filler Word Removal</CardTitle>
              <CardDescription>
                Remove common filler words from your transcript
              </CardDescription>
            </div>
            <div className="count-badge">
              {removedCount} filler{removedCount !== 1 ? 's' : ''} found
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filler toggles */}
          <div className="fillers-grid">
            {COMMON_FILLERS.map(filler => (
              <label key={filler.word} className="filler-toggle">
                <input
                  type="checkbox"
                  checked={selectedFillers.has(filler.word)}
                  onChange={() => toggleFiller(filler.word)}
                />
                <span className="filler-name">{filler.description}</span>
              </label>
            ))}
          </div>

          {/* Preview */}
          <div className="preview-section">
            <div className="preview-header">
              <label className="preview-toggle">
                <input
                  type="checkbox"
                  checked={previewMode}
                  onChange={(e) => setPreviewMode(e.target.checked)}
                />
                <span>Show preview (without fillers)</span>
              </label>
              <Button
                variant="default"
                size="sm"
                onClick={handleApply}
                disabled={removedCount === 0 || previewMode}
              >
                Apply Changes
              </Button>
            </div>
            <div className="preview-text">
              {previewText || 'No transcript available. Generate a transcript first.'}
            </div>
          </div>

          <style>{`
            .fillers-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
              gap: 0.5rem;
              margin-bottom: 1rem;
            }
            
            .filler-toggle {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.5rem;
              background: var(--bg-secondary);
              border-radius: 6px;
              cursor: pointer;
              font-size: 0.875rem;
            }
            
            .filler-toggle:hover {
              background: var(--bg-tertiary);
            }
            
            .filler-toggle input {
              width: auto;
            }
            
            .count-badge {
              padding: 0.25rem 0.75rem;
              background: var(--accent);
              color: white;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 500;
            }
            
            .preview-section {
              border-top: 1px solid var(--border);
              padding-top: 1rem;
              margin-top: 1rem;
            }
            
            .preview-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 0.75rem;
            }
            
            .preview-toggle {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 0.875rem;
              cursor: pointer;
            }
            
            .preview-toggle input {
              width: auto;
            }
            
            .preview-text {
              padding: 1rem;
              background: var(--bg-primary);
              border-radius: 8px;
              font-size: 0.875rem;
              line-height: 1.6;
              max-height: 200px;
              overflow-y: auto;
              white-space: pre-wrap;
            }
          `}</style>
        </CardContent>
      </Card>
    </div>
  );
}
