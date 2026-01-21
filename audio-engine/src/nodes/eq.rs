use crate::graph::AudioNode;
use crate::dsp::filter::{Biquad, FilterType};
use crate::dsp::DspProcessor;

pub struct EqNode {
    // Stereo filters for 3 bands
    low_l: Biquad, low_r: Biquad,
    mid_l: Biquad, mid_r: Biquad,
    high_l: Biquad, high_r: Biquad,
}

impl EqNode {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            low_l: Biquad::new(FilterType::LowShelf, 100.0, 0.707, sample_rate),
            low_r: Biquad::new(FilterType::LowShelf, 100.0, 0.707, sample_rate),
            
            mid_l: Biquad::new(FilterType::Peaking, 1000.0, 1.0, sample_rate),
            mid_r: Biquad::new(FilterType::Peaking, 1000.0, 1.0, sample_rate),
            
            high_l: Biquad::new(FilterType::HighShelf, 5000.0, 0.707, sample_rate),
            high_r: Biquad::new(FilterType::HighShelf, 5000.0, 0.707, sample_rate),
        }
    }
    
    pub fn set_gains(&mut self, low_db: f32, mid_db: f32, high_db: f32) {
        // Update all params (simplified: fixed freq/Q for now)
        // In real app, freq/Q would be params too.
        self.low_l.set_params(100.0, 0.707, low_db);
        self.low_r.set_params(100.0, 0.707, low_db);
        
        self.mid_l.set_params(1000.0, 1.0, mid_db);
        self.mid_r.set_params(1000.0, 1.0, mid_db);
        
        self.high_l.set_params(5000.0, 0.707, high_db);
        self.high_r.set_params(5000.0, 0.707, high_db);
    }
}

impl AudioNode for EqNode {
    fn process(&mut self, inputs: &[&[f32]], outputs: &mut [&mut [f32]]) -> bool {
        // Assumes stereo input/output
        if inputs.is_empty() { return false; }
        
        let in_l = inputs[0];
        let in_r = inputs.get(1).unwrap_or(&inputs[0]); // Mono -> Stereo fallback
        
        let out_l = &mut outputs[0];
        let out_r = &mut outputs[1];
        
        for i in 0..out_l.len() {
            // Cascade: Low -> Mid -> High
            let mut l = self.low_l.process_sample(in_l[i]);
            l = self.mid_l.process_sample(l);
            l = self.high_l.process_sample(l);
            out_l[i] = l;
            
            let mut r = self.low_r.process_sample(in_r[i]);
            r = self.mid_r.process_sample(r);
            r = self.high_r.process_sample(r);
            out_r[i] = r;
        }
        
        true
    }
}
