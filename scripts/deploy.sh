#!/bin/bash

set -e

# BookIt Blue-Green Deployment Script
# Usage: ./deploy.sh [blue|green] [rollback]

ENVIRONMENT=${ENVIRONMENT:-production}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-your-registry.com}
IMAGE_TAG=${IMAGE_TAG:-latest}
DEPLOY_ENV=${1:-blue}
ACTION=${2:-deploy}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Validate deployment environment
validate_environment() {
    if [[ "$DEPLOY_ENV" != "blue" && "$DEPLOY_ENV" != "green" ]]; then
        error "Invalid deployment environment. Must be 'blue' or 'green'"
        exit 1
    fi

    if [[ "$ACTION" != "deploy" && "$ACTION" != "rollback" ]]; then
        error "Invalid action. Must be 'deploy' or 'rollback'"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running or not accessible"
        exit 1
    fi

    # Check if docker-compose is available
    if ! command -v docker-compose >/dev/null 2>&1; then
        error "docker-compose is not installed"
        exit 1
    fi

    # Check environment variables
    required_vars=("DOCKER_REGISTRY" "IMAGE_TAG" "MONGO_ROOT_USERNAME" "MONGO_ROOT_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done

    log "Prerequisites check passed"
}

# Pull latest images
pull_images() {
    log "Pulling latest images..."

    docker pull ${DOCKER_REGISTRY}/bookit-backend:${IMAGE_TAG}
    docker pull ${DOCKER_REGISTRY}/bookit-frontend:${IMAGE_TAG}

    log "Images pulled successfully"
}

# Health check function
health_check() {
    local service=$1
    local max_attempts=30
    local attempt=1

    log "Performing health check for $service..."

    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f docker-compose.prod.yml ps $service | grep -q "Up"; then
            log "$service is healthy"
            return 0
        fi

        warn "Health check attempt $attempt/$max_attempts failed for $service"
        sleep 10
        ((attempt++))
    done

    error "$service failed health check after $max_attempts attempts"
    return 1
}

# Deploy to specified environment
deploy() {
    local env=$1
    log "Starting deployment to $env environment..."

    # Scale down the non-active environment
    if [[ "$env" == "blue" ]]; then
        log "Scaling down green environment..."
        docker-compose -f docker-compose.prod.yml up -d --scale backend-green=0 --scale frontend-green=0
    else
        log "Scaling down blue environment..."
        docker-compose -f docker-compose.prod.yml up -d --scale backend-blue=0 --scale frontend-blue=0
    fi

    # Start the target environment
    log "Starting $env environment..."
    if [[ "$env" == "blue" ]]; then
        docker-compose -f docker-compose.prod.yml up -d backend-blue frontend-blue
        health_check "backend-blue"
        health_check "frontend-blue"
    else
        docker-compose -f docker-compose.prod.yml --profile green up -d backend-green frontend-green
        health_check "backend-green"
        health_check "frontend-green"
    fi

    # Update nginx configuration
    update_nginx_config $env

    # Run database migrations if needed
    run_migrations

    log "Deployment to $env completed successfully"
}

# Update nginx configuration for traffic switching
update_nginx_config() {
    local env=$1
    log "Updating nginx configuration for $env..."

    # Create nginx configuration based on environment
    if [[ "$env" == "blue" ]]; then
        cat > docker/nginx/prod/upstream.conf << EOF
upstream backend {
    server backend-blue:5000;
}

upstream frontend {
    server frontend-blue:80;
}
EOF
    else
        cat > docker/nginx/prod/upstream.conf << EOF
upstream backend {
    server backend-green:5000;
}

upstream frontend {
    server frontend-green:80;
}
EOF
    fi

    # Reload nginx
    docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

    log "Nginx configuration updated"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."

    # Run migrations on the active backend
    docker-compose -f docker-compose.prod.yml exec backend-blue npm run migrate 2>/dev/null || \
    docker-compose -f docker-compose.prod.yml exec backend-green npm run migrate 2>/dev/null || \
    warn "No migration script found or migrations already up to date"
}

# Rollback deployment
rollback() {
    log "Starting rollback..."

    # Determine current active environment
    if docker-compose -f docker-compose.prod.yml ps backend-blue | grep -q "Up"; then
        local current_env="blue"
        local rollback_env="green"
    else
        local current_env="green"
        local rollback_env="blue"
    fi

    warn "Current active environment: $current_env"
    info "Rolling back to $rollback_env..."

    # Check if rollback environment is available
    if ! docker-compose -f docker-compose.prod.yml ps backend-$rollback_env | grep -q "Up"; then
        error "Rollback environment $rollback_env is not available"
        exit 1
    fi

    # Switch traffic to rollback environment
    update_nginx_config $rollback_env

    # Scale down current environment
    if [[ "$rollback_env" == "blue" ]]; then
        docker-compose -f docker-compose.prod.yml up -d --scale backend-green=0 --scale frontend-green=0
    else
        docker-compose -f docker-compose.prod.yml up -d --scale backend-blue=0 --scale frontend-blue=0
    fi

    log "Rollback completed successfully"
}

# Main deployment logic
main() {
    validate_environment
    check_prerequisites

    case $ACTION in
        deploy)
            pull_images
            deploy $DEPLOY_ENV
            ;;
        rollback)
            rollback
            ;;
        *)
            error "Unknown action: $ACTION"
            exit 1
            ;;
    esac

    log "Deployment script completed successfully"
}

# Run main function
main "$@"