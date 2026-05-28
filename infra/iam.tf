// DEV IAM //
resource "aws_iam_group" "wuzinit-dev-user-group" {
  name = "WuzinitDevUserGroup"
  path = "/wuzinit/"
}

resource "aws_iam_group_policy" "wuzinit-dev-user-group-policy" {
  name  = "WuzinitDevUserGroupPolicy"
  group = aws_iam_group.wuzinit-dev-user-group.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "dynamodb:BatchGetItem",
        "dynamodb:DescribeTable",
        "dynamodb:Get*",
        "dynamodb:List*",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

// WUZINIT APP IAM //
/////////////////////
resource "aws_iam_user" "wuzinit-app-user" {
  name = "WuzinitAppUser"
  path = "/wuzinit/"

  tags = {
    Environment = "production"
  }
}

resource "aws_iam_group" "wuzinit-app-user-group" {
  name = "WuzinitAppUserGroup"
  path = "/wuzinit/"
}

resource "aws_iam_group_policy" "wuzinit-app-user-group-policy" {
  name  = "WuzinitAppUserGroupPolicy"
  group = aws_iam_group.wuzinit-app-user-group.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "s3:List*",
        "s3:PutObject*"
      ],
      "Effect": "Allow",
      "Resource": "${aws_s3_bucket.product_images_bucket.arn}/*"
    },
    {
      "Action": [
        "rekognition:DetectText"
      ],
      "Effect": "Allow",
      "Resource": "*"
    },
    {
      "Action": [
        "textract:AnalyzeDocument",
        "textract:DetectDocumentText"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_iam_user_group_membership" "wuzinit-app-user" {
  user = aws_iam_user.wuzinit-app-user.name

  groups = [
    aws_iam_group.wuzinit-app-user-group.name
  ]
}

// LAMBDA IAM //
////////////////
resource "aws_iam_role" "lambda_role" {
  name = "WuzinitLambdaRole"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF

  tags = {
    Environment = "production"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access_role_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = var.lambda_vpc_access_policy_arn
}

resource "aws_iam_role_policy" "lambda_role_policy" {
  name = "WuzinitLambdaPolicy"
  role = aws_iam_role.lambda_role.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "dynamodb:Batch*",
        "dynamodb:ConditionCheckItem",
        "dynamodb:DeleteItem",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:dynamodb:us-west-2:238754394093:table/*"
    },
    {
      "Action": [
        "logs:*"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:logs:us-west-2:238754394093:log-group:/aws/lambda/*"
    },
    {
      "Action": [
        "es:ESHttp*"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:es:${var.region}:${data.aws_caller_identity.current.account_id}:domain/*"
    },
    {
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

// CODEBUILD IAM //
///////////////////
resource "aws_iam_role" "codebuild_role" {
  name = var.codebuild_role_name

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "codebuild_role_policy" {
  role = aws_iam_role.codebuild_role.name

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:us-west-2:238754394093:log-group:*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:*"
      ],
      "Resource": [
        "${aws_s3_bucket.codebuild_logs.arn}",
        "${aws_s3_bucket.codebuild_logs.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:List*",
        "ecr:Get*",
        "ecr:Describe*",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability"
      ],
      "Resource": [
        "*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:*"
      ],
      "Resource": [
        "arn:aws:lambda:us-west-2:238754394093:*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "apigateway:*"
      ],
      "Resource": [
        "arn:aws:apigateway:us-west-2::*"
      ]
    }
  ]
}
POLICY
}
