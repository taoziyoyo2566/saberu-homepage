# The API token comes from CLOUDFLARE_API_TOKEN (see scripts/terraform.sh).
provider "cloudflare" {}

data "cloudflare_zone" "saberu" {
  filter = {
    name = "saberu.com"
  }
}
