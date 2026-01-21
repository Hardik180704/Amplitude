use wasm_bindgen::prelude::*;

mod processor;
pub mod graph;
pub mod nodes;
pub mod mixer;
pub mod scheduler;
pub use processor::WasmAudioProcessor;

#[wasm_bindgen]
pub fn setup_audio_worklet() -> Result<(), JsValue> {
    // Set up better panic messages for debugging
    console_error_panic_hook::set_once();
    web_sys::console::log_1(&"Audio Engine Intialized".into());
    Ok(())
}
