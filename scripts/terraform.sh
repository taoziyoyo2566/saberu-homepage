#!/usr/bin/env bash
# Run Terraform for infra/cloudflare in the official container image.
#
#   scripts/terraform.sh fmt -check -recursive          no credentials
#   scripts/terraform.sh init                           state credentials
#   scripts/terraform.sh plan -out=change.tfplan        plus the read-only token
#   CLOUDFLARE_TOKEN=write scripts/terraform.sh apply change.tfplan
#
# Credentials come from Git-ignored files: deploy/terraform-state.env (R2 state
# bucket) and deploy/cloudflare-readonly.env, the default token. The write token
# in deploy/cloudflare-write.env is loaded only for `apply <saved plan>`, after
# the operator has approved that saved plan.
set -euo pipefail

cd "$(dirname "$0")/.."

TERRAFORM_IMAGE="hashicorp/terraform:1.16.5@sha256:c7926feace05d0f7e73542842bf3945924e955a1f782cf000ccbb8d18fa42d77"

token="${CLOUDFLARE_TOKEN:-readonly}"
case "$token" in
  readonly) ;;
  write)
    if [ "$#" -ne 2 ] || [ "$1" != apply ] || [[ "$2" != *.tfplan ]]; then
      echo "the write token is only used as: CLOUDFLARE_TOKEN=write $0 apply <saved>.tfplan" >&2
      exit 2
    fi
    ;;
  *)
    echo "CLOUDFLARE_TOKEN must be readonly or write" >&2
    exit 2
    ;;
esac

env_args=()
for file in "deploy/cloudflare-${token}.env" deploy/terraform-state.env; do
  if [ -f "$file" ]; then
    env_args+=(--env-file "$file")
  fi
done

# Saved plans and .terraform/ can contain state data: create them private.
docker run --rm --init \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -e TF_IN_AUTOMATION=1 \
  -e TF_INPUT=0 \
  "${env_args[@]}" \
  -v "$PWD/infra/cloudflare:/work" \
  -w /work \
  --entrypoint /bin/sh \
  "$TERRAFORM_IMAGE" \
  -c 'umask 077 && exec terraform "$@"' terraform "$@"
