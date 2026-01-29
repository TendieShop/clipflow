import { useState, useCallback } from 'react';
import { useAI } from '@/lib/ai';
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
}

export function TranscriptEditor({
  segments,
}: TranscriptEditorProps) {
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  
  const { runCompletion, loading, error } = useAI({
    onSuccess: (result) => {
      setAiSuggestions(result.content);
    },
  });

  const getAiSuggestions = useCallback(async () => {
    const transcript = segments.map(s => s.text).join(' ');
    
    await runCompletion([
      { 
        role: 'system', 
        content: `You are an expert video editor. Analyze the transcript and provide suggestions to improve it. 
        Focus on:
        1. Clarity and conciseness
        2. Flow between segments
        3. Removing unnecessary words
        4. Improving transitions
        Return your suggestions as a numbered list with specific edits.`
      },
      { role: 'user', content: transcript }
    ]);
    
    setShowAISuggestions(true);
  }, [segments, runCompletion]);

  const applySuggestion = useCallback((suggestion: string) => {
    // For now, just show the suggestion - in a full implementation,
    // this would parse the suggestion and apply edits to segments
    setSelectedSuggestion(suggestion);
    setShowAISuggestions(false);
  }, []);

  const dismissSuggestions = useCallback(() => {
    setAiSuggestions(null);
    setShowAISuggestions(false);
    setSelectedSuggestion(null);
  }, []);

  return (
    <div className="transcript-editor">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Transcript Editor</CardTitle>
              <CardDescription>
                Edit and improve your transcript with AI assistance
              </CardDescription>
            </div>
            <Button 
              onClick={getAiSuggestions} 
              disabled={loading || segments.length === 0}
              variant="outline"
            >
              {loading ? 'Analyzing...' : '✨ Get AI Suggestions'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Segments list */}
          <div className="segments-list">
            {segments.map((segment) => (
              <div key={segment.id} className="segment">
                <div className="segment-header">
                  <span className="segment-time">
                    {Math.floor(segment.start / 60).toString().padStart(2, '0')}:
                    {Math.floor(segment.start % 60).toString().padStart(2, '0')}
                  </span>
                  {segment.speaker && (
                    <span className="segment-speaker">{segment.speaker}</span>
                  )}
                </div>
                <div className="segment-text">{segment.text}</div>
              </div>
            ))}
          </div>

          {/* AI Suggestions Panel */}
          {showAISuggestions && aiSuggestions && (
            <div className="ai-suggestions">
              <div className="suggestions-header">
                <h4>AI Suggestions</h4>
                <Button variant="ghost" size="sm" onClick={dismissSuggestions}>
                  ✕
                </Button>
              </div>
              <div className="suggestions-content">
                {aiSuggestions.split('\n').map((line, i) => {
                  const match = line.match(/^\d+\.\s*(.*)/);
                  const text = match ? match[1] : line;
                  if (!text.trim()) return null;
                  
                  return (
                    <div key={i} className="suggestion-item">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => applySuggestion(text)}
                      >
                        +
                      </Button>
                      <span>{text}</span>
                    </div>
                  );
                })}
              </div>
              {error && (
                <div className="error-message">
                  AI Error: {error.message}
                </div>
              )}
            </div>
          )}

          {/* Applied suggestion notification */}
          {selectedSuggestion && (
            <div className="applied-notification">
              <span>✓ AI suggestion applied: "{selectedSuggestion.substring(0, 50)}..."</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSuggestion(null)}>
                Dismiss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        .transcript-editor {
          width: 100%;
        }

        .segments-list {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid var(--border);
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .segment {
          padding: 0.75rem;
          border-bottom: 1px solid var(--border);
        }

        .segment:last-child {
          border-bottom: none;
        }

        .segment-header {
          display: flex;
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

        .segment-text {
          font-size: 0.875rem;
          line-height: 1.6;
          padding-left: 3.5rem;
        }

        .ai-suggestions {
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .suggestions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .suggestions-header h4 {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .suggestions-content {
          max-height: 300px;
          overflow-y: auto;
        }

        .suggestion-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 6px;
          margin-bottom: 0.5rem;
          background: var(--background);
        }

        .suggestion-item:hover {
          background: var(--bg-tertiary);
        }

        .suggestion-item span {
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .error-message {
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-radius: 6px;
          font-size: 0.875rem;
          margin-top: 1rem;
        }

        .applied-notification {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border-radius: 6px;
          font-size: 0.875rem;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}
