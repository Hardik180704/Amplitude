use crate::graph::AudioNode;
use crate::dsp::delay::DelayLine;

pub struct DelayNode {
    delay_line_l: DelayLine,
    delay_line_r: DelayLine,
    
    // Params
    pub delay_ms: f32,
    pub feedback: f32,
    pub mix: f32,
    
    sample_rate: f32,
}

impl DelayNode {
    pub fn new(max_delay_ms: f32, sample_rate: f32) -> Self {
        let max_samples = (max_delay_ms / 1000.0 * sample_rate) as usize;
        Self {
            delay_line_l: DelayLine::new(max_samples),
            delay_line_r: DelayLine::new(max_samples),
            delay_ms: 300.0, // Default 300ms
            feedback: 0.4,
            mix: 0.5,
            sample_rate,
        }
    }
}

impl AudioNode for DelayNode {
    fn process(&mut self, inputs: &[&[f32]], outputs: &mut [&mut [f32]]) -> bool {
        if inputs.is_empty() { return false; }
        
        let in_l = inputs[0];
        let in_r = inputs.get(1).unwrap_or(&inputs[0]); // Mono fallback
        
        // Ensure stereo output
        if outputs.len() < 2 { return false; }
        let (out_l_slice, rest) = outputs.split_at_mut(1);
        let out_l = &mut out_l_slice[0];
        let out_r = &mut rest[0];
        
        let delay_samples = self.delay_ms / 1000.0 * self.sample_rate;
        
        for i in 0..out_l.len() {
            let dry_l = in_l[i];
            let dry_r = in_r[i];
            
            // Read from delay
            let wet_l = self.delay_line_l.read(delay_samples);
            let wet_r = self.delay_line_r.read(delay_samples);
            
            // Feed back
            self.delay_line_l.write(dry_l + wet_l * self.feedback);
            self.delay_line_r.write(dry_r + wet_r * self.feedback);
            
            // Mix
            out_l[i] = dry_l * (1.0 - self.mix) + wet_l * self.mix;
            out_r[i] = dry_r * (1.0 - self.mix) + wet_r * self.mix;
        }
        
        true
    }
}
