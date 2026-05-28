// DATA SOURCES //
//////////////////
data "aws_caller_identity" "current" {}

// MISC VARIABLES //
////////////////////
variable "my_ip" {
  default   = "76.90.65.87/32"
}

variable "lambda_products_prod_arn" {
  default   = "arn:aws:lambda:us-west-2:238754394093:function:products-dev-searchText"
}

// CONFIG VARIABLES //
//////////////////////
variable "profile" {
  default   = "wuzinit"
}

variable "account" {
  default   = "2387-5439-4093"
}

variable "region" {
  default   = "us-west-2"
}

// DYNAMODB VARIABLES //
////////////////////////
variable "billing_mode" {
  default   = "PAY_PER_REQUEST"   // May want to change to PROVISIONED for production
}

variable "default_write_capacity" {
  default   = "2"
}

variable "default_read_capacity" {
  default   = "2"
}

variable "default_projection_type" {
  default   = "ALL"
}

// IAM VARIABLES//
//////////////////
variable "lambda_vpc_access_policy_arn" {
  default   = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

// S3 VARIABLES //
//////////////////
variable "product_images_bucket_name" {
  default   = "wuzinit-product-images-bucket"
}

// ELASTICSEARCH VARIABLES //
/////////////////////////////
variable "elasticsearch_default_version" {
  default   = "6.7"
}

variable "elasticsearch_domain_name_prod" {
  default   = "wuzinit-prod"
}

variable "elasticsearch_domain_name_vpc_prod" {
  default   = "wuzinit-vpc-prod"
}

variable "elasticsearch_instance_type_prod" {
  default   = "t2.medium.elasticsearch"
}

variable "elasticsearch_volume_size_prod" {
  default   = "10"
}

// CLOUDWATCH VARIABLES //
//////////////////////////
variable "elasticsearch_log_group_name_prod" {
  default   = "wuzinit-elasticsearch/wuzinit-prod"
}

// CODEBUILD VARIABLES //
/////////////////////////
variable "products_codebuild_name" {
  default   = "wuzinit-products-prod"
}

variable "profile_codebuild_name" {
  default   = "wuzinit-profile-prod"
}

variable "allergies_codebuild_name" {
  default   = "wuzinit-allergies-prod"
}

variable "medical_codebuild_name" {
  default   = "wuzinit-medical-prod"
}

variable "util_codebuild_name" {
  default   = "wuzinit-util-prod"
}

variable "codebuild_role_name" {
  default   = "wuzinit-codebuild-role"
}

variable "codebuild_logs_name" {
  default   = "wuzinit-codebuild-logs"
}

//
variable "codebuild_image_name" {
  default   = "wuzinit-codebuild-image"
}

