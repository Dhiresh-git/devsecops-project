variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP Zone"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "db_user" {
  description = "Database Username"
  type        = string
}

variable "db_password" {
  description = "Database Password"
  type        = string
  sensitive   = true
}

variable "gke_node_count" {
  description = "Number of GKE nodes"
  type        = number
  default     = 2
}

variable "gke_machine_type" {
  description = "GKE Node Machine Type"
  type        = string
  default     = "e2-medium"
}