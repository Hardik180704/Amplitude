mod project;
pub use project::*;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type", content = "payload")]
pub enum Action {
    // Project State
    UpdateTrack(TrackData),
    AddClip { track_id: usize, clip: ClipData },
    MoveClip { clip_id: usize, new_start: u64, track_id: usize },
    
    // Effects
    AddEffect { track_id: usize, effect: Effect },
    RemoveEffect { track_id: usize, index: usize },
    UpdateEffect { track_id: usize, index: usize, effect: Effect },
    
    // Transport
    Play,
    Stop,
    Seek(f64), // Seconds
}

#[derive(Serialize, Deserialize, Debug)]
pub enum MixerCommand {
    SetTrackGain { track_id: u32, gain: f32 },
    SetTrackPan { track_id: u32, pan: f32 },
    SetTrackMute { track_id: u32, muted: bool },
    SetTrackSolo { track_id: u32, soloed: bool },
    AddTrack,
    DeleteTrack { track_id: u32 },
    
    // Effect Commands
    AddEffect { track_id: u32, effect_type: String }, // "EQ", "DELAY", "COMP"
    SetEffectParam { track_id: u32, effect_index: usize, param_id: u32, value: f32 },
    
    // MIDI Commands
    NoteOn { track_id: u32, note: u8, velocity: u8 },
    NoteOff { track_id: u32, note: u8 },
    
    // Project Commands
    LoadProject { project: Project },
    RequestProjectState,
    
    Play,
    Stop,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AudioCommand {
    pub timestamp: u64, // When to apply (0 = immediate)
    pub command: MixerCommand,
}

// Data layout for shared memory metering (WASM -> UI)
// We use u32 to store f32 bits atomically
#[repr(C)]
pub struct MeterData {
    pub left_peak: std::sync::atomic::AtomicU32,
    pub right_peak: std::sync::atomic::AtomicU32,
    pub playhead_pos: std::sync::atomic::AtomicU32,
}

pub fn db_to_linear(db: f32) -> f32 {
    10.0f32.powf(db / 20.0)
}

pub fn linear_to_db(linear: f32) -> f32 {
    if linear <= 1e-9 {
        -180.0
    } else {
        20.0 * linear.log10()
    }
}

// Simple SPSC Ring Buffer stub for now. 
// In a real SPSC, we need AtomicUsize for head/tail and UnsafeCell/Arc for buffer.
// Assuming single-threaded access for "Headless" mode, but we need it for WASM too.
pub struct SharedRingBuffer {
    // Placeholder
}

impl SharedRingBuffer {
    pub fn new(_capacity: usize) -> Self {
        Self {}
    }
}
