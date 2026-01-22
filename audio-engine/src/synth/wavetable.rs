use std::f32::consts::PI;

pub struct Wavetable {
    pub tables: Vec<Vec<f32>>, // 2D array: [frame][sample]
    pub table_size: usize,
}

impl Wavetable {
    pub fn new(table_size: usize) -> Self {
        // Create basic morphing table: Sine -> Saw -> Square
        let mut tables = Vec::new();
        let num_frames = 8;
        
        for i in 0..num_frames {
            let mut table = vec![0.0; table_size];
            let t = i as f32 / (num_frames - 1) as f32; // 0.0 to 1.0
            
            for s in 0..table_size {
                let phase = s as f32 / table_size as f32; // 0 to 1
                let rad = phase * 2.0 * PI;
                
                // Generators
                let sine = rad.sin();
                let saw = 1.0 - 2.0 * phase;
                let square = if phase < 0.5 { 1.0 } else { -1.0 };
                
                // Morph logic:
                // 0.0 - 0.5: Sine -> Saw
                // 0.5 - 1.0: Saw -> Square
                let val = if t < 0.5 {
                    let blend = t * 2.0;
                    sine * (1.0 - blend) + saw * blend
                } else {
                    let blend = (t - 0.5) * 2.0;
                    saw * (1.0 - blend) + square * blend
                };
                
                table[s] = val;
            }
            tables.push(table);
        }
        
        Self {
            tables,
            table_size,
        }
    }
    
    pub fn get_sample(&self, phase: f32, morph: f32) -> f32 {
        let num_frames = self.tables.len();
        let frame_idx_f = morph.clamp(0.0, 1.0) * (num_frames - 1) as f32;
        let frame_idx = frame_idx_f.floor() as usize;
        let frame_frac = frame_idx_f - frame_idx as f32;
        
        // Wrap phase
        let p = phase - phase.floor();
        let idx_f = p * self.table_size as f32;
        let idx = idx_f.floor() as usize;
        let frac = idx_f - idx as f32;
        
        // 2D Interpolation (Bilinear)
        
        let f1 = &self.tables[frame_idx];
        let f2 = if frame_idx + 1 < num_frames { &self.tables[frame_idx + 1] } else { f1 };
        
        let s1_next = f1[(idx + 1) % self.table_size];
        let s2_next = f2[(idx + 1) % self.table_size];
        
        let val1 = f1[idx] * (1.0 - frac) + s1_next * frac;
        let val2 = f2[idx] * (1.0 - frac) + s2_next * frac;
        
        val1 * (1.0 - frame_frac) + val2 * frame_frac
    }
}

pub struct WavetableOscillator {
    pub table: Wavetable,
    pub phase: f32,
    pub freq: f32,
    pub sample_rate: f32,
    pub morph: f32,
}

impl WavetableOscillator {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            table: Wavetable::new(2048),
            phase: 0.0,
            freq: 440.0,
            sample_rate,
            morph: 0.0, // 0 to 1
        }
    }
    
    pub fn process(&mut self) -> f32 {
        let val = self.table.get_sample(self.phase, self.morph);
        
        let inc = self.freq / self.sample_rate;
        self.phase += inc;
        if self.phase >= 1.0 { self.phase -= 1.0; }
        
        val
    }
}
