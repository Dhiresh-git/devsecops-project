terraform {
  required_version = "~> 1.14.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "dev-env-489110-terraform-state"
    prefix = "devsecops/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "vpc" {
  source      = "./modules/vpc"
  environment = var.environment
  region      = var.region
  project_id  = var.project_id
}

module "gke" {
  source              = "./modules/gke"
  environment         = var.environment
  project_id          = var.project_id
  zone                = var.zone
  vpc_name            = module.vpc.vpc_name
  subnet_name         = module.vpc.subnet_name
  pods_range_name     = module.vpc.pods_range_name
  services_range_name = module.vpc.services_range_name
  node_count          = var.gke_node_count
  machine_type        = var.gke_machine_type
}

module "cloudsql" {
  source        = "./modules/cloudsql"
  environment   = var.environment
  region        = var.region
  vpc_self_link = module.vpc.vpc_self_link
  db_user       = var.db_user
  db_password   = var.db_password
}

module "secretmanager" {
  source      = "./modules/secretmanager"
  environment = var.environment
  project_id  = var.project_id
  db_password = var.db_password
  db_user     = var.db_user
}