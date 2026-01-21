use crate::synth::oscillator::Oscillator;
use crate::synth::envelope::AdsrEnvelope;
use crate::synth::filter::SvfFilter;
use crate::midi::note_to_freq;

pub struct SynthVoice {
    pub osc1: Oscillator,
    pub osc2: Oscillator,
    pub env: AdsrEnvelope,
    pub filter: SvfFilter,
    
    pub active: bool, 
    pub note: u8,
    pub velocity: f32,
}

impl SynthVoice {
    pub fn new(sample_rate: f32) -> Self {
        let mut filter = SvfFilter::new(sample_rate);
        filter.set(2000.0, 0.7); // Default LowPass
        
        Self {
            osc1: Oscillator::new(sample_rate),
            osc2: Oscillator::new(sample_rate),
            env: AdsrEnvelope::new(sample_rate),
            filter,
            active: false,
            note: 0,
            velocity: 0.0,
        }
    }
    
    pub fn note_on(&mut self, note: u8, velocity: u8) {
        self.note = note;
        self.velocity = velocity as f32 / 127.0;
        self.active = true;
        
        let freq = note_to_freq(note);
        self.osc1.set_frequency(freq);
        self.osc2.set_frequency(freq * 1.01); // Detune
        
        self.env.gate(true);
    }
    
    pub fn note_off(&mut self) {
        self.env.gate(false);
    }
    
    pub fn process(&mut self) -> f32 {
        if !self.active { return 0.0; }
        
        let osc_mix = (self.osc1.process() + self.osc2.process()) * 0.5;
        let env_val = self.env.process();
        
        // Simple Filter Modulation
        // self.filter.set(200.0 + 5000.0 * env_val, 0.7);
        let filtered = self.filter.process(osc_mix);
        
        let out = filtered * env_val * self.velocity;
        
        if !self.env.is_active() {
            self.active = false;
        }
        
        out
    }
}
