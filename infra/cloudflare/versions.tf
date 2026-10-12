terraform {
  required_version = "~> 1.16"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.27"
    }
  }

  # State is kept in a Cloudflare R2 bucket through its S3-compatible API.
  # The bucket name (TF_CLI_ARGS_init) and the account endpoint
  # (AWS_ENDPOINT_URL_S3) come from deploy/terraform-state.env, so account
  # identifiers stay out of this public repository. The skip_* settings turn
  # off AWS-only calls that R2 does not implement.
  backend "s3" {
    key                         = "saberu-homepage/cloudflare.tfstate"
    region                      = "auto"
    use_path_style              = true
    use_lockfile                = true
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
  }
}
