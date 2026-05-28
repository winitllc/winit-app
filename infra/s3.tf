resource "aws_s3_bucket" "codebuild_logs" {
  bucket = var.codebuild_logs_name
  acl    = "private"
}

resource "aws_s3_bucket" "product_images_bucket" {
  bucket = var.product_images_bucket_name
  acl    = "private"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["HEAD", "GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket" "product_images_bucket_logs" {
  bucket = "wuzinit-product-images-bucket-logs"
  acl    = "private"
}

resource "aws_s3_bucket_policy" "cloudfront-s3-policy" {
  bucket  = aws_s3_bucket.product_images_bucket.id
  policy = <<POLICY
{
  "Version": "2008-10-17",
  "Id": "PolicyForCloudFrontPrivateContent",
  "Statement": [
    {
      "Sid": "1",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${aws_cloudfront_origin_access_identity.wuzinit-product-images-access-identity.iam_arn}"
      },
      "Action": "s3:GetObject",
      "Resource": "${aws_s3_bucket.product_images_bucket.arn}/*"
    }
  ]
}
POLICY
}
