resource "google_compute_network" "vpc" {
  name                    = "${var.environment}-three-tier-vpc"
  auto_create_subnetworks = false
  description             = "VPC for ${var.environment} environment"
}

resource "google_compute_subnetwork" "subnet" {
  name          = "${var.environment}-three-tier-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id

  private_ip_google_access = true

  secondary_ip_range {
    range_name    = "pods-range"
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services-range"
    ip_cidr_range = "10.2.0.0/16"
  }
}

resource "google_compute_firewall" "allow_internal" {
  name    = "${var.environment}-allow-internal"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.0.0/24"]
}