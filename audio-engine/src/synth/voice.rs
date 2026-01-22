use crate::synth::lfo::Lfo;
use crate::modulation::{ModulationMatrix, ModTarget, ModSource};
use crate::synth::oscillator::Oscillator;
use crate::synth::envelope::AdsrEnvelope;
use crate::synth::filter::SvfFilter;
use crate::midi::note_to_freq;

pub struct SynthVoice {
    pub osc1: Oscillator,
    pub osc2: Oscillator,
    pub env: AdsrEnvelope,
    pub filter: SvfFilter,
    pub lfo: Lfo,
    
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
            lfo: Lfo::new(sample_rate),
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
        // Reset LFO phase on note on? Usually configurable. For now yes.
        self.lfo.phase = 0.0; 
    }
    
    pub fn note_off(&mut self) {
        self.env.gate(false);
    }
    
    pub fn process(&mut self, matrix: &ModulationMatrix) -> f32 {
        if !self.active { return 0.0; }
        
        // 1. Sources
        let env_val = self.env.process();
        let lfo_val = self.lfo.process();
        
        // 2. Modulations
        // Cutoff
        let mod_cutoff = matrix.get_modulation_value(
            &ModTarget::FilterCutoff, 
            &[lfo_val], 
            &[env_val], 
            (self.velocity, self.note as f32 / 127.0)
        );
        
        // Apply Modulation (Base + Amount)
        // Base is currently hardcoded 2000.0. Ideally "Base" is a parameter.
        // For Filter, modulation is usually exponential (pitch/cutoff).
        // 20Hz * 2^(10 * mod) -> 20 to 20k
        // Let's assume mod_cutoff is -1 to 1.
        let base_cutoff = 2000.0;
        let final_cutoff = base_cutoff * 2.0_f32.powf(mod_cutoff * 5.0); // +/- 5 octaves
        self.filter.set(final_cutoff.clamp(20.0, 20000.0), 0.7);

        
        let osc_mix = (self.osc1.process() + self.osc2.process()) * 0.5;
        let filtered = self.filter.process(osc_mix);
        
        let out = filtered * env_val * self.velocity;
        
        if !self.env.is_active() {
            self.active = false;
        }
        
        out
    }
}
