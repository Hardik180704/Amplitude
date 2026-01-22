use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
};
use axum::extract::State;
use std::sync::Arc;
use tokio::sync::broadcast;
use futures::{sink::SinkExt, stream::StreamExt};

use shared::Project;
use tokio::sync::RwLock;

// Shared state
pub struct AppState {
    pub tx: broadcast::Sender<String>,
    pub project: Arc<RwLock<Project>>,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let mut rx = state.tx.subscribe();

    println!("Websocket Connected");

    // Split socket into sender and receiver
    let (mut sender, mut receiver) = socket.split();

    // 1. Send Initial State
    {
        let project = state.project.read().await;
        if let Ok(json) = serde_json::to_string(&*project) {
             // Create a custom Init message structure or reuse Action?
             // Let's use a specific wrapper for now matching Frontend expectation
             let msg = format!("{{ \"type\": \"Init\", \"payload\": {} }}", json);
             if let Err(e) = sender.send(Message::Text(msg)).await {
                 println!("Failed to send init state: {}", e);
                 return;
             }
        }
    }

    // 2. Spawn Send Task (Broadcasts)
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

use shared::Action;

// ...

    // Task to receive messages from this client and broadcast
    let tx = state.tx.clone();
    let project_ref = state.project.clone();
    
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Message::Text(text) = msg {
                // Parse Action
                if let Ok(action) = serde_json::from_str::<Action>(&text) {
                    println!("Applying Action: {:?}", action);
                    
                    // Mutate State
                    {
                        let mut project = project_ref.write().await;
                        match &action {
                            Action::Play => { /* Handle Play */ },
                            Action::Stop => { /* Handle Stop */ },
                            Action::AddClip { track_id, clip } => {
                                if let Some(track) = project.tracks.iter_mut().find(|t| t.id == *track_id as u32) {
                                    track.clips.push(clip.clone());
                                }
                            },
                             Action::MoveClip { clip_id: _, new_start: _, track_id: _ } => {
                                // Find clip and move it (Simplified logic)
                                for track in &mut project.tracks {
                                    if let Some(_pos) = track.clips.iter().position(|c| 
                                        match c { shared::ClipData::Audio { .. } => true, _ => false } // Todo: check ID
                                    ) {
                                         // Update clip start
                                    }
                                }
                            },
                            _ => {}
                        }
                    }

                    // Broadcast Action
                    let _ = tx.send(text);
                } else {
                    println!("Invalid Action JSON: {}", text);
                }
            }
        }
    });


    // If any one of the tasks exit, abort the other.
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };

    println!("Websocket Disconnected");
}
