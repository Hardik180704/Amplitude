use crate::midi::MidiEvent;

// Simple structure to track the state of a voice
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum VoiceState {
    Idle,
    Active { note: u8, velocity: u8, age: u64 },
    Releasing { note: u8 }, // For ADSR tail
}

pub struct VoiceAllocator {
    pub num_voices: usize,
    pub voices: Vec<VoiceState>,
    last_age: u64,
}

impl VoiceAllocator {
    pub fn new(num_voices: usize) -> Self {
        Self {
            num_voices,
            voices: vec![VoiceState::Idle; num_voices],
            last_age: 0,
        }
    }

    // Called every block
    pub fn tick(&mut self) {
        self.last_age += 1;
    }

    // Returns index of voice to use, or None if handled internally (e.g. retrigger)
    pub fn note_on(&mut self, note: u8, velocity: u8) -> usize {
        // 1. Check if note is already playing (Retrigger or steal same note)
        for (i, state) in self.voices.iter_mut().enumerate() {
            if let VoiceState::Active { note: n, .. } = state {
                if *n == note {
                    *state = VoiceState::Active { note, velocity, age: self.last_age };
                    return i;
                }
            }
            if let VoiceState::Releasing { note: n } = state {
                 if *n == note {
                    *state = VoiceState::Active { note, velocity, age: self.last_age };
                    return i;
                }
            }
        }

        // 2. Find free voice
        for (i, state) in self.voices.iter_mut().enumerate() {
            if *state == VoiceState::Idle {
                *state = VoiceState::Active { note, velocity, age: self.last_age };
                return i;
            }
        }

        // 3. Steal oldest voice (Naive LRU)
        let mut oldest_age = u64::MAX;
        let mut victim_idx = 0;

        for (i, state) in self.voices.iter().enumerate() {
            if let VoiceState::Active { age, .. } = state {
                if *age < oldest_age {
                    oldest_age = *age;
                    victim_idx = i;
                }
            }
        }
        
        // Steal it
        self.voices[victim_idx] = VoiceState::Active { note, velocity, age: self.last_age };
        victim_idx
    }

    pub fn note_off(&mut self, note: u8) -> Option<usize> {
        for (i, state) in self.voices.iter_mut().enumerate() {
            match state {
                VoiceState::Active { note: n, .. } if *n == note => {
                    *state = VoiceState::Releasing { note };
                    return Some(i);
                },
                _ => {}
            }
        }
        None
    }
    
    // Called by the voice itself when envelope finishes
    pub fn voice_finished(&mut self, voice_index: usize) {
        if voice_index < self.num_voices {
            self.voices[voice_index] = VoiceState::Idle;
        }
    }
}
