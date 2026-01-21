use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct AudioCommand {
    pub command_type: String,
    pub payload: Vec<u8>,
}
