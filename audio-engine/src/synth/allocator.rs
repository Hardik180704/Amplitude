pub struct VoiceAllocator {
    voices_active: Vec<bool>,
    voice_ages: Vec<usize>,
    voice_notes: Vec<Option<u8>>, // Note currently playing on voice
}

impl VoiceAllocator {
    pub fn new(max_voices: usize) -> Self {
        Self {
            voices_active: vec![false; max_voices],
            voice_ages: vec![0; max_voices],
            voice_notes: vec![None; max_voices],
        }
    }
    
    // Returns index of allocated voice
    pub fn note_on(&mut self, note: u8, _velocity: u8) -> usize {
        // 1. Try to find existing voice for same note (retrigger)
        if let Some(idx) = self.voice_notes.iter().position(|n| *n == Some(note)) {
            self.voice_ages[idx] = 0; // Reset age (newest)
            return idx;
        }
        
        // 2. Find free voice
        if let Some(idx) = self.voices_active.iter().position(|active| !*active) {
            self.voices_active[idx] = true;
            self.voice_ages[idx] = 0;
            self.voice_notes[idx] = Some(note);
            return idx;
        }
        
        // 3. Steal oldest voice
        let idx = self.voice_ages.iter().enumerate().max_by_key(|(_i, age)| *age).map(|(i, _)| i).unwrap_or(0);
        self.voice_ages[idx] = 0;
        self.voice_notes[idx] = Some(note);
        return idx;
    }
    
    pub fn note_off(&mut self, note: u8) -> Option<usize> {
        if let Some(idx) = self.voice_notes.iter().position(|n| *n == Some(note)) {
            // Don't mark inactive yet, let Release phase finish.
            // But we remove note tracking so it can be re-allocated if needed?
            // Actually, for poly synth, we want Release phase to play out on ANY voice.
            // We just return the index so the synth can trigger Release on that voice.
            return Some(idx);
        }
        None
    }
    
    pub fn voice_finished(&mut self, idx: usize) {
        if idx < self.voices_active.len() {
            self.voices_active[idx] = false;
            self.voice_notes[idx] = None;
        }
    }
    
    pub fn tick(&mut self) {
        for age in self.voice_ages.iter_mut() {
            *age = age.saturating_add(1);
        }
    }
}
