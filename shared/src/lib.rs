use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub enum MixerCommand {
    SetTrackGain { track_id: u32, gain: f32 },
    SetTrackPan { track_id: u32, pan: f32 },
    SetTrackMute { track_id: u32, muted: bool },
    SetTrackSolo { track_id: u32, soloed: bool },
    AddTrack,
    DeleteTrack { track_id: u32 },
    Play,
    Stop,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AudioCommand {
    pub timestamp: u64, // When to apply (0 = immediate)
    pub command: MixerCommand,
}
