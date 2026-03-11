#!/bin/bash
set -e

# ===========================================
# Quick Deploy from Local
# Usage: ./deploy.sh [app-api|notification|cronjob-worker|all|infrastructure|init]
# ===========================================

SERVER_IP="46.224.149.73"
SSH_KEY="~/.ssh/id_ed25519_hetzner"
SSH_CMD="ssh -i $SSH_KEY root@$SERVER_IP"
SCP_CMD="scp -i $SSH_KEY"
APP=${1:-all}

case "$APP" in
  init)
    echo "==> Initial setup: copying files to server..."
    $SSH_CMD "mkdir -p ~/app"
    $SCP_CMD ./docker-compose.prod.yml root@$SERVER_IP:~/app/
    $SCP_CMD ./.env.production root@$SERVER_IP:~/app/
    echo "==> Files copied. Now run: ./deploy.sh infrastructure"
    ;;

  infrastructure)
    echo "==> Starting infrastructure (postgres, redis)..."
    $SSH_CMD "cd ~/app && docker compose --env-file .env.production -f docker-compose.prod.yml up -d postgres redis"
    echo "==> Waiting for health checks..."
    sleep 15
    $SSH_CMD "cd ~/app && docker compose --env-file .env.production -f docker-compose.prod.yml ps"
    ;;

  all)
    echo "==> Deploying all services..."
    $SCP_CMD ./docker-compose.prod.yml root@$SERVER_IP:~/app/
    $SSH_CMD "cd ~/app && \
      export VERSION=latest && \
      export REGISTRY=\$(grep -oP 'DOCKER_USERNAME=\K.*' .env.production 2>/dev/null || echo 'your-dockerhub-username') && \
      docker compose --env-file .env.production -f docker-compose.prod.yml pull app-api notification cronjob-worker && \
      docker compose --env-file .env.production -f docker-compose.prod.yml up -d && \
      docker image prune -af --filter 'until=72h'"
    echo "==> All services deployed!"
    ;;

  app-api|notification|cronjob-worker)
    echo "==> Deploying $APP..."
    $SSH_CMD "cd ~/app && \
      export VERSION=latest && \
      docker compose --env-file .env.production -f docker-compose.prod.yml pull $APP && \
      docker compose --env-file .env.production -f docker-compose.prod.yml up -d $APP"
    echo "==> $APP deployed!"
    ;;

  status)
    echo "==> Server status:"
    $SSH_CMD "cd ~/app && docker compose --env-file .env.production -f docker-compose.prod.yml ps && echo '' && docker stats --no-stream"
    ;;

  logs)
    echo "==> Logs (last 100 lines):"
    $SSH_CMD "cd ~/app && docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100"
    ;;

  *)
    echo "Usage: ./deploy.sh [init|infrastructure|all|app-api|notification|cronjob-worker|status|logs]"
    exit 1
    ;;
esac
