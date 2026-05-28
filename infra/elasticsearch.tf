resource "aws_elasticsearch_domain" "wuzinit_elasticsearch_prod" {
  domain_name           = var.elasticsearch_domain_name_prod
  elasticsearch_version = var.elasticsearch_default_version

  cluster_config {
    instance_type = var.elasticsearch_instance_type_prod
  }

  ebs_options {
    ebs_enabled = "true"
    volume_size = var.elasticsearch_volume_size_prod
  }

  access_policies = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "es:*",
      "Principal": "*",
      "Effect": "Allow",
      "Resource": "arn:aws:es:${var.region}:${data.aws_caller_identity.current.account_id}:domain/${var.elasticsearch_domain_name_prod}/*",
      "Condition": {
        "IpAddress": {"aws:SourceIp": "${aws_nat_gateway.wuzinit_nat.public_ip}"}
      }
    },
    {
      "Action": "es:*",
      "Principal": "*",
      "Effect": "Allow",
      "Resource": "arn:aws:es:${var.region}:${data.aws_caller_identity.current.account_id}:domain/${var.elasticsearch_domain_name_prod}/*",
      "Condition": {
        "IpAddress": {"aws:SourceIp": "${var.my_ip}"}
      }
    }
  ]
}
POLICY

  tags = {
    Environment = "production"
  }
}
