#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  SELECT 'CREATE DATABASE taskplatform_identity'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'taskplatform_identity')\gexec

  SELECT 'CREATE DATABASE taskplatform_tasks'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'taskplatform_tasks')\gexec
EOSQL
