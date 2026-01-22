use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum CurveType {
    Linear,
    Step,
    Bezier(f32), // Tension: -1.0 to 1.0 (concave to convex)
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct AutomationPoint {
    pub time: f64,  // In seconds
    pub value: f32, // Normalized 0.0 - 1.0 usually
    pub curve: CurveType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomationLane {
    pub points: Vec<AutomationPoint>,
    // In a real system, we might cache the last accessed index for performance
    #[serde(skip)]
    pub last_index: usize, 
    pub target: String, // e.g., "volume", "pan", "fx/0/mix"
}

impl AutomationLane {
    pub fn new(target: String) -> Self {
        Self {
            points: Vec::new(),
            last_index: 0,
            target,
        }
    }

    pub fn add_point(&mut self, time: f64, value: f32, curve: CurveType) {
        // Insert maintaining sort order
        let point = AutomationPoint { time, value, curve };
        match self.points.binary_search_by(|p| p.time.partial_cmp(&time).unwrap()) {
            Ok(pos) => self.points[pos] = point, // Replace if exact time match
            Err(pos) => self.points.insert(pos, point),
        }
    }

    pub fn get_value_at(&self, time: f64) -> f32 {
        if self.points.is_empty() {
            return 0.0; // Default value logic might belong elsewhere (or return Option)
        }

        // Before first point
        if time <= self.points[0].time {
            return self.points[0].value;
        }

        // After last point
        let last_idx = self.points.len() - 1;
        if time >= self.points[last_idx].time {
            return self.points[last_idx].value;
        }

        // Binary search for the segment
        // We want the point P1 such that P1.time <= time < P2.time
        // self.points is sorted.
        let idx = match self.points.binary_search_by(|p| p.time.partial_cmp(&time).unwrap()) {
            Ok(i) => i,
            Err(i) => i - 1, // Insertion point is after P1, so P1 is i-1
        };

        if idx >= last_idx {
            return self.points[last_idx].value;
        }

        let p1 = &self.points[idx];
        let p2 = &self.points[idx + 1];

        let t = (time - p1.time) / (p2.time - p1.time); // Normalized time 0.0 - 1.0

        match p1.curve {
            CurveType::Step => p1.value,
            CurveType::Linear => p1.value + (p2.value - p1.value) * t as f32,
            CurveType::Bezier(tension) => {
                // Simple quadratic bezier approximation for tension
                let t_f32 = t as f32;
                let exponent = if tension >= 0.0 {
                    1.0 + tension * 4.0 
                } else {
                    1.0 / (1.0 + tension.abs() * 4.0)
                };
                
                let curved_t = t_f32.powf(exponent);
                p1.value + (p2.value - p1.value) * curved_t
            }
        }
    }
}
