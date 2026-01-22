use crate::graph::AudioNode;
use crate::synth::wavetable::WavetableOscillator;

pub struct WavetableNode {
    osc: WavetableOscillator,
}

impl WavetableNode {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            osc: WavetableOscillator::new(sample_rate),
        }
    }
    
    pub fn set_params(&mut self, freq: f32, morph: f32) {
        self.osc.freq = freq;
        self.osc.morph = morph;
    }
}

impl AudioNode for WavetableNode {
    fn process(&mut self, _inputs: &[&[f32]], outputs: &mut [&mut [f32]]) -> bool {
        let (left, right) = outputs.split_at_mut(1);
        let out_l = &mut left[0];
        let out_r = &mut right[0];
        
        for i in 0..out_l.len() {
            let val = self.osc.process();
            // Mono to Stereo
            out_l[i] = val * 0.5;
            out_r[i] = val * 0.5;
        }
        
        true
    }
}
