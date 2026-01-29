#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Stdio};
use serde::{Serialize, Deserialize};
use tauri::Manager;
use tokio::fs;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to ClipFlow.", name)
}

#[tauri::command]
async fn get_video_duration(file_path: &str) -> Result<f64, String> {
    let output = Command::new("ffprobe")
        .args(&[
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            file_path,
        ])
        .output();

    match output {
        Ok(output) => {
            if output.status.success() {
                let duration_str = String::from_utf8_lossy(&output.stdout);
                if let Ok(duration) = duration_str.trim().parse::<f64>() {
                    Ok(duration)
                } else {
                    Err("Failed to parse duration".to_string())
                }
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                Err(format!("ffprobe failed: {}", error))
            }
        }
        Err(e) => Err(format!("Failed to run ffprobe: {}", e)),
    }
}

#[tauri::command]
async fn trim_video(input_path: &str, output_path: &str, start_time: f64, end_time: f64) -> Result<bool, String> {
    let status = Command::new("ffmpeg")
        .args(&[
            "-i", input_path,
            "-ss", &format!("{}", start_time),
            "-to", &format!("{}", end_time),
            "-c", "copy",
            output_path,
            "-y",
        ])
        .status();

    match status {
        Ok(status) => {
            if status.success() {
                Ok(true)
            } else {
                Err("ffmpeg trim failed".to_string())
            }
        }
        Err(e) => Err(format!("Failed to run ffmpeg: {}", e)),
    }
}

#[tauri::command]
async fn cut_video_remove(input_path: &str, output_path: &str, segments: Vec<CutSegment>) -> Result<bool, String> {
    // Build FFmpeg complex filter for removing segments
    // For simplicity, we'll concatenate kept parts

    let mut args = vec!["-i", input_path, "-filter_complex", ""];

    // Build the filter string: [0:v]trim=0:10[v0];[v0][1:v]concat[outv]
    let filter_parts: Vec<String> = segments.iter()
        .enumerate()
        .map(|(i, seg)| {
            format!("[0:v]trim=start={},end={},setpts=PTS-STARTPTS[v{}];[0:a]atrim=start={},end={},asetpts=PTS-STARTPTS[a{}]",
                seg.keep_start, seg.keep_end, i, seg.keep_start, seg.keep_end, i)
        })
        .collect();

    // For now, do a simple copy if no segments
    if segments.is_empty() {
        let status = Command::new("ffmpeg")
            .args(&[ "-i", input_path, "-c", "copy", output_path, "-y"])
            .status();
        return match status {
            Ok(status) => Ok(status.success()),
            Err(e) => Err(format!("Failed to run ffmpeg: {}", e)),
        };
    }

    Err("Complex cut not yet implemented".to_string())
}

#[derive(Deserialize)]
struct CutSegment {
    keep_start: f64,
    keep_end: f64,
}

#[tauri::command]
async fn extract_audio(input_path: &str, output_path: &str, format: &str) -> Result<bool, String> {
    let status = Command::new("ffmpeg")
        .args(&[
            "-i", input_path,
            "-vn",
            "-acodec", "pcm_s16le",
            output_path,
            "-y",
        ])
        .status();

    match status {
        Ok(status) => {
            if status.success() {
                Ok(true)
            } else {
                Err("ffmpeg audio extraction failed".to_string())
            }
        }
        Err(e) => Err(format!("Failed to run ffmpeg: {}", e)),
    }
}

