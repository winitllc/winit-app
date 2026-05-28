resource "aws_cloudfront_origin_access_identity" "wuzinit-product-images-access-identity" {}

resource "aws_cloudfront_distribution" "wuzinit-product-images-cloudfront-distro" {
    enabled     = true

    origin {
        domain_name = aws_s3_bucket.product_images_bucket.bucket_regional_domain_name
        origin_id   = "S3-${aws_s3_bucket.product_images_bucket.bucket_regional_domain_name}"

        s3_origin_config {
            origin_access_identity = aws_cloudfront_origin_access_identity.wuzinit-product-images-access-identity.cloudfront_access_identity_path
        }
    }

    default_cache_behavior {
        allowed_methods  = ["GET", "HEAD", "OPTIONS"]
        cached_methods   = ["GET", "HEAD"]
        target_origin_id = "S3-${aws_s3_bucket.product_images_bucket.bucket_regional_domain_name}"

        forwarded_values {
            query_string = false

            cookies {
                forward = "none"
            }
        }

        viewer_protocol_policy = "redirect-to-https"
        min_ttl                = 0
        default_ttl            = 3600
        max_ttl                = 86400
    }

    viewer_certificate {
        cloudfront_default_certificate = true
    }

    restrictions {
        geo_restriction {
            restriction_type = "whitelist"
            locations        = ["US", "CA", "GB", "DE"]
        }
    }

    logging_config {
        include_cookies = false
        bucket          = aws_s3_bucket.product_images_bucket_logs.bucket_regional_domain_name
    }
}
