use std::f32::consts::PI;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum LfoWave {
    Sine,
    Triangle,
    Saw,
    Square,
    SampleAndHold, // Random Steps
}

pub struct Lfo {
    pub frequency: f32,
    pub wave: LfoWave,
    pub phase: f32, // 0.0 to 1.0
    
    sample_rate: f32,
    phase_inc: f32,
    
    // State for S&H
    last_sh_val: f32,
    sh_triggered: bool,
}

impl Lfo {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            frequency: 1.0,
            wave: LfoWave::Sine,
            phase: 0.0,
            sample_rate,
            phase_inc: 1.0 / sample_rate, // 1 Hz default
            last_sh_val: 0.0,
            sh_triggered: false,
        }
    }
    
    pub fn set_freq(&mut self, freq: f32) {
        self.frequency = freq;
        self.phase_inc = freq / self.sample_rate;
    }
    
    pub fn process(&mut self) -> f32 {
        let val = match self.wave {
            LfoWave::Sine => (self.phase * 2.0 * PI).sin(),
            LfoWave::Triangle => {
                // 0 -> 1 (up), 0.25 -> 0, 0.5 -> -1, 0.75 -> 0 ???
                // Standard tri: 4 * abs(t - floor(t + 0.75) - 0.25) - 1 ... complicated
                // Simple: 
                // 0.0-0.25: 0 to 1
                // 0.25-0.75: 1 to -1
                // 0.75-1.0: -1 to 0
                if self.phase < 0.25 {
                    self.phase * 4.0
                } else if self.phase < 0.75 {
                    1.0 - (self.phase - 0.25) * 4.0
                } else {
                    -1.0 + (self.phase - 0.75) * 4.0
                }
            },
            LfoWave::Saw => {
                // 1.0 down to -1.0
                1.0 - 2.0 * self.phase
            },
            LfoWave::Square => {
                if self.phase < 0.5 { 1.0 } else { -1.0 }
            },
            LfoWave::SampleAndHold => {
                // If phase wrapped recently, pick new value
                // We detect wrap by seeing if we are near 0?
                // Or just use the loop logic below.
                // Assuming process is called sequentially.
                self.last_sh_val
            }
        };
        
        // Advance Phase
        let old_phase = self.phase;
        self.phase += self.phase_inc;
        if self.phase >= 1.0 {
            self.phase -= 1.0;
            // Trigger S&H on wrap
            if let LfoWave::SampleAndHold = self.wave {
                self.last_sh_val = (rand::random::<f32>() * 2.0) - 1.0;
            }
        }
        
        val
    }
}
