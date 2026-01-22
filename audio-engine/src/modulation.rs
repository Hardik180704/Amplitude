use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum ModSource {
    Lfo(usize),
    Envelope(usize),
    Velocity,
    KeyTrack,
    Macro(usize),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum ModTarget {
    FilterCutoff,
    FilterResonance,
    OscPitch(usize),
    OscWave(usize),
    Gain,
    Pan,
    // Add more as needed
}

// A single connection
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModConnection {
    pub source: ModSource,
    pub target: ModTarget,
    pub amount: f32, // -1.0 to 1.0 (bipolar)
}

pub struct ModulationMatrix {
    pub connections: Vec<ModConnection>,
}

impl ModulationMatrix {
    pub fn new() -> Self {
        Self {
            connections: Vec::new(),
        }
    }

    pub fn add_connection(&mut self, source: ModSource, target: ModTarget, amount: f32) {
        self.connections.push(ModConnection { source, target, amount });
    }
    
    // Compute total modulation for a specific target
    // We pass in arrays of source values
    pub fn get_modulation_value(
        &self, 
        target_check: &ModTarget, 
        lfo_values: &[f32], 
        env_values: &[f32],
        note_values: (f32, f32) // velocity, key (0-1)
    ) -> f32 {
        let mut total = 0.0;
        
        for conn in &self.connections {
            // Helper to check enum equality without values? 
            // Or just check matching variant. 
            // Since targets might have indices (OscPitch(0)), we need exact match logic or partial?
            // Let's use std::mem::discriminant if we didn't have data, but we have data.
            // Simple match:
            let matches = match (&conn.target, target_check) {
                (ModTarget::FilterCutoff, ModTarget::FilterCutoff) => true,
                (ModTarget::FilterResonance, ModTarget::FilterResonance) => true,
                (ModTarget::Gain, ModTarget::Gain) => true,
                (ModTarget::Pan, ModTarget::Pan) => true,
                (ModTarget::OscPitch(i), ModTarget::OscPitch(j)) => i == j,
                (ModTarget::OscWave(i), ModTarget::OscWave(j)) => i == j,
                _ => false,
            };
            
            if matches {
                let src_val = match conn.source {
                    ModSource::Lfo(i) => lfo_values.get(i).cloned().unwrap_or(0.0),
                    ModSource::Envelope(i) => env_values.get(i).cloned().unwrap_or(0.0),
                    ModSource::Velocity => note_values.0,
                    ModSource::KeyTrack => note_values.1,
                    ModSource::Macro(_) => 0.0, // TODO
                };
                
                total += src_val * conn.amount;
            }
        }
        
        total
    }
}
