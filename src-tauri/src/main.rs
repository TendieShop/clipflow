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
            export_video
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
