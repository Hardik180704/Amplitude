use crate::dsp::envelope::AdsrEnvelope;
use crate::midi::note_to_freq;
use std::f32::consts::PI;

pub struct SynthVoice {
    pub osc_phase: f32,
    pub osc_freq: f32,
    pub sample_rate: f32,
    
    pub amp_env: AdsrEnvelope,
    
    pub note: u8,
    pub velocity: u8,
    pub active: bool,
}

impl SynthVoice {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            osc_phase: 0.0,
            osc_freq: 440.0,
            sample_rate,
            amp_env: AdsrEnvelope::new(sample_rate),
            note: 0,
            velocity: 0,
            active: false,
        }
    }
    
    pub fn note_on(&mut self, note: u8, velocity: u8) {
        self.note = note;
        self.velocity = velocity;
        self.osc_freq = note_to_freq(note);
        self.amp_env.trigger();
        self.active = true;
    }
    
    pub fn note_off(&mut self) {
        self.amp_env.release();
    }
    
    pub fn process(&mut self) -> f32 {
        if !self.active { return 0.0; }
        
        let env_level = self.amp_env.process();
        
        if !self.amp_env.is_active() {
            self.active = false;
            return 0.0;
        }
        
        // Simple Sawtooth
        let sample = 2.0 * (self.osc_phase - 0.5); 
        
        // Advance phase
        self.osc_phase += self.osc_freq / self.sample_rate;
        if self.osc_phase >= 1.0 {
            self.osc_phase -= 1.0;
        }
        
        // Velocity processing (linear for now)
        let vel_gain = self.velocity as f32 / 127.0;
        
        sample * env_level * vel_gain
    }
}
