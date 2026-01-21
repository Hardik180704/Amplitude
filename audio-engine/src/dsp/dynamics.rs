use super::DspProcessor;

pub struct EnvelopeFollower {
    attack_coef: f32,
    release_coef: f32,
    envelope: f32,
    sample_rate: f32,
}

impl EnvelopeFollower {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            attack_coef: 0.0,
            release_coef: 0.0,
            envelope: 0.0,
            sample_rate,
        }
    }

    pub fn set_params(&mut self, attack_ms: f32, release_ms: f32) {
        self.attack_coef = (-1.0 / (attack_ms * 0.001 * self.sample_rate)).exp();
        self.release_coef = (-1.0 / (release_ms * 0.001 * self.sample_rate)).exp();
    }
    
    // Process input sample (usually abs(x)) and return envelope level
    pub fn process(&mut self, input_abs: f32) -> f32 {
        if input_abs > self.envelope {
            self.envelope = self.attack_coef * (self.envelope - input_abs) + input_abs;
        } else {
            self.envelope = self.release_coef * (self.envelope - input_abs) + input_abs;
        }
        self.envelope
    }
}
