use crate::graph::AudioNode;
use crate::synth::granular::GranularSynth;

pub struct GranularNode {
    engine: GranularSynth,
}

impl GranularNode {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            engine: GranularSynth::new(sample_rate, 64),
        }
    }
    
    pub fn set_buffer(&mut self, buffer: Vec<f32>) {
        self.engine.set_buffer(buffer);
    }
    
    pub fn set_params(&mut self, density: f32, size_ms: f32, spray_ms: f32, pos: f64) {
        self.engine.density = density;
        self.engine.size_ms = size_ms;
        self.engine.spray_ms = spray_ms;
        self.engine.playback_pos = pos;
    }
}

impl AudioNode for GranularNode {
    fn process(&mut self, _inputs: &[&[f32]], outputs: &mut [&mut [f32]]) -> bool {
        let (left, right) = outputs.split_at_mut(1);
        let out_l = &mut left[0];
        let out_r = &mut right[0];
        
        for i in 0..out_l.len() {
            let (l, r) = self.engine.process();
            out_l[i] = l;
            out_r[i] = r;
        }
        
        true
    }
}
