resource "aws_kms_key" "default_key" {
  description = "Default KMS key for Wuzinit"
  
  policy      = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::238754394093:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "${aws_iam_role.lambda_role.arn}"
      },
      "Action": [
        "kms:Decrypt",
        "kms:ListAliases",
        "kms:ListKeys",
        "kms:DescribeKey"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}
