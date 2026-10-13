use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Erreur d'authentification Steam: {0}")]
    Auth(String),

    #[error("Erreur du tracker de succès: {0}")]
    Tracker(String),

    #[error("Erreur du serveur OBS: {0}")]
    Obs(String),

    #[error("Erreur d'entrée/sortie disque: {0}")]
    Io(#[from] std::io::Error),

    #[error("Erreur de sérialisation JSON: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Erreur de configuration de l'application: {0}")]
    Config(String),

    #[error("Erreur réseau Steam/HTTP: {0}")]
    Network(#[from] reqwest::Error),

    #[error("Erreur dialogue système: {0}")]
    Dialog(String),

    #[error("Erreur interne: {0}")]
    Internal(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}

pub type AppResult<T> = Result<T, AppError>;
