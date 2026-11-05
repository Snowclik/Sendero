//! Motor nativo offline de Sendero.
//! Rust se encarga de lo que el navegador no puede garantizar: escribir en disco
//! de forma segura (cortes de luz en albergues). El render 3D vive en el WebView (WebGL).

use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const SAVE_FILE: &str = "progreso.json";

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

/// Escritura atómica: si se va la luz a mitad de guardado, el archivo anterior queda intacto.
fn write_atomic(path: &Path, data: &str) -> Result<(), String> {
    let tmp = path.with_extension("tmp");
    fs::write(&tmp, data).map_err(|e| format!("No se pudo escribir: {e}"))?;
    fs::rename(&tmp, path).map_err(|e| format!("No se pudo reemplazar: {e}"))
}

/// Guarda el almacén completo de perfiles. Se acepta JSON libre (objeto) para que
/// agregar campos nuevos en el juego nunca rompa partidas viejas.
#[tauri::command]
fn save_offline_progress(app: AppHandle, state: serde_json::Value) -> Result<(), String> {
    if !state.is_object() {
        return Err("Formato de progreso inválido".into());
    }
    write_atomic(&data_dir(&app)?.join(SAVE_FILE), &state.to_string())
}

/// Devuelve `None` si no hay partida o si el archivo está dañado (nunca bloquea el juego).
#[tauri::command]
fn load_offline_progress(app: AppHandle) -> Result<Option<serde_json::Value>, String> {
    let path = data_dir(&app)?.join(SAVE_FILE);
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    Ok(serde_json::from_str(&raw).ok())
}

/// Confirma que el almacenamiento nativo funciona sin red y devuelve dónde se guarda.
#[tauri::command]
fn check_offline_status(app: AppHandle) -> Result<String, String> {
    Ok(data_dir(&app)?.display().to_string())
}

/// Cierra el juego desde el botón "Salir" del menú.
#[tauri::command]
fn exit_app(app: AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_offline_progress,
            load_offline_progress,
            check_offline_status,
            exit_app
        ])
        .run(tauri::generate_context!())
        .expect("Error al iniciar Sendero");
}
