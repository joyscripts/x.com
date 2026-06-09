#!/bin/sh
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  CREATE DATABASE api_gateway;
  CREATE DATABASE auth_service;
  CREATE DATABASE user_service;
  CREATE DATABASE social_graph_service;
  CREATE DATABASE post_service;
  CREATE DATABASE timeline_service;
  CREATE DATABASE notification_service;
  CREATE DATABASE search_service;
  CREATE DATABASE admin_service;
  CREATE DATABASE media_service;
EOSQL
