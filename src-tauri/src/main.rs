#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use serde::Serialize;
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to ClipFlow.", name)
}

#[tauri::command]
async fn get_video_duration(file_path: &str) -> Result<f64, String> {
    // Use ffprobe to get video duration
    let output = Command::new("ffprobe")
        .args(&[
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
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
async fn analyze_silence(file_path: &str, threshold: f64) -> Result<Vec<SilenceSegment>, String> {
    // This would analyze audio for silence
    // For now, return an empty result
    Ok(vec![])
}

#[derive(Serialize)]
struct SilenceSegment {
    start: f64,
    end: f64,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_shell::init())
        .invoke_handler(tauri::generate_handler![greet, get_video_duration, analyze_silence])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
