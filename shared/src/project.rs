use serde::{Deserialize, Serialize};
use crate::midi::MidiClip; // We need to move MidiClip to shared or make a shared version

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Project {
    pub name: String,
    pub tempo: f32,
    pub tracks: Vec<TrackData>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TrackData {
    pub id: u32,
    pub name: String,
    pub gain_db: f32,
    pub pan: f32,
    pub muted: bool,
    pub soloed: bool,
    pub clips: Vec<ClipData>,
    pub effects: Vec<EffectData>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum ClipData {
    Audio {
        start: u64,
        duration: u64,
        offset: u64,
        asset_id: String,
    },
    Midi {
        start: u64,
        duration: u64,
        notes: Vec<MidiNoteData>,
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MidiNoteData {
    pub start: u64,
    pub duration: u64,
    pub note: u8,
    pub velocity: u8,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct EffectData {
    pub effect_type: String, // "EQ", "DELAY", "COMP"
    pub params: Vec<f32>,
}
