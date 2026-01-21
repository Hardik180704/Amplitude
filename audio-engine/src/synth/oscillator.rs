use std::f32::consts::PI;

#[derive(Clone, Copy, Debug)]
pub enum Waveform {
    Sine,
    Saw,
    Square,
    Triangle,
}

pub struct Oscillator {
    pub phase: f32,
    pub phase_inc: f32,
    pub waveform: Waveform,
    pub sample_rate: f32,
}

impl Oscillator {
    pub fn new(sample_rate: f32) -> Self {
        Self {
            phase: 0.0,
            phase_inc: 0.0,
            waveform: Waveform::Saw, // Default to Saw for rich sound
            sample_rate,
        }
    }

    pub fn set_frequency(&mut self, freq: f32) {
        self.phase_inc = freq / self.sample_rate;
    }

    pub fn process(&mut self) -> f32 {
        let out = match self.waveform {
            Waveform::Sine => (self.phase * 2.0 * PI).sin(),
            Waveform::Saw => 2.0 * self.phase - 1.0, // Naive Saw (aliased) - OK for MVP
            Waveform::Square => if self.phase < 0.5 { 1.0 } else { -1.0 },
            Waveform::Triangle => 4.0 * (self.phase - 0.5).abs() - 1.0,
        };

        self.phase += self.phase_inc;
        if self.phase >= 1.0 {
            self.phase -= 1.0;
        }

        out
    }
}
