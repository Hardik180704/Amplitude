use super::{DspProcessor, PI_2};

#[derive(Clone, Copy, Debug)]
pub enum FilterType {
    LowPass,
    HighPass,
    Peaking,
    LowShelf,
    HighShelf,
}

#[derive(Clone, Debug)]
pub struct Biquad {
    // Coefficients
    b0: f32, b1: f32, b2: f32,
    a1: f32, a2: f32,

    // State
    z1: f32, z2: f32,
    
    // Parameters
    filter_type: FilterType,
    freq: f32,
    q: f32,
    gain_db: f32,
    sample_rate: f32,
}

impl Biquad {
    pub fn new(filter_type: FilterType, freq: f32, q: f32, sample_rate: f32) -> Self {
        let mut bq = Self {
            b0: 0.0, b1: 0.0, b2: 0.0,
            a1: 0.0, a2: 0.0,
            z1: 0.0, z2: 0.0,
            filter_type,
            freq,
            q,
            gain_db: 0.0,
            sample_rate,
        };
        bq.calc_coeffs();
        bq
    }

    pub fn set_params(&mut self, freq: f32, q: f32, gain_db: f32) {
        self.freq = freq;
        self.q = q;
        self.gain_db = gain_db;
        self.calc_coeffs();
    }

    fn calc_coeffs(&mut self) {
        let w0 = PI_2 * self.freq / self.sample_rate;
        let cos_w0 = w0.cos();
        let sin_w0 = w0.sin();
        let alpha = sin_w0 / (2.0 * self.q);

        // Normalized coefficients (Div by a0)
        let a0_inv; // 1.0 / a0

        match self.filter_type {
            FilterType::LowPass => {
                let b0 = (1.0 - cos_w0) / 2.0;
                let b1 = 1.0 - cos_w0;
                let b2 = (1.0 - cos_w0) / 2.0;
                let a0 = 1.0 + alpha;
                let a1 = -2.0 * cos_w0;
                let a2 = 1.0 - alpha;

                a0_inv = 1.0 / a0;
                self.b0 = b0 * a0_inv;
                self.b1 = b1 * a0_inv;
                self.b2 = b2 * a0_inv;
                self.a1 = a1 * a0_inv;
                self.a2 = a2 * a0_inv;
            },
            FilterType::HighPass => {
                let b0 = (1.0 + cos_w0) / 2.0;
                let b1 = -(1.0 + cos_w0);
                let b2 = (1.0 + cos_w0) / 2.0;
                let a0 = 1.0 + alpha;
                let a1 = -2.0 * cos_w0;
                let a2 = 1.0 - alpha;

                a0_inv = 1.0 / a0;
                self.b0 = b0 * a0_inv;
                self.b1 = b1 * a0_inv;
                self.b2 = b2 * a0_inv;
                self.a1 = a1 * a0_inv;
                self.a2 = a2 * a0_inv;
            },
            FilterType::Peaking => {
                let a = 10.0f32.powf(self.gain_db / 40.0);
                let b0 = 1.0 + alpha * a;
                let b1 = -2.0 * cos_w0;
                let b2 = 1.0 - alpha * a;
                let a0 = 1.0 + alpha / a;
                let a1 = -2.0 * cos_w0;
                let a2 = 1.0 - alpha / a;

                a0_inv = 1.0 / a0;
                self.b0 = b0 * a0_inv;
                self.b1 = b1 * a0_inv;
                self.b2 = b2 * a0_inv;
                self.a1 = a1 * a0_inv;
                self.a2 = a2 * a0_inv;
            },
            FilterType::LowShelf => {
                let a = 10.0f32.powf(self.gain_db / 40.0);
                let sqrt_a = a.sqrt();
                let b0 =    a * ((a + 1.0) - (a - 1.0) * cos_w0 + 2.0 * sqrt_a * alpha);
                let b1 = 2.0 * a * ((a - 1.0) - (a + 1.0) * cos_w0);
                let b2 =    a * ((a + 1.0) - (a - 1.0) * cos_w0 - 2.0 * sqrt_a * alpha);
                let a0 =        (a + 1.0) + (a - 1.0) * cos_w0 + 2.0 * sqrt_a * alpha;
                let a1 =  -2.0 * ((a - 1.0) + (a + 1.0) * cos_w0);
                let a2 =        (a + 1.0) + (a - 1.0) * cos_w0 - 2.0 * sqrt_a * alpha;

                a0_inv = 1.0 / a0;
                self.b0 = b0 * a0_inv;
                self.b1 = b1 * a0_inv;
                self.b2 = b2 * a0_inv;
                self.a1 = a1 * a0_inv;
                self.a2 = a2 * a0_inv;
            },
            FilterType::HighShelf => {
                let a = 10.0f32.powf(self.gain_db / 40.0);
                let sqrt_a = a.sqrt();
                let b0 =    a * ((a + 1.0) + (a - 1.0) * cos_w0 + 2.0 * sqrt_a * alpha);
                let b1 = -2.0 * a * ((a - 1.0) + (a + 1.0) * cos_w0);
                let b2 =    a * ((a + 1.0) + (a - 1.0) * cos_w0 - 2.0 * sqrt_a * alpha);
                let a0 =        (a + 1.0) - (a - 1.0) * cos_w0 + 2.0 * sqrt_a * alpha;
                let a1 =   2.0 * ((a - 1.0) - (a + 1.0) * cos_w0);
                let a2 =        (a + 1.0) - (a - 1.0) * cos_w0 - 2.0 * sqrt_a * alpha;

                a0_inv = 1.0 / a0;
                self.b0 = b0 * a0_inv;
                self.b1 = b1 * a0_inv;
                self.b2 = b2 * a0_inv;
                self.a1 = a1 * a0_inv;
                self.a2 = a2 * a0_inv;
            }
        }
    }
}

impl DspProcessor for Biquad {
    fn process_sample(&mut self, input: f32) -> f32 {
        // Direct Form II Transposed structure
        // y = b0*x + z1
        // z1 = b1*x - a1*y + z2
        // z2 = b2*x - a2*y
        
        let out = self.b0 * input + self.z1;
        self.z1 = self.b1 * input - self.a1 * out + self.z2;
        self.z2 = self.b2 * input - self.a2 * out;
        
        // Denormal protection could go here
        out
    }

    fn reset(&mut self) {
        self.z1 = 0.0;
        self.z2 = 0.0;
    }
}
