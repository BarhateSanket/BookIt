terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "bookit-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
module "vpc" {
  source = "./modules/vpc"

  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  azs         = var.availability_zones
}

# Security Groups
module "security_groups" {
  source = "./modules/security-groups"

  environment = var.environment
  vpc_id      = module.vpc.vpc_id
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"

  environment         = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnets    = module.vpc.private_subnets
  public_subnets     = module.vpc.public_subnets
  security_groups    = [module.security_groups.ecs_sg_id]
  target_group_arn   = module.alb.target_group_arn
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"

  environment      = var.environment
  vpc_id          = module.vpc.vpc_id
  public_subnets  = module.vpc.public_subnets
  security_groups = [module.security_groups.alb_sg_id]
  certificate_arn = var.certificate_arn
}

# RDS MongoDB
module "documentdb" {
  source = "./modules/documentdb"

  environment         = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnets    = module.vpc.private_subnets
  security_groups    = [module.security_groups.documentdb_sg_id]
  instance_class     = var.documentdb_instance_class
  cluster_size       = var.documentdb_cluster_size
}

# ElastiCache Redis
module "elasticache" {
  source = "./modules/elasticache"

  environment      = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  security_groups = [module.security_groups.elasticache_sg_id]
  node_type       = var.redis_node_type
}

# CloudFront CDN
module "cloudfront" {
  source = "./modules/cloudfront"

  environment     = var.environment
  alb_domain_name = module.alb.alb_domain_name
  certificate_arn = var.certificate_arn
}

# Route 53
module "route53" {
  source = "./modules/route53"

  domain_name     = var.domain_name
  cloudfront_arn = module.cloudfront.cloudfront_arn
}

# Monitoring and Logging
module "monitoring" {
  source = "./modules/monitoring"

  environment = var.environment
  region     = var.aws_region
}

# WAF
module "waf" {
  source = "./modules/waf"

  environment = var.environment
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = module.cloudfront.domain_name
}

output "documentdb_endpoint" {
  description = "DocumentDB endpoint"
  value       = module.documentdb.endpoint
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.elasticache.endpoint
}