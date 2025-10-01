#!/usr/bin/env bash
set -euo pipefail

# Bootstrap virtual environment, install minimal ACE News dependencies,
# then run the requested job (defaults to news_digest).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
REQUIREMENTS_FILE="${ROOT_DIR}/ace/requirements-news.txt"
DEFAULT_CONFIG="${ROOT_DIR}/ace/configs/config.example.yaml"
JOB="news_digest"
CONFIG_PATH="${DEFAULT_CONFIG}"
INSTALL_ONLY=0

usage() {
  cat <<'USAGE'
Usage: run-news-digest.sh [--job JOB_NAME] [--config PATH] [--install-only]

Options:
  --job JOB_NAME     ACE job to execute after setup (default: news_digest)
  --config PATH      Path to ACE configuration file (default: ace/configs/config.example.yaml)
  --install-only     Prepare environment but skip running any job
  --help             Show this help message
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --job)
      JOB="$2"
      shift 2
      ;;
    --config)
      CONFIG_PATH="${2}"
      shift 2
      ;;
    --install-only)
      INSTALL_ONLY=1
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ ! -d "${VENV_DIR}" ]]; then
  echo "[bootstrap] Creating virtual environment at ${VENV_DIR}"
  python3 -m venv "${VENV_DIR}"
fi

PYTHON_BIN="${VENV_DIR}/bin/python"
PIP_BIN="${VENV_DIR}/bin/pip"

"${PYTHON_BIN}" -m pip install --upgrade pip >/dev/null

if [[ -f "${REQUIREMENTS_FILE}" ]]; then
  echo "[bootstrap] Installing ACE dependencies from ${REQUIREMENTS_FILE}"
  "${PIP_BIN}" install -r "${REQUIREMENTS_FILE}"
else
  echo "[bootstrap] Requirements file not found: ${REQUIREMENTS_FILE}" >&2
  exit 1
fi

echo "[bootstrap] Dependencies installed."

if [[ "${INSTALL_ONLY}" -eq 1 ]]; then
  echo "[bootstrap] Install-only mode enabled; skipping job execution."
  exit 0
fi

if [[ ! -f "${CONFIG_PATH}" ]]; then
  echo "[bootstrap] Config file not found: ${CONFIG_PATH}" >&2
  exit 1
fi

echo "[run] Executing ACE job '${JOB}' with config ${CONFIG_PATH}"
PYTHONPATH="${ROOT_DIR}" "${PYTHON_BIN}" "${ROOT_DIR}/scripts/ace/run_job.py" --job "${JOB}" --config "${CONFIG_PATH}"
