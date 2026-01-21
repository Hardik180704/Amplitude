use crate::graph::AudioNode;

pub struct WavSourceNode {
    buffer: Vec<f32>,
    position: usize,
    looping: bool,
    playing: bool,
}

impl WavSourceNode {
    pub fn new(buffer: Vec<f32>, looping: bool) -> Self {
        Self {
            buffer,
            position: 0,
            looping,
            playing: false,
        }
    }

    pub fn play(&mut self) {
        self.playing = true;
    }
    
    pub fn stop(&mut self) {
        self.playing = false;
        self.position = 0;
    }
}

impl AudioNode for WavSourceNode {
    fn process(&mut self, _inputs: &[&[f32]], outputs: &mut [&mut [f32]]) -> bool {
        if !self.playing {
            // Fill outputs with silence
            for channel in outputs.iter_mut() {
                for sample in channel.iter_mut() {
                    *sample = 0.0;
                }
            }
            return false;
        }

        let num_channels = outputs.len();
        let samples_needed = outputs[0].len(); // Assume equal length

        for i in 0..samples_needed {
            let sample_val = if self.position < self.buffer.len() {
                self.buffer[self.position]
            } else {
                0.0
            };
            
            // Write to all output channels (mono -> stereo expansion)
            for ch in 0..num_channels {
                outputs[ch][i] = sample_val;
            }
            
            self.position += 1;
            
            if self.position >= self.buffer.len() {
                if self.looping {
                    self.position = 0;
                } else {
                    self.playing = false;
                    // Finish out the buffer with silence
                }
            }
        }
        
        // Return true if we are still playing or might play again (if we want to keep node alive)
        // For SourceNode, usually we might return false if done.
        self.playing
    }
}
