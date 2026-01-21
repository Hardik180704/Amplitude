use axum::{
    routing::get,
    Json, Router, extract::Query,
};
use serde::Deserialize;
use std::fs;
use shared::Project;

mod ws;

use std::sync::Arc;
use tokio::sync::broadcast;
// RwLock is used inside ws::AppState, but we invoke new here

mod export_handler;

#[tokio::main]
async fn main() {
    // 1. Create Shared State
    let (tx, _rx) = broadcast::channel(100);
    let project = Arc::new(tokio::sync::RwLock::new(Project::default()));
    
    let app_state = Arc::new(ws::AppState { tx, project });

    let app = Router::new()
        .route("/", get(root))
        .route("/api/projects", get(list_projects).post(save_project))
        .route("/api/projects/load", get(load_project))
        .route("/api/export", axum::routing::post(export_handler::export_project))
        // WS Route
        .route("/ws", get(ws::ws_handler))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Backend listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
    "Amplitude Backend Running"
}

// Handler to list projects
async fn list_projects() -> Json<Vec<String>> {
    let projects_dir = "./projects";
    fs::create_dir_all(projects_dir).unwrap();
    
    let mut projects = Vec::new();
    if let Ok(entries) = fs::read_dir(projects_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                if let Some(name) = entry.file_name().to_str() {
                    if name.ends_with(".json") {
                        projects.push(name.trim_end_matches(".json").to_string());
                    }
                }
            }
        }
    }
    Json(projects)
}

// Handler to save project
async fn save_project(Json(project): Json<Project>) -> &'static str {
    let projects_dir = "./projects";
    fs::create_dir_all(projects_dir).unwrap();
    
    let filename = format!("{}/{}.json", projects_dir, project.name);
    let json = serde_json::to_string_pretty(&project).unwrap();
    
    match fs::write(filename, json) {
        Ok(_) => "Project Saved",
        Err(_) => "Error Saving Project",
    }
}

// Handler to load project
#[derive(Deserialize)]
struct LoadParams {
    name: String,
}

async fn load_project(Query(params): Query<LoadParams>) -> Json<Option<Project>> {
    let filename = format!("./projects/{}.json", params.name);
    if let Ok(content) = fs::read_to_string(filename) {
        if let Ok(project) = serde_json::from_str(&content) {
            return Json(Some(project));
        }
    }
    Json(None)
}
