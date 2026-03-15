output "db_password_secret_id" {
  value = google_secret_manager_secret.db_password.secret_id
}

output "db_user_secret_id" {
  value = google_secret_manager_secret.db_user.secret_id
}