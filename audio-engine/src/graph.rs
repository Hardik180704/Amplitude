// Basic trait for any audio processing node
pub trait AudioNode {
    /// Process a block of audio.
    /// inputs: Slice of input buffers (if any)
    /// outputs: Slice of output buffers
    /// params: Context for parameters (optional for now)
    /// returns: false if the node is finished/silent and can be removed
    fn process(&mut self, inputs: &[&[f32]], outputs: &mut [&mut [f32]]) -> bool;
    
    // For now simple stereo
    // In future: channel counts, sample rate info
}

// A simple sine wave source
pub struct OscillatorNode {
    phase: f32,
    frequency: f32,
    sample_rate: f32,
}

impl OscillatorNode {
    pub fn new(frequency: f32, sample_rate: f32) -> Self {
        Self {
            phase: 0.0,
            frequency,
            sample_rate,
        }
    }
}

impl AudioNode for OscillatorNode {
    fn process(&mut self, _inputs: &[&[f32]], outputs: &mut [&mut [f32]]) -> bool {
        let phase_increment = self.frequency * 2.0 * std::f32::consts::PI / self.sample_rate;
        
        // Assume stereo output for this project requirement (or mono -> stereo)
        for channel in outputs.iter_mut() {
            for sample in channel.iter_mut() {
                *sample = self.phase.sin();
                self.phase += phase_increment;
                if self.phase > 2.0 * std::f32::consts::PI {
                    self.phase -= 2.0 * std::f32::consts::PI;
                }
            }
        }
        
        true
    }
}

// Graph manager to topological sort and run nodes
pub struct AudioGraph {
    nodes: Vec<Box<dyn AudioNode + Send>>, // Simplified linear chain for Phase 1
}

impl AudioGraph {
    pub fn new() -> Self {
        Self { nodes: Vec::new() }
    }

    pub fn add_node(&mut self, node: Box<dyn AudioNode + Send>) {
        self.nodes.push(node);
    }
    
    pub fn process_block(&mut self, output: &mut [f32]) {
        // Linear processing: Node 1 -> Node 2 -> Output
        // For Phase 1, just run the last node to the output buffer
        // In reality, we need buffers between nodes.
        
        if let Some(last_node) = self.nodes.last_mut() {
            // Create a temp buffer or slice for the single channel
            // This is simplified. proper graph needs proper buffer management.
            let mut left_channel = vec![0.0; output.len() / 2];
            let mut right_channel = vec![0.0; output.len() / 2];
            let mut outputs = vec![&mut left_channel[..], &mut right_channel[..]];
            
            last_node.process(&[], &mut outputs);
            
            // Interleave to output
            for (i, frame) in output.chunks_mut(2).enumerate() {
                frame[0] = outputs[0][i];
                frame[1] = outputs[1][i];
            }
        }
    }
}
