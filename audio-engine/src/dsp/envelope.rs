use super::DspProcessor;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum AdsrStage {
    Idle,
    Attack,
    Decay,
    Sustain,
    Release,
}

pub struct AdsrEnvelope {
    pub attack_ms: f32,
    pub decay_ms: f32,
    pub sustain_level: f32,
    pub release_ms: f32,
    
    sample_rate: f32,
    stage: AdsrStage,
    current_level: f32,
    
    // Increments per sample
    attack_inc: f32,
    decay_inc: f32,
    release_dec: f32,
}

impl AdsrEnvelope {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            attack_ms: 10.0,
            decay_ms: 100.0,
            sustain_level: 0.7,
            release_ms: 200.0,
            sample_rate,
            stage: AdsrStage::Idle,
            current_level: 0.0,
            attack_inc: 0.0,
            decay_inc: 0.0,
            release_dec: 0.0,
        }
    }
    
    fn calc_rates(&mut self) {
        self.attack_inc = 1.0 / (self.attack_ms * 0.001 * self.sample_rate);
        let decay_samples = self.decay_ms * 0.001 * self.sample_rate;
        self.decay_inc = (1.0 - self.sustain_level) / decay_samples;
        self.release_dec = self.sustain_level / (self.release_ms * 0.001 * self.sample_rate);
    }

    pub fn trigger(&mut self) {
        self.calc_rates(); // Recalc in case params changed
        self.stage = AdsrStage::Attack;
    }

    pub fn release(&mut self) {
        self.stage = AdsrStage::Release;
        self.calc_rates(); // Ensure release rate is correct
    }

    pub fn process(&mut self) -> f32 {
        match self.stage {
            AdsrStage::Idle => {
                self.current_level = 0.0;
            },
            AdsrStage::Attack => {
                self.current_level += self.attack_inc;
                if self.current_level >= 1.0 {
                    self.current_level = 1.0;
                    self.stage = AdsrStage::Decay;
                }
            },
            AdsrStage::Decay => {
                self.current_level -= self.decay_inc;
                if self.current_level <= self.sustain_level {
                    self.current_level = self.sustain_level;
                    self.stage = AdsrStage::Sustain;
                }
            },
            AdsrStage::Sustain => {
                self.current_level = self.sustain_level;
            },
            AdsrStage::Release => {
                self.current_level -= self.release_dec;
                if self.current_level <= 0.0 {
                    self.current_level = 0.0;
                    self.stage = AdsrStage::Idle;
                }
            }
        }
        self.current_level
    }
    
    pub fn is_active(&self) -> bool {
        self.stage != AdsrStage::Idle
    }
}
