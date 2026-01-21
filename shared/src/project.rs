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
    pub effects: Vec<Effect>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type", rename_all = "lowercase")] // Flattened structure with 'type' discriminator
pub enum ClipData {
    Audio {
        id: u64,
        name: String,
        start: u64,
        duration: u64,
        offset: u64,
        asset_id: String,
        #[serde(default)]
        muted: bool,
        #[serde(default)]
        gain_db: f32,
    },
    Midi {
        id: u64,
        name: String,
        start: u64,
        duration: u64,
        notes: Vec<MidiNoteData>,
        #[serde(default)]
        muted: bool,
        #[serde(default)]
        gain_db: f32,
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
#[serde(tag = "type", content = "payload")]
pub enum Effect {
    Eq {
        low_gain: f32,
        mid_gain: f32,
        high_gain: f32,
    },
    Compressor {
        threshold: f32,
        ratio: f32,
        attack: f32,
        release: f32,
        makeup_gain: f32,
    },
    Delay {
        time_ms: f32,
        feedback: f32,
        mix: f32,
    },
    Reverb {
        mix: f32,
        decay: f32,
    }
}