#[tauri::command]
async fn analyze_silence(file_path: &str, threshold_db: f64) -> Result<Vec<SilenceSegment>, String> {
    // Use ffmpeg to detect silence in audio
    // threshold_db: silence threshold in dB (e.g., -50 for silence)

    let output = Command::new("ffmpeg")
        .args(&[
            "-i", file_path,
            "-af", &format!("silencedetect=noise={}dB:d=0.5", threshold_db),
            "-f", "null",
            "-",
        ])
        .output();

    match output {
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let mut segments = Vec::new();

            // Parse silence_start and silence_end from output
            for line in stderr.lines() {
                if line.contains("silence_start:") {
                    if let Some(start) = line.split("silence_start: ").nth(1) {
                        if let Ok(s) = start.trim().parse::<f64>() {
                            // Find corresponding end
                            for end_line in stderr.lines() {
                                if end_line.contains("silence_end:") && end_line.contains(&format!("silence_start: {}", s)) == false {
                                    if let Some(end) = end_line.split("silence_end: ").nth(1) {
                                        if let Ok(e) = end.split_once(' ') {
                                            if let Ok(end_val) = e.0.trim().parse::<f64>() {
                                                segments.push(SilenceSegment {
                                                    start: s,
                                                    end: end_val,
                                                    duration: end_val - s,
                                                });
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Ok(segments)
        }
        Err(e) => Err(format!("Failed to analyze silence: {}", e)),
    }
}

#[derive(Serialize)]
struct SilenceSegment {
    start: f64,
    end: f64,
    duration: f64,
}

#[tauri::command]
async fn export_video(input_path: &str, output_path: &str, quality: &str) -> Result<bool, String> {
    let codec_args = match quality {
        "high" => vec!["-c:v", "libx264", "-crf", "18"],
        "medium" => vec!["-c:v", "libx264", "-crf", "23"],
        "low" => vec!["-c:v", "libx264", "-crf", "28"],
        _ => vec!["-c:v", "libx264", "-crf", "23"],
    };

    let status = Command::new("ffmpeg")
        .args(&[
            "-i", input_path,
        ].iter()
            .chain(codec_args.iter())
            .chain(&["-preset", "medium", output_path, "-y"])
            .cloned()
            .collect::<Vec<&str>>()
        )
        .status();

    match status {
        Ok(status) => {
            if status.success() {
                Ok(true)
            } else {
                Err("ffmpeg export failed".to_string())
            }
        }
        Err(e) => Err(format!("Failed to run ffmpeg: {}", e)),
    }
}

/// Whisper Transcription - Local AI (no cloud API)
/// Uses OpenAI's Whisper model installed locally

#[tauri::command]
async fn transcribe_audio(input_path: &str, model: &str) -> Result<TranscriptionResult, String> {
    // Extract audio to temp WAV file for Whisper
    let temp_wav = "/tmp/clipflow_audio.wav";
    
    // Extract audio using ffmpeg
    let extract_status = Command::new("ffmpeg")
        .args(&[
            "-i", input_path,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            temp_wav,
            "-y",
        ])
        .status();

    match extract_status {
        Ok(status) => {
            if !status.success() {
                return Err("Failed to extract audio for transcription".to_string());
            }
        }
        Err(e) => return Err(format!("Failed to run ffmpeg: {}", e)),
    }

    // Run Whisper transcription
    let output = Command::new("whisper")
        .args(&[
            temp_wav,
            "--model", model,
            "--output_format", "json",
            "--output_dir", "/tmp",
            "--language", "English",
        ])
        .output();

    match output {
        Ok(output) => {
            if output.status.success() {
                // Parse the JSON output
                let json_path = temp_wav.replace(".wav", ".json");
                match std::fs::read_to_string(&json_path) {
                    Ok(json_content) => {
                        match serde_json::from_str::<serde_json::Value>(&json_content) {
                            Ok(json) => {
                                let segments = json["segments"]
                                    .as_array()
                                    .unwrap_or(&vec![])
                                    .iter()
                                    .map(|seg| TranscriptionSegment {
                                        id: seg["id"].as_i64().unwrap_or(0) as usize,
                                        start: seg["start"].as_f64().unwrap_or(0.0),
                                        end: seg["end"].as_f64().unwrap_or(0.0),
                                        text: seg["text"].as_str().unwrap_or("").trim().to_string(),
                                    })
                                    .collect();

                                Ok(TranscriptionResult {
                                    text: json["text"].as_str().unwrap_or("").trim().to_string(),
                                    segments,
                                    language: json["language"].as_str().unwrap_or("en").to_string(),
                                    duration: json["duration"].as_f64().unwrap_or(0.0),
                                })
                            }
                            Err(_) => Err("Failed to parse Whisper output".to_string()),
                        }
                    }
                    Err(_) => Err("Failed to read Whisper output file".to_string()),
                }
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                Err(format!("Whisper failed: {}", error))
            }
        }
        Err(e) => Err(format!("Failed to run Whisper: {}", e)),
    }
}

#[tauri::command]
async fn get_available_whisper_models() -> Result<Vec<WhisperModel>, String> {
    // Return available Whisper models with their requirements
    Ok(vec![
        WhisperModel {
            name: "tiny".to_string(),
            size: "39 MB",
            vram: "~1 GB",
            description: "Fastest, lowest quality".to_string(),
        },
        WhisperModel {
            name: "base".to_string(),
            size: "74 MB",
            vram: "~1 GB",
            description: "Good balance of speed/quality".to_string(),
        },
        WhisperModel {
            name: "small".to_string(),
            size: "244 MB",
            vram: "~2 GB",
            description: "Better accuracy".to_string(),
        },
        WhisperModel {
            name: "medium".to_string(),
            size: "769 MB",
            vram: "~5 GB",
            description: "High accuracy, slower".to_string(),
        },
        WhisperModel {
            name: "large".to_string(),
            size: "1550 MB",
            vram: "~10 GB",
            description: "Highest accuracy, slowest".to_string(),
        },
    ])
}

#[derive(Serialize)]
struct TranscriptionResult {
    text: String,
    segments: Vec<TranscriptionSegment>,
    language: String,
    duration: f64,
}

#[derive(Serialize)]
struct TranscriptionSegment {
    id: usize,
    start: f64,
    end: f64,
    text: String,
}

#[derive(Serialize)]
struct WhisperModel {
    name: String,
    size: String,
    vram: String,
    description: String,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_video_duration,
            trim_video,
            cut_video_remove,
            extract_audio,
            analyze_silence,
            export_video,
            transcribe_audio,
            get_available_whisper_models
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
