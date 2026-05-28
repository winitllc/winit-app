resource "aws_cloudwatch_log_group" "wuzinit_elasticsearch_prod" {
  name = var.elasticsearch_log_group_name_prod
}

resource "aws_cloudwatch_log_resource_policy" "wuzinit_elasticsearch_resource_policy_prod" {
  policy_name = var.elasticsearch_log_group_name_prod

  policy_document = <<CONFIG
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "es.amazonaws.com"
      },
      "Action": [
        "logs:PutLogEvents",
        "logs:PutLogEventsBatch",
        "logs:CreateLogStream"
      ],
      "Resource": "${aws_cloudwatch_log_group.wuzinit_elasticsearch_prod.arn}"
    }
  ]
}
CONFIG
}
