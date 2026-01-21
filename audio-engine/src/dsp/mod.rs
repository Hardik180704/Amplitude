pub mod filter;
pub mod delay;
pub mod dynamics;
pub mod envelope;

use std::f32::consts::PI;

pub const PI_2: f32 = 2.0 * PI;

pub use shared::{db_to_linear, linear_to_db};

#[inline]
pub fn f_lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

// Basic trait for a processor that works sample-by-sample
pub trait DspProcessor {
    fn process_sample(&mut self, input: f32) -> f32;
    fn reset(&mut self);
}
