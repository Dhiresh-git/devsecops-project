variable "environment" {
  description = "Environment name"
  type        = string
}

variable "db_password" {
  description = "Database Password"
  type        = string
  sensitive   = true
}

variable "db_user" {
  description = "Database Username"
  type        = string
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}