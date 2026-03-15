resource "google_sql_database_instance" "main" {
  name             = "${var.environment}-db-instance"
  database_version = "POSTGRES_15"
  region           = var.region

  deletion_protection = false

  settings {
    tier = "db-f1-micro"

    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 7
      }
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.vpc_self_link

      ssl_mode = "ENCRYPTED_ONLY"
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }

    database_flags {
      name  = "log_disconnections"
      value = "on"
    }

    maintenance_window {
      day          = 7
      hour         = 2
      update_track = "stable"
    }

    insights_config {
      query_insights_enabled = true
    }
  }
}

resource "google_sql_database" "databases" {
  for_each = toset(["userdb", "productdb", "orderdb"])
  name     = each.value
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "user" {
  name     = var.db_user
  instance = google_sql_database_instance.main.name
  password = var.db_password
}