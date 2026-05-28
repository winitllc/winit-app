// PROFILE SERVICE //
/////////////////////
resource "aws_codebuild_project" "profile_codebuild" {
  name          = var.profile_codebuild_name
  description   = "pipeline for prod profile service"
  build_timeout = "5"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  cache {
    type  = "LOCAL"
    modes = ["LOCAL_DOCKER_LAYER_CACHE", "LOCAL_SOURCE_CACHE"]
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "${aws_ecr_repository.codebuild_image.repository_url}:latest"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"
  }

  source {
    type            = "BITBUCKET"
    location        = "https://bitbucket.org/glennium/wuzinit-serverless-backend.git"
    git_clone_depth = 1

    auth {
        type    = "OAUTH"
    }

    buildspec   = <<EOF
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 10
    commands:
      - echo Install phase started on `date`
      - cd profile
    finally:
      - echo Install phase completed on `date`
  pre_build:
    commands:
      - echo Pre-Test phase started on `date`
      - npm i
    finally:
      - echo Pre-Test phase completed on `date`
  build:
    commands:
      - echo Test phase started on `date`
    finally:
      - echo Test phase completed on `date`
  post_build:
    commands:
      - echo Deploy phase started on `date`
      - npm run prod -- --force
    finally:
      - echo Deploy phase completed on `date`
    EOF
  }

  logs_config {
    cloudwatch_logs {
      group_name = "log-group"
      stream_name = "log-stream"
    }

    s3_logs {
      status = "ENABLED"
      location = "${aws_s3_bucket.codebuild_logs.id}/prod-build-log/${var.profile_codebuild_name}"
    }
  }

  tags = {
    Environment = "Prod"
  }
}

resource "aws_codebuild_webhook" "profile_codebuild_webhook" {
  project_name = aws_codebuild_project.profile_codebuild.name

  filter_group {
    filter {
      type = "EVENT"
      pattern = "PUSH"
    }

    filter {
      type = "HEAD_REF"
      pattern = "master"
    }
  }
}

// PRODUCTS SERVICE //
//////////////////////
resource "aws_codebuild_project" "products_codebuild" {
  name          = var.products_codebuild_name
  description   = "pipeline for prod products service"
  build_timeout = "5"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  cache {
    type  = "LOCAL"
    modes = ["LOCAL_DOCKER_LAYER_CACHE", "LOCAL_SOURCE_CACHE"]
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "${aws_ecr_repository.codebuild_image.repository_url}:latest"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"
  }

  source {
    type            = "BITBUCKET"
    location        = "https://bitbucket.org/glennium/wuzinit-serverless-backend.git"
    git_clone_depth = 1

    auth {
        type    = "OAUTH"
    }

    buildspec   = <<EOF
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 10
    commands:
      - echo Install phase started on `date`
      - cd products
    finally:
      - echo Install phase completed on `date`
  pre_build:
    commands:
      - echo Pre-Test phase started on `date`
      - npm i
    finally:
      - echo Pre-Test phase completed on `date`
  build:
    commands:
      - echo Test phase started on `date`
    finally:
      - echo Test phase completed on `date`
  post_build:
    commands:
      - echo Deploy phase started on `date`
      - npm run prod -- --force
    finally:
      - echo Deploy phase completed on `date`
    EOF
  }

  logs_config {
    cloudwatch_logs {
      group_name = "log-group"
      stream_name = "log-stream"
    }

    s3_logs {
      status = "ENABLED"
      location = "${aws_s3_bucket.codebuild_logs.id}/prod-build-log/${var.products_codebuild_name}"
    }
  }

  tags = {
    Environment = "Prod"
  }
}

resource "aws_codebuild_webhook" "products_codebuild_webhook" {
  project_name = aws_codebuild_project.products_codebuild.name

  filter_group {
    filter {
      type = "EVENT"
      pattern = "PUSH"
    }

    filter {
      type = "HEAD_REF"
      pattern = "master"
    }
  }
}

// ALLERGIES SERVICE //
///////////////////////
resource "aws_codebuild_project" "allergies_codebuild" {
  name          = var.allergies_codebuild_name
  description   = "pipeline for prod allergies service"
  build_timeout = "5"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  cache {
    type  = "LOCAL"
    modes = ["LOCAL_DOCKER_LAYER_CACHE", "LOCAL_SOURCE_CACHE"]
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "${aws_ecr_repository.codebuild_image.repository_url}:latest"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"
  }

  source {
    type            = "BITBUCKET"
    location        = "https://bitbucket.org/glennium/wuzinit-serverless-backend.git"
    git_clone_depth = 1

    auth {
        type    = "OAUTH"
    }

    buildspec   = <<EOF
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 10
    commands:
      - echo Install phase started on `date`
      - cd allergies
    finally:
      - echo Install phase completed on `date`
  pre_build:
    commands:
      - echo Pre-Test phase started on `date`
      - npm i
    finally:
      - echo Pre-Test phase completed on `date`
  build:
    commands:
      - echo Test phase started on `date`
    finally:
      - echo Test phase completed on `date`
  post_build:
    commands:
      - echo Deploy phase started on `date`
      - npm run prod -- --force
    finally:
      - echo Deploy phase completed on `date`
    EOF
  }

  logs_config {
    cloudwatch_logs {
      group_name = "log-group"
      stream_name = "log-stream"
    }

    s3_logs {
      status = "ENABLED"
      location = "${aws_s3_bucket.codebuild_logs.id}/prod-build-log/${var.allergies_codebuild_name}"
    }
  }

  tags = {
    Environment = "Prod"
  }
}

