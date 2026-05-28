resource "aws_cognito_user_pool" "wuzinit-users" {
  name                      = "wuzinit-users-pool"
  auto_verified_attributes  = ["email"]
  
  admin_create_user_config  {
    allow_admin_create_user_only  = false
  }

  verification_message_template {
    email_message = "Please verify your email. {####}"
    email_subject = "Welcome to Wuzinit!"
  }

  schema {
    attribute_data_type       = "String"
    developer_only_attribute  = false
    mutable                   = false
    name                      = "email"
    required                  = true

    string_attribute_constraints {
      max_length = "2048"
      min_length = "7"
    }
  }

  email_configuration {
    email_sending_account   = "COGNITO_DEFAULT"
  }

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
  }

  tags = {
    Name        = "UserPool"
    Environment = "production"
  }
}

resource "aws_cognito_user_pool_client" "wuzinit-client" {
  name            = "wuzinit-client"
  user_pool_id    = aws_cognito_user_pool.wuzinit-users.id
  generate_secret = true

  allowed_oauth_flows                   = ["code", "implicit"]
  allowed_oauth_flows_user_pool_client  = true
  allowed_oauth_scopes                  = ["phone", "email", "openid"]
  callback_urls                         = ["https://localhost/login-success"]
  logout_urls                           = ["https://localhost/logout-success"]
  supported_identity_providers          = ["COGNITO"]
}

resource "aws_cognito_user_pool_domain" "wuzinit-domain" {
  domain       = "wuzinit"
  user_pool_id = aws_cognito_user_pool.wuzinit-users.id
}

resource "aws_cognito_resource_server" "resource" {
  identifier = "https://wuzinit.com"
  name       = "wuzinit-resource-server"

  user_pool_id = aws_cognito_user_pool.wuzinit-users.id
}

# resource "aws_cognito_identity_provider" "google_provider" {
#   user_pool_id  = "${aws_cognito_user_pool.wuzinit-users.id}"
#   provider_name = "Google"
#   provider_type = "Google"

#   provider_details = {
#     authorize_scopes = "email"
#     client_id        = "your client_id"
#     client_secret    = "your client_secret"
#   }

#   attribute_mapping = {
#     email    = "email"
#     username = "sub"
#   }
# }
