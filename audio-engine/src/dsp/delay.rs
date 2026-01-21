use super::f_lerp;

pub struct DelayLine {
    buffer: Vec<f32>,
    write_idx: usize,
    mask: usize,
}

impl DelayLine {
    // Max delay in samples. Must be power of 2 for optimization (optional but good practice)
    pub fn new(max_delay_samples: usize) -> Self {
        // Find next power of 2
        let capacity = max_delay_samples.next_power_of_two();
        Self {
            buffer: vec![0.0; capacity],
            write_idx: 0,
            mask: capacity - 1,
        }
    }

    pub fn write(&mut self, sample: f32) {
        self.buffer[self.write_idx] = sample;
        self.write_idx = (self.write_idx + 1) & self.mask;
    }

    pub fn read(&self, delay_samples: f32) -> f32 {
        let read_pos = self.write_idx as f32 - delay_samples;
        
        let p_int = read_pos.floor() as isize;
        let frac = read_pos - p_int as f32;
        
        // Wrap pointer manually
        let p1 = (p_int & self.mask as isize) as usize;
        let p2 = ((p_int + 1) & self.mask as isize) as usize;
        
        let s1 = self.buffer[p1];
        let s2 = self.buffer[p2];
        
        f_lerp(s1, s2, frac)
    }
}
