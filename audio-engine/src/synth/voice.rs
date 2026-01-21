use crate::dsp::envelope::AdsrEnvelope;
use crate::dsp::filter::{Biquad, FilterType};
use crate::dsp::DspProcessor;
use crate::midi::note_to_freq;
use std::f32::consts::PI;

pub struct SynthVoice {
    pub osc_phase: f32,
    pub osc_freq: f32,
    pub sample_rate: f32,
    
    pub amp_env: AdsrEnvelope,
    pub filter_env: AdsrEnvelope,
    pub filter: Biquad,
    
    // Params
    pub filter_cutoff: f32,
    pub filter_res: f32,
    pub filter_env_amt: f32,
    
    pub note: u8,
    pub velocity: u8,
    pub active: bool,
}

impl SynthVoice {
    pub fn new(sample_rate: f32) -> Self {
        let mut filter = Biquad::new(FilterType::LowPass, 2000.0, 0.707, sample_rate);
        Self {
            osc_phase: 0.0,
            osc_freq: 440.0,
            sample_rate,
            amp_env: AdsrEnvelope::new(sample_rate),
            filter_env: AdsrEnvelope::new(sample_rate),
            filter,
            
            filter_cutoff: 2000.0,
            filter_res: 1.0,
            filter_env_amt: 3000.0, // Envelope adds up to 3000Hz to cutoff
            
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
        self.filter_env.trigger();
        self.filter.reset();
        
        self.active = true;
    }
    
    pub fn note_off(&mut self) {
        self.amp_env.release();
        self.filter_env.release();
    }
    
    pub fn process(&mut self) -> f32 {
        if !self.active { return 0.0; }
        
        let amp_level = self.amp_env.process();
        let filt_level = self.filter_env.process();
        
        if !self.amp_env.is_active() {
            self.active = false;
            return 0.0;
        }
        
        // Modulate Filter
        let cutoff = (self.filter_cutoff + filt_level * self.filter_env_amt).clamp(20.0, 20000.0);
        self.filter.set_params(cutoff, self.filter_res, 0.0);
        
        // Simple Sawtooth
        let osc_out = 2.0 * (self.osc_phase - 0.5); 
        
        // Advance phase
        self.osc_phase += self.osc_freq / self.sample_rate;
        if self.osc_phase >= 1.0 {
            self.osc_phase -= 1.0;
        }
        
        // Filter
        let filtered = self.filter.process_sample(osc_out);
        
        // Velocity processing (linear for now)
        let vel_gain = self.velocity as f32 / 127.0;
        
        filtered * amp_level * vel_gain
    }
}
