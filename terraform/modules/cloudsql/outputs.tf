output "db_instance_name" {
  value = google_sql_database_instance.main.name
}

output "db_connection_name" {
  value = google_sql_database_instance.main.connection_name
}

output "db_private_ip" {
  value = google_sql_database_instance.main.private_ip_address
}