
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum MidiEventType {
    NoteOn,
    NoteOff,
    ControlChange,
    PitchBend,
}

#[derive(Debug, Clone, Copy)]
pub struct MidiEvent {
    pub event_type: MidiEventType,
    pub channel: u8,      // 0-15
    pub note: u8,         // 0-127
    pub velocity: u8,     // 0-127
    pub timestamp: u64,   // Sample offset within block
}

impl MidiEvent {
    pub fn note_on(channel: u8, note: u8, velocity: u8, timestamp: u64) -> Self {
        Self {
            event_type: MidiEventType::NoteOn,
            channel,
            note,
            velocity,
            timestamp,
        }
    }

    pub fn note_off(channel: u8, note: u8, timestamp: u64) -> Self {
        Self {
            event_type: MidiEventType::NoteOff,
            channel,
            note,
            velocity: 0,
            timestamp,
        }
    }
}

// Utilities
pub fn note_to_freq(note: u8) -> f32 {
    440.0 * 2.0f32.powf((note as f32 - 69.0) / 12.0)
}
