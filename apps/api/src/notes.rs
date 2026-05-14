//! `/notes` — the existing demo resource, kept around so the API has something
//! to host besides the auth surface. Lifted out of `main.rs` verbatim and
//! converted to use `AppError` instead of `.unwrap()`.

use axum::{Json, Router, extract::State, routing::post};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/notes", post(create).get(list))
}

#[derive(Debug, Deserialize)]
struct CreateNote {
    title: String,
    body: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
struct Note {
    id: Uuid,
    title: String,
    body: String,
    created_at: DateTime<Utc>,
}

async fn create(
    State(state): State<AppState>,
    Json(payload): Json<CreateNote>,
) -> Result<Json<Note>, AppError> {
    let note = sqlx::query_as::<_, Note>(
        "INSERT INTO notes (title, body) VALUES ($1, $2)
         RETURNING id, title, body, created_at",
    )
    .bind(&payload.title)
    .bind(&payload.body)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(note))
}

async fn list(State(state): State<AppState>) -> Result<Json<Vec<Note>>, AppError> {
    let notes = sqlx::query_as::<_, Note>(
        "SELECT id, title, body, created_at FROM notes ORDER BY created_at DESC",
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(notes))
}