resource "aws_codebuild_webhook" "allergies_codebuild_webhook" {
  project_name = aws_codebuild_project.allergies_codebuild.name

  filter_group {
    filter {
      type = "EVENT"
      pattern = "PUSH"
    }

    filter {
      type = "HEAD_REF"
      pattern = "master"
    }
  }
}

// MEDICAL CONDITIONS SERVICE //
////////////////////////////////
resource "aws_codebuild_project" "medical_codebuild" {
  name          = var.medical_codebuild_name
  description   = "pipeline for prod medical conditions service"
  build_timeout = "5"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  cache {
    type  = "LOCAL"
    modes = ["LOCAL_DOCKER_LAYER_CACHE", "LOCAL_SOURCE_CACHE"]
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "${aws_ecr_repository.codebuild_image.repository_url}:latest"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"
  }

  source {
    type            = "BITBUCKET"
    location        = "https://bitbucket.org/glennium/wuzinit-serverless-backend.git"
    git_clone_depth = 1

    auth {
        type    = "OAUTH"
    }

    buildspec   = <<EOF
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 10
    commands:
      - echo Install phase started on `date`
      - cd medicalConditions
    finally:
      - echo Install phase completed on `date`
  pre_build:
    commands:
      - echo Pre-Test phase started on `date`
      - npm i
    finally:
      - echo Pre-Test phase completed on `date`
  build:
    commands:
      - echo Test phase started on `date`
    finally:
      - echo Test phase completed on `date`
  post_build:
    commands:
      - echo Deploy phase started on `date`
      - npm run prod -- --force
    finally:
      - echo Deploy phase completed on `date`
    EOF
  }

  logs_config {
    cloudwatch_logs {
      group_name = "log-group"
      stream_name = "log-stream"
    }

    s3_logs {
      status = "ENABLED"
      location = "${aws_s3_bucket.codebuild_logs.id}/prod-build-log/${var.medical_codebuild_name}"
    }
  }

  tags = {
    Environment = "Prod"
  }
}

resource "aws_codebuild_webhook" "medical_codebuild_webhook" {
  project_name = aws_codebuild_project.medical_codebuild.name

  filter_group {
    filter {
      type = "EVENT"
      pattern = "PUSH"
    }

    filter {
      type = "HEAD_REF"
      pattern = "master"
    }
  }
}

// UTIL SERVICE //
//////////////////
resource "aws_codebuild_project" "util_codebuild" {
  name          = var.util_codebuild_name
  description   = "pipeline for prod util service"
  build_timeout = "5"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  cache {
    type  = "LOCAL"
    modes = ["LOCAL_DOCKER_LAYER_CACHE", "LOCAL_SOURCE_CACHE"]
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "${aws_ecr_repository.codebuild_image.repository_url}:latest"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "SERVICE_ROLE"
  }

  source {
    type            = "BITBUCKET"
    location        = "https://bitbucket.org/glennium/wuzinit-serverless-backend.git"
    git_clone_depth = 1

    auth {
        type    = "OAUTH"
    }

    buildspec   = <<EOF
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 10
    commands:
      - echo Install phase started on `date`
      - cd util
    finally:
      - echo Install phase completed on `date`
  pre_build:
    commands:
      - echo Pre-Test phase started on `date`
      - npm i
    finally:
      - echo Pre-Test phase completed on `date`
  build:
    commands:
      - echo Test phase started on `date`
    finally:
      - echo Test phase completed on `date`
  post_build:
    commands:
      - echo Deploy phase started on `date`
      - npm run prod -- --force
    finally:
      - echo Deploy phase completed on `date`
    EOF
  }

  logs_config {
    cloudwatch_logs {
      group_name = "log-group"
      stream_name = "log-stream"
    }

    s3_logs {
      status = "ENABLED"
      location = "${aws_s3_bucket.codebuild_logs.id}/prod-build-log/${var.util_codebuild_name}"
    }
  }

  tags = {
    Environment = "Prod"
  }
}

resource "aws_codebuild_webhook" "util_codebuild_webhook" {
  project_name = aws_codebuild_project.util_codebuild.name

  filter_group {
    filter {
      type = "EVENT"
      pattern = "PUSH"
    }

    filter {
      type = "HEAD_REF"
      pattern = "master"
    }
  }
}
