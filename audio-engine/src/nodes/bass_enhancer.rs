use crate::graph::AudioNode;
use crate::dsp::filter::{Biquad, FilterType};
use crate::dsp::DspProcessor;

pub struct BassEnhancerNode {
    filter_l: Biquad,
    filter_r: Biquad,
    drive: f32, // 0-1
    width: f32, // 0-1 (0=mono, 1=stereo)
}

impl BassEnhancerNode {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            filter_l: Biquad::new(FilterType::LowShelf, 100.0, 0.707, sample_rate),
            filter_r: Biquad::new(FilterType::LowShelf, 100.0, 0.707, sample_rate),
            drive: 0.0,
            width: 1.0,
        }
    }
    
    pub fn set_params(&mut self, boost: f32, cutoff: f32, drive: f32, width: f32) {
        // Boost is in dB.
        self.filter_l.set_params(cutoff, 1.2, boost);
        self.filter_r.set_params(cutoff, 1.2, boost);
        self.drive = drive / 100.0; // Map 0-100 to 0-1
        self.width = width;
    }
}

impl AudioNode for BassEnhancerNode {
    fn process(&mut self, inputs: &[&[f32]], outputs: &mut [&mut [f32]]) -> bool {
        // 1. Process Filter (Boost)
        if inputs.is_empty() {
             // In-place
             let (l, r) = outputs.split_at_mut(1);
             let out_l = &mut l[0];
             let out_r = &mut r[0];
             
             for i in 0..out_l.len() {
                 out_l[i] = self.filter_l.process_sample(out_l[i]);
                 out_r[i] = self.filter_r.process_sample(out_r[i]);
             }
        } else {
             // Input -> Output
             let in_l = inputs[0];
             let in_r = inputs.get(1).unwrap_or(&inputs[0]);
             
             let (l, r) = outputs.split_at_mut(1);
             let out_l = &mut l[0];
             let out_r = &mut r[0];
             
             for i in 0..out_l.len() {
                 out_l[i] = self.filter_l.process_sample(in_l[i]);
                 out_r[i] = self.filter_r.process_sample(in_r[i]);
             }
        }
        
        // 2. Apply Drive & Width
        let (l_ch, r_ch) = outputs.split_at_mut(1);
        let out_l = &mut l_ch[0];
        let out_r = &mut r_ch[0];
        
        for i in 0..out_l.len() {
            let mut l = out_l[i];
            let mut r = out_r[i];
            
            // Drive (Soft Clip Saturation)
            if self.drive > 0.01 {
                let drive_gain = 1.0 + self.drive * 4.0;
                l = (l * drive_gain).tanh();
                r = (r * drive_gain).tanh();
                // Optional: Makeup gain compensation? 
                // Let's leave it loud for "Boost" effect.
            }
            
            // Width (Mid/Side)
            if self.width < 0.99 {
                let mid = (l + r) * 0.5;
                let side = (l - r) * 0.5;
                let side_processed = side * self.width;
                l = mid + side_processed;
                r = mid - side_processed;
            }
            
            out_l[i] = l;
            out_r[i] = r;
        }

        true
    }
}
