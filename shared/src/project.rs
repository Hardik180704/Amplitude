use serde::{Deserialize, Serialize};


#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Project {
    pub name: String,
    pub tempo: f32,
    pub tracks: Vec<TrackData>,
}

impl Project {
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            tempo: 120.0,
            tracks: Vec::new(),
        }
    }

    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self)
    }

    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }
}

impl Default for Project {
    fn default() -> Self {
        Self::new("New Project")
    }
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
