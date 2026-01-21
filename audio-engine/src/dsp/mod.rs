pub mod filter;
pub mod delay;
use std::f32::consts::PI;

pub const PI_2: f32 = 2.0 * PI;

#[inline]
pub fn db_to_linear(db: f32) -> f32 {
    10.0f32.powf(db / 20.0)
}

#[inline]
pub fn linear_to_db(linear: f32) -> f32 {
    20.0 * linear.log10()
}

#[inline]
pub fn f_lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

// Basic trait for a processor that works sample-by-sample
// This is different from AudioNode which works block-by-block
pub trait DspProcessor {
    fn process_sample(&mut self, input: f32) -> f32;
    fn reset(&mut self);
}
