#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to ClipFlow.", name)
}

#[tauri::command]
fn get_video_duration(file_path: &str) -> Result<f64, String> {
    // This would use FFmpeg to get video duration
    // For now, return a placeholder
    Ok(0.0)
}

#[tauri::command]
fn analyze_silence(file_path: &str, threshold: f64) -> Result<Vec<SilenceSegment>, String> {
    // This would analyze audio for silence
    Ok(vec![])
}

#[derive(serde::Serialize)]
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
