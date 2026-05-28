resource "aws_ecr_repository" "codebuild_image" {
  name = var.codebuild_image_name
}
