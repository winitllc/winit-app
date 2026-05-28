resource "aws_dynamodb_table" "allergy" {
  name           = "Allergy"
  billing_mode   = var.billing_mode
  # read_capacity  = var.default_read_capacity
  # write_capacity = var.default_write_capacity
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name        = "Allergy"
    Environment = "production"
  }
}

resource "aws_dynamodb_table" "medical" {
  name           = "Medical"
  billing_mode   = var.billing_mode
  # read_capacity  = var.default_read_capacity
  # write_capacity = var.default_write_capacity
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name        = "Medical"
    Environment = "production"
  }
}

resource "aws_dynamodb_table" "lifestyle" {
  name           = "Lifestyle"
  billing_mode   = var.billing_mode
  # read_capacity  = var.default_read_capacity
  # write_capacity = var.default_write_capacity
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name        = "Lifestyle"
    Environment = "production"
  }
}

resource "aws_dynamodb_table" "ingredient" {
  name           = "Ingredient"
  billing_mode   = var.billing_mode
  # read_capacity  = var.default_read_capacity
  # write_capacity = var.default_write_capacity
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name        = "Ingredient"
    Environment = "production"
  }
}

resource "aws_dynamodb_table" "user" {
  name           = "User"
  billing_mode   = var.billing_mode
  # read_capacity  = var.default_read_capacity
  # write_capacity = var.default_write_capacity
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name               = "User_EmailIndex"
    hash_key           = "email"
    projection_type    = var.default_projection_type
    # write_capacity     = var.default_write_capacity
    # read_capacity      = var.default_read_capacity
  }

  tags = {
    Name        = "User"
    Environment = "production"
  }
}

resource "aws_dynamodb_table" "profile" {
  name           = "Profile"
  billing_mode   = var.billing_mode
  # read_capacity  = var.default_read_capacity
  # write_capacity = var.default_write_capacity
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "primaryUserEmail"
    type = "S"
  }

  global_secondary_index {
    name               = "Profile_EmailIndex"
    hash_key           = "primaryUserEmail"
    projection_type    = var.default_projection_type
    # write_capacity     = var.default_write_capacity
    # read_capacity      = var.default_read_capacity
  }

  tags = {
    Name        = "Profile"
    Environment = "production"
  }
}

# resource "aws_dynamodb_table" "product" {
#   name           = "Product"
#   billing_mode   = var.billing_mode
#   # read_capacity  = var.default_read_capacity
#   # write_capacity = var.default_write_capacity
#   hash_key       = "code"

#   attribute {
#     name = "code"
#     type = "S"
#   }

#   tags = {
#     Name        = "Product"
#     Environment = "production"
#   }
# }

resource "aws_dynamodb_table" "product-updates" {
  name           = "ProductUpdates"
  billing_mode   = var.billing_mode
  # read_capacity  = var.default_read_capacity
  # write_capacity = var.default_write_capacity
  hash_key       = "code"

  attribute {
    name = "code"
    type = "S"
  }

  tags = {
    Name        = "ProductUpdates"
    Environment = "production"
  }
}

resource "aws_dynamodb_table" "wuzinit-points" {
  name           = "WuzinitPoints"
  billing_mode   = var.billing_mode
  # read_capacity  = var.default_read_capacity
  # write_capacity = var.default_write_capacity
  hash_key       = "profileId"

  attribute {
    name = "profileId"
    type = "S"
  }

  tags = {
    Name        = "WuzinitPoints"
    Environment = "production"
  }
}

resource "aws_dynamodb_table" "wuzinit-in-app-purchase-confirmation" {
  name           = "WuzinitInAppPurchaseConfirmations"
  billing_mode   = var.billing_mode
  # read_capacity  = var.default_read_capacity
  # write_capacity = var.default_write_capacity
  hash_key       = "profileId"
  range_key       = "transactionId"

  attribute {
    name = "profileId"
    type = "S"
  }

  attribute {
    name = "transactionId"
    type = "S"
  }

  tags = {
    Name        = "WuzinitInAppPurchaseConfirmations"
    Environment = "production"
  }
}

resource "aws_dynamodb_table" "wuzinit-premium-feature" {
  name           = "WuzinitPremiumFeature"
  billing_mode   = var.billing_mode
  # read_capacity  = var.default_read_capacity
  # write_capacity = var.default_write_capacity
  hash_key       = "featureId"

  attribute {
    name = "featureId"
    type = "S"
  }

  tags = {
    Name        = "WuzinitPremiumFeature"
    Environment = "production"
  }
}

resource "aws_dynamodb_table" "wuzinit-premium-feature-purchase" {
  name           = "WuzinitPremiumFeaturePurchase"
  billing_mode   = var.billing_mode
  # read_capacity  = var.default_read_capacity
  # write_capacity = var.default_write_capacity
  hash_key       = "profileId"
  range_key       = "transactionId"

  attribute {
    name = "profileId"
    type = "S"
  }

  attribute {
    name = "transactionId"
    type = "S"
  }

  tags = {
    Name        = "WuzinitPremiumFeaturePurchase"
    Environment = "production"
  }
}
