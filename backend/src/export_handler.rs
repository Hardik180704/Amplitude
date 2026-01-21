use axum::{
    Json, extract::State,
};
use std::sync::Arc;
use shared::Project;
use audio_engine::{mixer::Mixer, export::AudioExporter};
use crate::ws::AppState;
use std::fs;

pub async fn export_project(
    State(state): State<Arc<AppState>>,
) -> Json<String> {
    println!("Starting Export...");
    
    // 1. Get Project State
    let project_guard = state.project.read().await;
    let project_clone = project_guard.clone(); 
    drop(project_guard); // Drop lock early

    // 2. Setup Mixer (Headless)
    let mut mixer = Mixer::new();
    // TODO: hydrate mixer from project_clone (tracks, clips, etc.)
    // For now, we might need a method "Mixer::from_project(&Project)"
    
    // 3. Render
    let duration_sec = 10; // TODO: Calculate from project length
    let sample_rate = 44100;
    let duration_samples = duration_sec * sample_rate;
    
    let buffer = AudioExporter::render(&mut mixer, duration_samples as u64);

    // 4. Write WAV
    fs::create_dir_all("exports").unwrap();
    let filename = format!("exports/{}_{}.wav", project_clone.name, chrono::Utc::now().timestamp());
    
    let spec = hound::WavSpec {
        channels: 2,
        sample_rate: sample_rate as u32,
        bits_per_sample: 32,
        sample_format: hound::SampleFormat::Float,
    };
    
    let mut writer = hound::WavWriter::create(&filename, spec).unwrap();
    for sample in buffer {
        writer.write_sample(sample).unwrap();
    }
    writer.finalize().unwrap();

    println!("Export saved to {}", filename);
    Json(filename)
}
