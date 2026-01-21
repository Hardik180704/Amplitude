use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn setup_audio_worklet() -> Result<(), JsValue> {
    web_sys::console::log_1(&"Audio Engine Intialized".into());
    Ok(())
}
