#[derive(Clone, Copy, Debug, PartialEq)]
pub enum EnvelopeState {
    Idle,
    Attack,
    Decay,
    Sustain,
    Release,
}

pub struct AdsrEnvelope {
    state: EnvelopeState,
    value: f32,
    
    // Parameters
    pub attack: f32,  // seconds
    pub decay: f32,   // seconds
    pub sustain: f32, // 0.0 - 1.0
    pub release: f32, // seconds
    
    // Increments per sample
    attack_inc: f32,
    decay_inc: f32,
    release_inc: f32,
    
    sample_rate: f32,
}

impl AdsrEnvelope {
    pub fn new(sample_rate: f32) -> Self {
        let mut env = Self {
            state: EnvelopeState::Idle,
            value: 0.0,
            attack: 0.01,
            decay: 0.1,
            sustain: 0.7,
            release: 0.2,
            attack_inc: 0.0,
            decay_inc: 0.0,
            release_inc: 0.0,
            sample_rate,
        };
        env.calc_increments();
        env
    }
    
    fn calc_increments(&mut self) {
        self.attack_inc = 1.0 / (self.attack * self.sample_rate);
        self.decay_inc = 1.0 / (self.decay * self.sample_rate); // Linear decay for now
        self.release_inc = 1.0 / (self.release * self.sample_rate);
    }
    
    pub fn gate(&mut self, on: bool) {
        if on {
            self.state = EnvelopeState::Attack;
        } else if self.state != EnvelopeState::Idle {
            self.state = EnvelopeState::Release;
        }
    }
    
    pub fn process(&mut self) -> f32 {
        match self.state {
            EnvelopeState::Idle => {
                self.value = 0.0;
            },
            EnvelopeState::Attack => {
                self.value += self.attack_inc;
                if self.value >= 1.0 {
                    self.value = 1.0;
                    self.state = EnvelopeState::Decay;
                }
            },
            EnvelopeState::Decay => {
                self.value -= self.decay_inc;
                if self.value <= self.sustain {
                    self.value = self.sustain;
                    self.state = EnvelopeState::Sustain;
                }
            },
            EnvelopeState::Sustain => {
                self.value = self.sustain;
            },
            EnvelopeState::Release => {
                self.value -= self.release_inc;
                if self.value <= 0.0 {
                    self.value = 0.0;
                    self.state = EnvelopeState::Idle;
                }
            },
        }
        self.value
    }
    
    pub fn is_active(&self) -> bool {
        self.state != EnvelopeState::Idle
    }
}
