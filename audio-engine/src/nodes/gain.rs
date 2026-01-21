use crate::graph::AudioNode;

pub struct GainNode {
    gain: f32,
}

impl GainNode {
    pub fn new(gain: f32) -> Self {
        Self { gain }
    }
    
    pub fn set_gain(&mut self, gain: f32) {
        self.gain = gain;
    }
}

impl AudioNode for GainNode {
    fn process(&mut self, inputs: &[&[f32]], outputs: &mut [&mut [f32]]) -> bool {
        // Simple stereo gain
        // Assume inputs[0] is stereo input (interleaved or planar? Let's stick to planar for now as per web audio usually)
        // Actually, for simplicity Phase 1, let's assume inputs are channel slices.
        // But the trait signature `inputs: &[&[f32]]` implies a list of buffers.
        
        // If we have input, process it.
        if let Some(input) = inputs.first() {
             // For each output channel
             for (i, output_channel) in outputs.iter_mut().enumerate() {
                 // Map input channel to output channel (or mixdown/upmix)
                 // Simple 1:1 mapping for now
                 if i < inputs.len() {
                    // We assume inputs are slices of data for the *same channel*? 
                    // No, `inputs` should probably be `&[&[f32]]` where inner is channel data? 
                    // Let's look at the Trait again. 
                    
                    // Actually, usually `process` gets `inputs: &[&[f32]]` meaning multiple inputs? 
                    // Or `inputs: &[&[&[f32]]]`?
                    // Let's refine the trait in the next file write.
                    
                    // For now, let's just do a simple buffer multiplication.
                    // Assuming input[i] corresponds to output[i]
                 }
             }
        }
        
        // Wait, the trait needs refinement to support multi-channel properly.
        // Let's re-write purely based on the trait we defined:
        // fn process(&mut self, inputs: &[&[f32]], outputs: &mut [&mut [f32]]) -> bool;
        
        // This signature suggests `inputs` is a list of buffers. 
        // If we treat it as "List of Channels for the single Input", it works on a single connection.
        
        let channels = std::cmp::min(inputs.len(), outputs.len());
        
        for ch in 0..channels {
            let input_data = inputs[ch];
            let output_data = &mut outputs[ch];
            
            for (s_in, s_out) in input_data.iter().zip(output_data.iter_mut()) {
                *s_out = s_in * self.gain;
            }
        }
        
        true
    }
}
