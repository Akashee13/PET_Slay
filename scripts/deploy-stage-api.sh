#!/usr/bin/env sh

set -eu

if [ -z "${GCP_PROJECT_ID:-}" ]; then
	echo "GCP_PROJECT_ID is required. Example: GCP_PROJECT_ID=my-project scripts/deploy-stage-api.sh" >&2
	exit 1
fi

IMAGE_TAG="${IMAGE_TAG:-stage-latest}"

echo "Deploying PET_Slay API to stage..."
echo "Expected prerequisites:"
echo "- kubectl configured for the stage cluster"
echo "- stage secret created from deploy/k8s/base/api-secret.template.yaml"
echo "- image published to the configured registry"
echo "- GCP_PROJECT_ID exported in your shell"
echo

kubectl get secret pet-slay-api-secrets -n pet-slay-stage >/dev/null

tmpdir="$(mktemp -d)"
cp -R deploy/k8s "$tmpdir/k8s"
sed -e "s/PROJECT_ID/${GCP_PROJECT_ID}/g" -e "s/newTag: stage-latest/newTag: ${IMAGE_TAG}/g" "$tmpdir/k8s/stage/kustomization.yaml" > "$tmpdir/k8s/stage/kustomization.rendered.yaml"
mv "$tmpdir/k8s/stage/kustomization.rendered.yaml" "$tmpdir/k8s/stage/kustomization.yaml"

kubectl apply -k "$tmpdir/k8s/stage"

echo "Stage deploy applied with image tag: ${IMAGE_TAG}"
