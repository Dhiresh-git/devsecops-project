variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
}

variable "vpc_self_link" {
  description = "VPC Self Link"
  type        = string
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